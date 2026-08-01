import Stripe from "stripe";
import { Resend } from "resend";
import { NextRequest } from "next/server";
import { adminDb } from "../../../lib/firebase-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-05-27.dahlia",
});

const resend = new Resend(process.env.RESEND_API_KEY);

function confirmationEmail(customerEmail: string, name: string, company: string): string {
  const displayName = name || customerEmail;
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafd;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafd;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;border:1px solid #e5edf5;overflow:hidden;max-width:560px">
        <!-- Header -->
        <tr>
          <td style="background:#061b31;padding:28px 36px">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#533afd;border-radius:6px;width:26px;height:26px;text-align:center;vertical-align:middle">
                  <span style="color:#ffffff;font-size:12px;font-weight:700">▲</span>
                </td>
                <td style="padding-left:10px;color:#ffffff;font-size:15px;font-weight:600;letter-spacing:-0.01em">AuditAI</td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 36px 28px">
            <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#50617a;letter-spacing:0.5px">ORDER CONFIRMED</p>
            <h1 style="margin:0 0 20px;font-size:26px;font-weight:300;color:#061b31;letter-spacing:-0.025em;line-height:1.2">
              Your assessment is booked${company ? `, ${company}` : ""}.
            </h1>
            <p style="margin:0 0 24px;font-size:15px;color:#50617a;line-height:1.7">
              Hi ${displayName},<br><br>
              Thanks for ordering your AI Business Assessment. A senior consultant will begin reviewing your business within 1 business day and deliver your full report within <strong style="color:#061b31">5 business days</strong>.
            </p>

            <!-- What happens next -->
            <table cellpadding="0" cellspacing="0" width="100%" style="background:#f8fafd;border-radius:8px;border:1px solid #e5edf5;margin-bottom:24px">
              <tr><td style="padding:20px 22px">
                <p style="margin:0 0 14px;font-size:11px;font-weight:700;color:#64748d;letter-spacing:0.5px">WHAT HAPPENS NEXT</p>
                ${["Within 24 hours — You'll receive an intake form. It takes about 30 minutes.", "Days 1–5 — A senior consultant audits your tools, pricing, processes, and team.", "Day 5 — Your full written report is delivered with a 90-day prioritized roadmap.", "Day 5+ — We schedule a 60-minute findings call to walk through every recommendation."].map((step, i) => `
                <table cellpadding="0" cellspacing="0" style="margin-bottom:${i < 3 ? "12px" : "0"}">
                  <tr>
                    <td style="width:22px;vertical-align:top;padding-top:1px">
                      <div style="width:18px;height:18px;background:#ede9ff;border-radius:50%;text-align:center;line-height:18px;font-size:10px;font-weight:700;color:#533afd">${i + 1}</div>
                    </td>
                    <td style="padding-left:10px;font-size:13px;color:#50617a;line-height:1.55">${step}</td>
                  </tr>
                </table>`).join("")}
              </td></tr>
            </table>

            <!-- CTA -->
            <p style="margin:0 0 20px;font-size:14px;color:#50617a;line-height:1.65">
              Questions in the meantime? Just reply to this email — we respond within a few hours.
            </p>

            <!-- Guarantee reminder -->
            <table cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid #e5edf5;padding-top:20px;margin-top:4px">
              <tr>
                <td style="font-size:12px;color:#64748d">
                  <strong style="color:#061b31">30-day money-back guarantee</strong> — if you don't identify at least $997 in actionable savings, we'll refund every dollar.
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafd;border-top:1px solid #e5edf5;padding:18px 36px;text-align:center">
            <p style="margin:0;font-size:11px;color:#64748d">© 2026 AuditAI · <a href="https://auditai.co" style="color:#533afd;text-decoration:none">auditai.co</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// Next.js App Router: read raw body for Stripe signature verification
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

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const customerEmail = session.customer_email ?? "";
    const name = (session.metadata?.name ?? "").trim();
    const company = (session.metadata?.company ?? "").trim();

    try {
      await adminDb.collection("orders").doc(session.id).set({
        sessionId: session.id,
        company: company || "Direct Customer",
        contact: name || customerEmail,
        email: customerEmail,
        status: "paid",
        createdAt: new Date().toISOString(),
        amount: session.amount_total ? session.amount_total / 100 : 997,
      }, { merge: true });
    } catch (dbErr) {
      console.error("Failed to save order to Firestore:", dbErr);
    }

    if (customerEmail) {
      try {
        await resend.emails.send({
          from: process.env.FROM_EMAIL ?? "hello@auditai.co",
          to: customerEmail,
          subject: "Your AuditAI assessment is confirmed",
          html: confirmationEmail(customerEmail, name, company),
        });
      } catch (err) {
        console.error("Failed to send confirmation email:", err);
        // Don't fail the webhook — email is non-critical
      }
    }
  }

  return Response.json({ received: true });
}
