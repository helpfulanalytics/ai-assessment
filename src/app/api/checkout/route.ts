import Stripe from "stripe";
import { NextRequest } from "next/server";
import {
  ASSESSMENT_PRICE_USD,
  createSession,
  getSession,
  isChatComplete,
  paywallPosition,
  updateSession,
} from "../../../lib/session";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-05-27.dahlia",
});

/**
 * A configured Price is preferred so Stripe reporting stays clean, but an inline
 * price keeps the flow working in a fresh environment where none exists yet.
 */
function lineItem(): Stripe.Checkout.SessionCreateParams.LineItem {
  if (process.env.STRIPE_PRICE_ID) {
    return { price: process.env.STRIPE_PRICE_ID, quantity: 1 };
  }
  return {
    quantity: 1,
    price_data: {
      currency: "usd",
      unit_amount: ASSESSMENT_PRICE_USD * 100,
      product_data: {
        name: "AI Opportunity Assessment",
        description: "A discovery interview and a written assessment of where your business is losing time.",
      },
    },
  };
}

function isValidEmail(v: unknown): v is string {
  return typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
  const paywall = paywallPosition();

  let sessionId: string;
  let email: string;

  if (paywall === "report") {
    // The client has already been interviewed; this is the wall in front of the result.
    const existing = await getSession(typeof body.sessionId === "string" ? body.sessionId : "");
    if (!existing) {
      return Response.json({ error: "Session not found." }, { status: 404 });
    }
    if (!isChatComplete(existing)) {
      return Response.json({ error: "Finish the interview first." }, { status: 409 });
    }
    sessionId = existing.id;
    email = existing.email;
  } else {
    // Upfront: nothing exists yet. The session is created here, blocked, and the
    // webhook is what releases it — so a cancelled checkout can never start a chat.
    const { name, email: rawEmail, company } = body as { name?: string; email?: string; company?: string };
    if (!isValidEmail(rawEmail)) {
      return Response.json({ error: "A valid email is required." }, { status: 400 });
    }
    const created = await createSession({
      email: rawEmail.trim(),
      company: (company ?? "").trim() || "Your business",
      contact: (name ?? "").trim() || rawEmail.trim(),
      status: "awaiting_payment",
      paywall: "upfront",
    });
    sessionId = created.id;
    email = created.email;
  }

  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [lineItem()],
    customer_email: email,
    metadata: { sessionId },
    payment_intent_data: { metadata: { sessionId, email } },
    success_url: `${baseUrl}/success?s=${sessionId}`,
    cancel_url: paywall === "report" ? `${baseUrl}/discovery?s=${sessionId}` : `${baseUrl}/#pricing`,
  });

  await updateSession(sessionId, { stripeSessionId: checkout.id });

  return Response.json({ url: checkout.url });
}
