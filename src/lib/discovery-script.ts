/**
 * The discovery call, as a script.
 *
 * The consultant's interview has a fixed spine — the topics that must be covered
 * for the report to be worth anything — and free movement inside each topic. The
 * model never chooses which topic comes next; it only chooses whether the answer
 * it just heard is worth digging into. That keeps coverage guaranteed and cost
 * bounded, while still letting the conversation follow what the client says.
 */

export interface DiscoveryTopic {
  id: string;
  /** The scripted question. The model may rephrase it to fit the conversation, but not replace it. */
  question: string;
  /** What a complete answer looks like. Drives the probe/advance decision. */
  goal: string;
}

export const DISCOVERY_TOPICS: DiscoveryTopic[] = [
  {
    id: "business",
    question: "To start — tell me what your business does, and who your customers are.",
    goal: "What they sell, to whom, and roughly how the money comes in. Enough to reason about their operations.",
  },
  {
    id: "week",
    question: "Walk me through a typical week for you and your team. What does Monday look like versus Friday?",
    goal: "The actual shape of the work week, and who does what on which days.",
  },
  {
    id: "repetitive",
    question: "Which tasks eat the most time but feel repetitive or low-value — the stuff you'd hand off tomorrow if you could?",
    goal: "At least one or two named, concrete recurring tasks, ideally with a rough sense of how often they happen.",
  },
  {
    id: "tools",
    question: "What software do you use day to day, and where does it fall short?",
    goal: "Named tools, plus the places work still falls back to a spreadsheet, a phone call, or paper.",
  },
  {
    id: "cracks",
    question: "Where do things most often fall through the cracks or get delayed?",
    goal: "Specific failure points — missed follow-ups, late invoices, dropped leads, scheduling mixups — not a general 'we're busy'.",
  },
  {
    id: "manual",
    question: "What do you or your staff do by hand that you wish just happened automatically?",
    goal: "Concrete manual steps: copying data between systems, sending the same email, chasing signatures.",
  },
  {
    id: "team",
    question: "Last one — how many people are on your team, and what does each of them own?",
    goal: "Headcount and a rough split of responsibilities, so recommendations land on the right person.",
  },
];

/**
 * How many follow-ups the model may ask before it must move on.
 *
 * Two is deliberate. One probe is the difference between a form and a conversation;
 * a third starts to feel like an interrogation, and each topic's marginal value
 * drops fast once the concrete detail is out.
 */
export const MAX_PROBES_PER_TOPIC = 2;

/** Below this, an answer is treated as a non-answer and re-asked rather than probed. */
export const MIN_ANSWER_CHARS = 12;

export const OPENING_MESSAGE =
  "I'm going to ask you about how your business actually runs day to day — the same questions I'd ask on a discovery call. There are no wrong answers, and the more specific you are, the sharper your report will be.";

export function topicAt(index: number): DiscoveryTopic | null {
  return DISCOVERY_TOPICS[index] ?? null;
}

export function isLastTopic(index: number): boolean {
  return index >= DISCOVERY_TOPICS.length - 1;
}

/** Renders the transcript the report generator consumes. */
export function transcriptFrom(messages: { role: "assistant" | "user"; content: string }[]): string {
  return messages
    .map((m) => `${m.role === "assistant" ? "Consultant" : "Client"}: ${m.content.trim()}`)
    .join("\n\n");
}
