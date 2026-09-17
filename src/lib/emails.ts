/**
 * Transactional email templates.
 *
 * Two routes send mail now (the Stripe webhook and the report generator), so the
 * shared chrome lives here rather than being duplicated inline in each route.
 * Table-based layout and inline styles are deliberate — email clients require it.
 */

const INK = "#1a1a1a";
const SLATE = "#5f6774";
const GHOST = "#858c98";
const PORCELAIN = "#f5f4f0";
const POWDER = "#e5e7eb";
const VIOLET = "#0f766e";

function shell(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${PORCELAIN};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${PORCELAIN};padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;border:1px solid ${POWDER};overflow:hidden;max-width:560px">
        <tr>
          <td style="background:${INK};padding:28px 36px">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:${VIOLET};border-radius:6px;width:26px;height:26px;text-align:center;vertical-align:middle">
                  <span style="color:#ffffff;font-size:12px;font-weight:700">&#9650;</span>
                </td>
                <td style="padding-left:10px;color:#ffffff;font-size:15px;font-weight:600;letter-spacing:-0.01em">AssessAI</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr><td style="padding:36px 36px 28px">${bodyHtml}</td></tr>
        <tr>
          <td style="background:${PORCELAIN};border-top:1px solid ${POWDER};padding:18px 36px;text-align:center">
            <p style="margin:0;font-size:11px;color:${GHOST}">&copy; 2026 AssessAI powered by EraseFriction &middot; <a href="https://erasefriction.com" style="color:${VIOLET};text-decoration:none">erasefriction.com</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function button(href: string, label: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:0 0 24px">
    <tr><td style="background:${VIOLET};border-radius:9px">
      <a href="${href}" style="display:inline-block;padding:13px 26px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none">${label}</a>
    </td></tr>
  </table>`;
}

const eyebrow = (text: string) =>
  `<p style="margin:0 0 6px;font-size:13px;font-weight:700;color:${SLATE};letter-spacing:0.5px">${text}</p>`;

const heading = (text: string) =>
  `<h1 style="margin:0 0 20px;font-size:26px;font-weight:300;color:${INK};letter-spacing:-0.025em;line-height:1.2">${text}</h1>`;

const para = (html: string) =>
  `<p style="margin:0 0 24px;font-size:15px;color:${SLATE};line-height:1.7">${html}</p>`;

/**
 * Upfront paywall: they paid, now they need the link into the interview.
 * The link is the only way back into their session, so it carries the weight here.
 */
export function interviewReadyEmail(opts: { name: string; company: string; discoveryUrl: string }): string {
  return shell(`
    ${eyebrow("PAYMENT CONFIRMED")}
    ${heading(`Your assessment is ready to start${opts.company ? `, ${opts.company}` : ""}.`)}
    ${para(`Hi ${opts.name},<br><br>Thanks for your order. The next step is a short interview — I'll ask you about how your business runs day to day. It takes about 15 minutes, and your report is generated the moment you finish.`)}
    ${button(opts.discoveryUrl, "Start your interview")}
    ${para(`<strong style="color:${INK}">Keep this email.</strong> The link above is how you get back into your interview if you need to step away — your answers are saved as you go.`)}
  `);
}

/**
 * Report paywall: they paid at the end, so the report already exists (or is
 * seconds away). This is the delivery.
 */
export function reportReadyEmail(opts: { name: string; company: string; reportUrl: string; hoursSaved: number }): string {
  return shell(`
    ${eyebrow("YOUR ASSESSMENT IS READY")}
    ${heading(`${opts.company || "Your"} assessment is done.`)}
    ${para(`Hi ${opts.name},<br><br>Your assessment is complete. Based on the interview, we've identified <strong style="color:${INK}">${opts.hoursSaved} hours per week</strong> of recoverable time, the bottlenecks causing it, and the specific tools that address each one — plus a four-day plan to get the highest-impact fix live first.`)}
    ${button(opts.reportUrl, "Read your assessment")}
    ${para("Bookmark that link — it's yours permanently, and it's the same report you can share with your team.")}
  `);
}
