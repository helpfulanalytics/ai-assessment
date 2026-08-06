import OpenAI from "openai";
import { NextRequest } from "next/server";
import { Resend } from "resend";
import type { AssessmentReport } from "../../../data/mockAssessmentData";
import { adminDb } from "../../../lib/firebase-admin";
import {
  ASSESSMENT_RULES,
  assessTargetFit,
  validateIntake,
  validateAssessment,
  type RevenueBand,
} from "../../../lib/assessment-schema";
import { transcriptFrom } from "../../../lib/discovery-script";
import {
  getSession,
  updateSession,
  isChatComplete,
  isEntitledToReport,
  type DiscoverySession,
} from "../../../lib/session";
import { reportReadyEmail } from "../../../lib/emails";

const resend = new Resend(process.env.RESEND_API_KEY);

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

const MODEL = "anthropic/claude-sonnet-5";
const MAX_TOKENS = 16384;
/** One regeneration attempt when the first output violates the offer's rules. */
const MAX_ATTEMPTS = 2;

const SYSTEM_PROMPT = `You are an AI automation consultant who runs 45-minute discovery interviews with small businesses (2-20 employees, $500k-$5M revenue) to identify operational bottlenecks, then prescribes ${ASSESSMENT_RULES.MIN_TOOLS}-${ASSESSMENT_RULES.MAX_TOOLS} off-the-shelf AI tools and automations (e.g. Zapier, Make.com, Fathom, Otter, Weave, custom GPTs) to save them 5-10 hours per week.

You will be given either (a) a raw call transcript, or (b) structured answers to open-ended discovery questions. Read it and produce an assessment report as JSON.

Rules:
- Ground every pain point in something actually said in the input — do not invent pain points that weren't mentioned.
- Recommend ${ASSESSMENT_RULES.MIN_TOOLS}-${ASSESSMENT_RULES.MAX_TOOLS} real, off-the-shelf tools (not hypothetical products). Prefer well-known tools (the kind found on directories like Futurepedia or There's An AI For That) over custom builds unless the pain point clearly requires one.
- Each tool recommendation must map to a specific pain point via painPointAddressed (matching a painPoints[].id you define).
- The quickStartPlan must have exactly ${ASSESSMENT_RULES.QUICK_START_DAYS} items, one per day (day 1-${ASSESSMENT_RULES.QUICK_START_DAYS}), sequenced so the highest-impact fix lands first.
- BE CONSERVATIVE with estimatedTimeSavedHrsPerWeek. This report carries a money-back guarantee if the client cannot actually recover ${ASSESSMENT_RULES.GUARANTEE_MIN_HOURS} hours per week, so an inflated estimate costs real money. Estimate only the hours a tool plausibly removes in the first month, not its theoretical ceiling.
- totalEstimatedHoursSavedPerWeek must be the realistic combined saving, deduplicated for overlap between tools. It must never exceed the sum of the per-tool estimates.
- Set guaranteeMet to true only if totalEstimatedHoursSavedPerWeek >= ${ASSESSMENT_RULES.GUARANTEE_MIN_HOURS}.
- Be honest and specific — no generic "use AI to be more efficient" advice. If the interview genuinely does not reveal ${ASSESSMENT_RULES.GUARANTEE_MIN_HOURS} hours of recoverable time, say so honestly rather than padding the numbers.

Respond with ONLY valid JSON matching this TypeScript interface, no prose, no markdown fences:

{
  "executiveSummary": string (3-4 paragraphs: business context, the bottlenecks found, the recommended fixes, and the projected hours saved),
  "totalEstimatedHoursSavedPerWeek": number,
  "painPoints": Array<{
    "id": string (e.g. "pain-1"),
    "title": string,
    "description": string,
    "currentProcess": string (how they do it today),
    "hoursPerWeekLost": number
  }>,
  "toolRecommendations": Array<{
    "id": string (e.g. "tool-1"),
    "name": string,
    "category": string,
    "painPointAddressed": string (must match a painPoints[].id),
    "whatItDoes": string,
    "estimatedTimeSavedHrsPerWeek": number,
    "effort": "low" | "medium" | "high",
    "impact": "low" | "medium" | "high",
    "monthlyCost": string,
    "link": string (optional, omit if unsure)
  }> (${ASSESSMENT_RULES.MIN_TOOLS} to ${ASSESSMENT_RULES.MAX_TOOLS} items),
  "quickStartPlan": Array<{
    "day": 1 | 2 | 3 | 4,
    "title": string,
    "description": string,
    "toolId": string (optional, matching a toolRecommendations[].id)
  }> (exactly ${ASSESSMENT_RULES.QUICK_START_DAYS} items),
  "guaranteeMet": boolean
}`;

