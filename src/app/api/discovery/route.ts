import OpenAI from "openai";
import { NextRequest } from "next/server";
import {
  DISCOVERY_TOPICS,
  MAX_PROBES_PER_TOPIC,
  MIN_ANSWER_CHARS,
  OPENING_MESSAGE,
  topicAt,
} from "../../../lib/discovery-script";
import {
  createSession,
  getSession,
  updateSession,
  paywallPosition,
  progressOf,
  isChatComplete,
  type DiscoverySession,
  type SessionMessage,
} from "../../../lib/session";

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

const MODEL = "anthropic/claude-sonnet-5";
const MAX_MESSAGE_CHARS = 4000;

/** The model decides one thing per turn: dig in, or move on. */
interface TurnDecision {
  action: "probe" | "advance";
  reply: string;
}

/**
 * The turn is taken through a forced tool call rather than `response_format:
 * json_object`. That parameter is an OpenAI shape; Anthropic models do not
 * implement it, and OpenRouter's emulation degrades to a prompt hint — so the
 * model would periodically answer in plain prose and the whole turn would fail
 * to parse. Tool calling is supported natively, so the envelope is enforced by
 * the API instead of by the model's willingness to comply.
 */
const TURN_TOOL_NAME = "reply_to_client";

const TURN_TOOL: OpenAI.ChatCompletionFunctionTool = {
  type: "function",
  function: {
    name: TURN_TOOL_NAME,
    description:
      "Say your next line to the client, and record whether the current topic is now covered.",
    parameters: {
      type: "object",
      additionalProperties: false,
      required: ["action", "reply"],
      properties: {
        action: {
          type: "string",
          enum: ["probe", "advance"],
          description:
            "'probe' to ask one more follow-up about what they just said; 'advance' when the current topic is covered.",
        },
        reply: {
          type: "string",
          description: "What you say next, in your own voice. Two or three sentences at most.",
        },
      },
    },
  },
};

function systemPrompt(session: DiscoverySession, mustAdvance: boolean, answerWasThin: boolean): string {
  const topic = topicAt(session.topicIndex);
  const next = topicAt(session.topicIndex + 1);

  return `You are a business consultant running a discovery interview with the owner of a small business (roughly 2-20 employees). Your job is to understand how their business actually runs day to day, so a written assessment can identify where they are losing time and which off-the-shelf tools would recover it.

Speak like a person on a call, not a form. Warm, direct, curious. Short — two or three sentences at most. Never use bullet points, headings, or markdown. Never mention that you are an AI, a script, or a system.

THE CURRENT TOPIC is "${topic?.id}":
Question: ${topic?.question}
What a complete answer covers: ${topic?.goal}

${next
  ? `THE NEXT TOPIC is "${next.id}":\nQuestion: ${next.question}`
  : `There is NO next topic — this is the final question of the interview.`}

You must decide between two actions:

"probe" — the client said something specific that is worth one more question: a named tool, a recurring task, a number, a complaint, a workaround. Ask a single follow-up that digs into that specific thing. Quote or reference what they actually said. Do not ask something they have already answered, and do not ask two questions at once.

"advance" — the current topic is covered well enough, or further digging would produce diminishing returns. ${next
    ? `Briefly acknowledge what they told you in one short clause, then ask the NEXT TOPIC's question. You may rephrase it to fit the flow of the conversation, but you must not change what is being asked or merge it with another topic.`
    : `Briefly acknowledge what they told you, then tell them the interview is done and their assessment is being put together. Do NOT ask another question.`}

${mustAdvance
    ? `You have already asked the maximum number of follow-ups on this topic. You MUST choose "advance" this turn.`
    : answerWasThin
    ? `The client's last answer was very short. Choose "probe" and warmly ask them to give you a bit more detail — a specific example works best.`
    : `Prefer "probe" when there is a concrete detail worth pulling on. Prefer "advance" when the answer already covers what the topic needs, or when the client clearly has nothing more to add.`}

