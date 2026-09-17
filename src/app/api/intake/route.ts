import { NextResponse } from "next/server";
import { Resend } from "resend";

/**
 * v1 intake. The landing page's only conversion path: collect the enquiry and
 * mail it to Brooks. No Stripe, no interview, no stored record — the flow ends
 * at the thank-you state, and follow-up happens by email.
 */

const resend = new Resend(process.env.RESEND_API_KEY);

const TO_EMAIL = process.env.INTAKE_TO_EMAIL ?? "brooks@erasefriction.com";
const FROM_EMAIL = process.env.FROM_EMAIL ?? "support@erasefriction.com";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Keeps a submitted value from breaking out of the HTML email. */
function esc(v: string) {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function row(label: string, value: string) {
  if (!value) return "";
  return `<tr>
    <td style="padding:10px 0;vertical-align:top;width:230px;color:#5f6774;font-size:13px">${esc(label)}</td>
    <td style="padding:10px 0;vertical-align:top;color:#1a1a1a;font-size:14px;line-height:1.6">${esc(value).replace(/\n/g, "<br>")}</td>
  </tr>`;
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const str = (k: string) => (typeof body[k] === "string" ? (body[k] as string).trim() : "");

  // Honeypot: real people leave it empty. Answer 200 so a bot sees success and
  // doesn't retry with the field cleared.
  if (str("company_website")) {
    return NextResponse.json({ ok: true });
  }

  const name = str("name");
  const email = str("email");
  const business = str("business");

  // The interview answers arrive as ordered question/answer pairs, so new or
  // reordered questions need no change here.
  const raw = Array.isArray(body.answers) ? body.answers : [];
  const answers = raw
    .map((a) => {
      const r = a as Record<string, unknown>;
      return {
        question: typeof r.question === "string" ? r.question.trim() : "",
        answer: typeof r.answer === "string" ? r.answer.trim() : "",
      };
    })
    .filter((a) => a.question);

  // The v1 gate asks name / business / email only; task and tools stay
  // optional so a longer form can post the same shape later without a change.
  if (!name || !email) {
    return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "That doesn't look like a valid email address." }, { status: 400 });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error("[intake] RESEND_API_KEY is not set — enquiry not delivered:", { name, email });
    return NextResponse.json({ error: "Email is not configured on the server." }, { status: 500 });
  }

  const html = `<!DOCTYPE html><html><body style="margin:0;padding:24px;background:#f5f4f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table role="presentation" style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:28px">
    <tr><td>
      <p style="margin:0 0 4px;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#0f766e">New assessment enquiry</p>
      <p style="margin:0 0 20px;font-size:20px;font-weight:700;color:#1a1a1a">${esc(name)}${business ? ` &middot; ${esc(business)}` : ""}</p>
      <table role="presentation" style="width:100%;border-collapse:collapse;border-top:1px solid #e5e7eb">
        ${row("Name", name)}
        ${row("Email", email)}
        ${row("Business", business)}
        ${answers.map((a) => row(a.question, a.answer || "— skipped —")).join("")}
      </table>
      <p style="margin:22px 0 0;font-size:13px;color:#5f6774">Reply straight to this email — it goes back to ${esc(email)}.</p>
    </td></tr>
  </table>
</body></html>`;

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      replyTo: email,
      subject: `Assessment enquiry — ${name}${business ? ` (${business})` : ""}`,
      html,
    });
    if (error) {
      console.error("[intake] resend rejected the send:", error);
      return NextResponse.json({ error: "We couldn't send that just now." }, { status: 502 });
    }
  } catch (err) {
    console.error("[intake] send threw:", err);
    return NextResponse.json({ error: "We couldn't send that just now." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