function extractJson(raw: string): string {
  let s = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first !== -1 && last > first) s = s.slice(first, last + 1);
  return s;
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  // ── Path 1: generate from a completed discovery session (the product) ──
  // ── Path 2: generate from a transcript posted directly (retained for manual runs) ──
  const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
  let session: DiscoverySession | null = null;

  if (sessionId) {
    session = await getSession(sessionId);
    if (!session) {
      return Response.json({ error: "Session not found." }, { status: 404 });
    }

    // Idempotent: paying, refreshing, and retrying all land on the same report
    // rather than billing a second generation.
    if (session.reportId) {
      const existing = await adminDb.collection("assessments").doc(session.reportId).get();
      if (existing.exists) {
        return Response.json(existing.data() as AssessmentReport);
      }
    }

    if (!isChatComplete(session)) {
      return Response.json({ error: "The interview isn't finished yet." }, { status: 409 });
    }
    if (!isEntitledToReport(session)) {
      return Response.json({ error: "Payment is required to unlock this report." }, { status: 402 });
    }

    body = {
      ...body,
      transcript: transcriptFrom(session.messages),
      company: session.company,
      contact: session.contact,
      email: session.email,
    };
  }

  const intake = validateIntake(body);
  if (!intake.ok) {
    return Response.json({ error: intake.error }, { status: 400 });
  }

  const { company, contact, email, employeeCount, revenueBand } = body as {
    company?: string; contact?: string; email?: string;
    employeeCount?: number; revenueBand?: RevenueBand;
  };

  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const userPrompt = `Here is the ${intake.intakeSource === "transcript" ? "call transcript" : "questionnaire responses"} for a business discovery interview:\n\n${intake.intakeText}\n\nProduce the assessment report JSON.`;

  let report: AssessmentReport | null = null;
  let repairs: string[] = [];
  let lastErrors: string[] = [];

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ];

    // On retry, tell the model exactly which rules it broke.
    if (lastErrors.length > 0) {
      messages.push({
        role: "user",
        content: `Your previous response violated these rules:\n${lastErrors.map(e => `- ${e}`).join("\n")}\n\nProduce a corrected report that satisfies every rule. Return only the JSON.`,
      });
    }

    let parsed: unknown;
    try {
      const completion = await client.chat.completions.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        response_format: { type: "json_object" } as any,
        messages,
      });

      const choice = completion.choices[0];
      const raw = choice?.message?.content ?? "";

      if (choice?.finish_reason === "length") {
        console.warn(`[assessment] attempt ${attempt}: truncated by max_tokens (${raw.length} chars).`);
      }
      if (!raw.trim()) {
        throw new Error("Model returned an empty response.");
      }

      parsed = JSON.parse(extractJson(raw));
    } catch (err) {
      console.error(`[assessment] attempt ${attempt} failed:`, err);
      if (attempt === MAX_ATTEMPTS) {
        return Response.json(
          { error: "Assessment analysis failed. Please try again." },
          { status: 502 }
        );
      }
      lastErrors = ["The previous response was not parseable JSON. Return only a single valid JSON object."];
      continue;
    }

    const result = validateAssessment(parsed);

    if (result.errors.length === 0 && result.report) {
      report = result.report;
      repairs = result.repairs;
      break;
    }

    console.warn(`[assessment] attempt ${attempt} validation errors:`, result.errors);
    lastErrors = result.errors;

    // Last attempt still broken — surface it rather than shipping a report
    // that breaks a promise we made to the client.
    if (attempt === MAX_ATTEMPTS) {
      return Response.json(
        {
          error: "Could not produce a report that meets the assessment standard. Please retry, or add more detail to the interview.",
          details: result.errors,
        },
        { status: 422 }
      );
    }
  }

  if (!report) {
    return Response.json({ error: "Assessment analysis failed. Please try again." }, { status: 502 });
  }

  const parsedEmployeeCount =
    typeof employeeCount === "number" && Number.isFinite(employeeCount) ? employeeCount : undefined;
  const targetFit = assessTargetFit(parsedEmployeeCount, revenueBand);

  if (repairs.length > 0) {
    console.warn("[assessment] applied repairs:", repairs);
  }

  const docRef = adminDb.collection("assessments").doc();
  const doc: AssessmentReport = {
    ...report,
    id: docRef.id,
    date: today,
    intakeSource: intake.intakeSource,
    company: company || "Unknown Company",
    contact: contact || "Client",
    ...(email ? { email } : {}),
    ...(parsedEmployeeCount !== undefined ? { employeeCount: parsedEmployeeCount } : {}),
    ...(revenueBand ? { revenueBand } : {}),
    targetFit,
    ...(repairs.length > 0 ? { validationRepairs: repairs } : {}),
    createdAt: new Date().toISOString(),
  };

  await docRef.set(doc);

  if (session) {
    await updateSession(session.id, { reportId: docRef.id, status: "complete" });
    await deliverReport(doc, docRef.id);
  }

  return Response.json(doc);
}

/**
 * Emails the report link. Best-effort by design: the report is already saved and
 * the browser is about to show it, so a mail failure must not turn a successful
 * generation into an error the client sees.
 */
async function deliverReport(report: AssessmentReport, reportId: string): Promise<void> {
  if (!report.email) return;

  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
  try {
    await resend.emails.send({
      from: process.env.FROM_EMAIL ?? "support@erasefriction.com",
      to: report.email,
      subject: `Your AI opportunity assessment is ready`,
      html: reportReadyEmail({
        name: report.contact ?? report.email,
        company: report.company ?? "",
        reportUrl: `${baseUrl}/assessment/${reportId}`,
        hoursSaved: report.totalEstimatedHoursSavedPerWeek,
      }),
    });
  } catch (err) {
    console.error("[assessment] report delivery email failed:", err);
  }
}