Answer by calling the reply_to_client tool. Put what you say to the client in "reply" and your choice in "action". Everything the client should read goes in "reply" — never write anything outside the tool call.`;
}

function extractJson(raw: string): string {
  let s = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first !== -1 && last > first) s = s.slice(first, last + 1);
  return s;
}

async function decideTurn(
  session: DiscoverySession,
  mustAdvance: boolean,
  answerWasThin: boolean
): Promise<TurnDecision> {
  const completion = await client.chat.completions.create({
    model: MODEL,
    // Room for a 2-3 sentence reply plus the tool-call envelope. A truncated
    // tool call yields unparseable arguments, which costs a whole turn.
    max_tokens: 512,
    tools: [TURN_TOOL],
    tool_choice: { type: "function", function: { name: TURN_TOOL_NAME } },
    messages: [
      { role: "system", content: systemPrompt(session, mustAdvance, answerWasThin) },
      ...session.messages.map((m) => ({ role: m.role, content: m.content })),
    ],
  });

  const choice = completion.choices[0];
  const settle = (d: Partial<TurnDecision>, reply: string): TurnDecision => ({
    action: d.action === "probe" && !mustAdvance ? "probe" : "advance",
    reply,
  });

  // 1. The expected path — arguments are structurally guaranteed by the tool call.
  const call = choice?.message?.tool_calls?.[0];
  const args = call?.type === "function" ? call.function.arguments : undefined;
  if (args) {
    try {
      const parsed = JSON.parse(args) as Partial<TurnDecision>;
      const reply = typeof parsed.reply === "string" ? parsed.reply.trim() : "";
      if (reply) return settle(parsed, reply);
    } catch (err) {
      console.warn("[discovery] tool arguments did not parse; falling back to content.", err);
    }
  }

  const raw = (choice?.message?.content ?? "").trim();
  if (!raw) throw new Error("Model returned an empty turn.");

  // 2. The model answered in content anyway, but in JSON.
  try {
    const parsed = JSON.parse(extractJson(raw)) as Partial<TurnDecision>;
    const reply = typeof parsed.reply === "string" ? parsed.reply.trim() : "";
    if (reply) return settle(parsed, reply);
  } catch {
    // Falls through to salvage.
  }

  // 3. The model answered in plain prose. That prose is a perfectly good reply —
  // only the action is missing, so treat it as a probe and let the probe cap
  // force the topic forward. Guessing "advance" here would silently skip one of
  // the seven scripted topics, which is the one outcome worth avoiding.
  console.warn(
    `[discovery] no structured turn for session ${session.id} at topic ${session.topicIndex}; salvaging prose reply.`
  );
  return { action: mustAdvance ? "advance" : "probe", reply: raw };
}

/** The client-facing view of a session. Never leaks email, Stripe ids, or paywall internals beyond what the UI needs. */
function publicState(session: DiscoverySession) {
  return {
    sessionId: session.id,
    status: session.status,
    paywall: session.paywall,
    messages: session.messages.map((m) => ({ role: m.role, content: m.content })),
    progress: progressOf(session),
    chatComplete: isChatComplete(session),
    company: session.company,
    reportId: session.reportId ?? null,
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

  // ── Start a new session ──
  if (body.action === "start") {
    const { email, company, contact } = body as { email?: string; company?: string; contact?: string };

    if (!isValidEmail(email)) {
      return Response.json({ error: "A valid email is required." }, { status: 400 });
    }

    // Upfront-paywall sessions are created by the checkout route, after payment.
    // Reaching this branch in upfront mode would hand out a free interview.
    if (paywallPosition() === "upfront") {
      return Response.json(
        { error: "Payment is required before starting the interview." },
        { status: 402 }
      );
    }

    const session = await createSession({
      email: email.trim(),
      company: (company ?? "").trim() || "Your business",
      contact: (contact ?? "").trim() || email.trim(),
      status: "chat",
      paywall: "report",
    });

    const first = topicAt(0);
    const opening: SessionMessage[] = [
      { role: "assistant", content: OPENING_MESSAGE },
      { role: "assistant", content: first!.question, topicId: first!.id },
    ];

    await updateSession(session.id, { messages: opening });
    return Response.json(publicState({ ...session, messages: opening }));
  }

  // ── Resume or advance an existing session ──
  const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
  const session = await getSession(sessionId);

  if (!session) {
    return Response.json({ error: "Session not found." }, { status: 404 });
  }

  // Resume: no message means the client is just rehydrating the conversation.
  if (body.message === undefined) {
    return Response.json(publicState(session));
  }

  if (session.status === "awaiting_payment") {
    return Response.json({ error: "This session is waiting on payment." }, { status: 402 });
  }
  if (isChatComplete(session)) {
    return Response.json(publicState(session));
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return Response.json({ error: "Message cannot be empty." }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_CHARS) {
    return Response.json(
      { error: `That answer is longer than ${MAX_MESSAGE_CHARS.toLocaleString()} characters. Trim it a little.` },
      { status: 400 }
    );
  }

  const topic = topicAt(session.topicIndex);
  const withAnswer: SessionMessage[] = [
    ...session.messages,
    { role: "user", content: message, ...(topic ? { topicId: topic.id } : {}) },
  ];

  const mustAdvance = session.probeCount >= MAX_PROBES_PER_TOPIC;
  const answerWasThin = message.length < MIN_ANSWER_CHARS;

  let decision: TurnDecision;
  try {
    decision = await decideTurn({ ...session, messages: withAnswer }, mustAdvance, answerWasThin);
  } catch (err) {
    console.error("[discovery] turn failed:", err);
    // The answer is deliberately not persisted — the client still has it in the
    // input box, so a retry replays cleanly rather than double-recording it.
    return Response.json(
      { error: "Something went wrong on our end. Send that again?" },
      { status: 502 }
    );
  }

  const advancing = decision.action === "advance";
  const nextTopicIndex = advancing ? session.topicIndex + 1 : session.topicIndex;
  const nextTopic = topicAt(nextTopicIndex);

  const messages: SessionMessage[] = [
    ...withAnswer,
    {
      role: "assistant",
      content: decision.reply,
      ...(nextTopic ? { topicId: nextTopic.id } : {}),
    },
  ];

  const patch: Partial<DiscoverySession> = {
    messages,
    topicIndex: nextTopicIndex,
    probeCount: advancing ? 0 : session.probeCount + 1,
  };

  // Chat just finished. Report-paywall sessions hit the wall here; upfront
  // sessions already paid and fall straight through to generation.
  const complete = nextTopicIndex >= DISCOVERY_TOPICS.length;
  if (complete && session.paywall === "report" && session.status === "chat") {
    patch.status = "awaiting_payment";
  }

  await updateSession(session.id, patch);
  return Response.json(publicState({ ...session, ...patch } as DiscoverySession));
}
