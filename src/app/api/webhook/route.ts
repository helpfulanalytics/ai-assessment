import Stripe from "stripe";
import { Resend } from "resend";
import { NextRequest } from "next/server";
import { adminDb } from "../../../lib/firebase-admin";
import { getSession, updateSession } from "../../../lib/session";
import { interviewReadyEmail } from "../../../lib/emails";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-05-27.dahlia",
});

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Stripe is the only thing that may unlock a session. The client is never trusted
 * to report its own payment, so this handler is the single write that moves a
 * session out of "awaiting_payment".
 */
export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature") ?? "";
  const body = await req.arrayBuffer();
  const rawBody = Buffer.from(body);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET ?? "");
  } catch {
    return new Response(`Webhook signature verification failed`, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return Response.json({ received: true });
  }

  const checkout = event.data.object as Stripe.Checkout.Session;
  const sessionId = checkout.metadata?.sessionId ?? "";
  const session = sessionId ? await getSession(sessionId) : null;

  if (!session) {
    console.error(`[webhook] paid checkout ${checkout.id} has no matching session (metadata.sessionId=${sessionId || "missing"}).`);
    return Response.json({ received: true });
  }

  // Upfront payers now get to start talking; report payers unlock generation.
  await updateSession(session.id, { status: session.paywall === "upfront" ? "chat" : "paid" });

  try {
    await adminDb.collection("orders").doc(checkout.id).set({
      sessionId: session.id,
      stripeSessionId: checkout.id,
      company: session.company,
      contact: session.contact,
      email: session.email,
      paywall: session.paywall,
      status: "paid",
      amount: checkout.amount_total ? checkout.amount_total / 100 : null,
      createdAt: new Date().toISOString(),
    }, { merge: true });
  } catch (dbErr) {
    console.error("[webhook] failed to record order:", dbErr);
  }

  // Upfront payers need the link into their interview. Report payers are already
  // on the success page watching their report generate, and get the report email
  // from the generator instead.
  if (session.paywall === "upfront" && session.email) {
    const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
    try {
      await resend.emails.send({
        from: process.env.FROM_EMAIL ?? "support@erasefriction.com",
        to: session.email,
        subject: "Your AI opportunity assessment — start your interview",
        html: interviewReadyEmail({
          name: session.contact,
          company: session.company,
          discoveryUrl: `${baseUrl}/discovery?s=${session.id}`,
        }),
      });
    } catch (err) {
      console.error("[webhook] confirmation email failed:", err);
    }
  }

  return Response.json({ received: true });
}
