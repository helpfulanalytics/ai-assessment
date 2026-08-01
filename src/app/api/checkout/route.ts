import Stripe from "stripe";
import { NextRequest } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-05-27.dahlia",
});

export async function POST(req: NextRequest) {
  const { name, email, company } = await req.json();

  if (!email) {
    return Response.json({ error: "email is required" }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID,
        quantity: 1,
      },
    ],
    customer_email: email,
    metadata: { name: name ?? "", company: company ?? "" },
    success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/#pricing`,
    payment_intent_data: {
      metadata: { name: name ?? "", company: company ?? "", email },
    },
  });

  return Response.json({ url: session.url });
}
