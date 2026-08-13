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
  /** Short human name for the topic, shown to the client as the interview's contents. */
  label: string;
}

export const DISCOVERY_TOPICS: DiscoveryTopic[] = [
  {
    id: "business",
    question: "To start — tell me what your business does, and who your customers are.",
    goal: "What they sell, to whom, and roughly how the money comes in. Enough to reason about their operations.",
    label: "What the business does",
  },
  {
    id: "week",
    // Anchored on a specific, recent day rather than an abstract "typical week" —
    // recalling one real day is easier than summarizing a pattern, and "Monday
    // vs Friday" presumes a weekday shape plenty of businesses (anything
    // 24/7 — healthcare, hospitality, trades on call) don't actually have.
    question: "Let's get concrete — walk me through yesterday, start to finish. What took up most of your time, and did anything come up that you didn't expect to deal with?",
    goal: "What one specific recent day actually looked like — the tasks, roughly how the time broke down, and who was involved. A concrete day beats a vague summary of 'the week.'",
    label: "A day in the life",
  },
  {
    id: "repetitive",
    question: "Which tasks eat the most time but feel repetitive or low-value — the stuff you'd hand off tomorrow if you could?",
    goal: "At least one or two named, concrete recurring tasks, ideally with a rough sense of how often they happen.",
    label: "Repetitive work",
  },
  {
    id: "tools",
    question: "What software do you use day to day, and where does it fall short?",
    goal: "Named tools, plus the places work still falls back to a spreadsheet, a phone call, or paper.",
    label: "Tools and gaps",
  },
  {
    id: "cracks",
    question: "Where do things most often fall through the cracks or get delayed?",
    goal: "Specific failure points — missed follow-ups, late invoices, dropped leads, scheduling mixups — not a general 'we're busy'.",
    label: "Where things slip",
  },
  {
    id: "manual",
    question: "What do you or your staff do by hand that you wish just happened automatically?",
    goal: "Concrete manual steps: copying data between systems, sending the same email, chasing signatures.",
    label: "Done by hand",
  },
  {
    id: "team",
    question: "Last one — how many people are on your team, and what does each of them own?",
    goal: "Headcount and a rough split of responsibilities, so recommendations land on the right person.",
    label: "The team",
  },
];

/**
 * Starter phrases offered per topic while the answer box is empty — not answers
 * to submit as-is, just a way to unstick a blank page. Keyed by DiscoveryTopic id.
 */
export const TOPIC_SUGGESTIONS: Record<string, string[]> = {
  business: [
    "I run a [type of business] that sells [product or service] to [type of customer].",
    "We're a small team that mainly works with [kind of client].",
  ],
  week: [
    "Yesterday I started the day by... then spent most of my time on...",
    "A typical day is a mix of [task] in the morning and [task] later on.",
  ],
  repetitive: [
    "The task I dread most is... and I do it about [X] times a [day/week].",
    "I'd hand off [task] tomorrow if I could — it's just repetitive busywork.",
  ],
  tools: [
    "We use [tool] for [job], but it falls short when...",
    "A lot of work still happens in a spreadsheet, especially for...",
  ],
  cracks: [
    "Things usually slip when... — we've missed [follow-ups/invoices/leads] because of it.",
    "The biggest delay tends to happen between [step] and [step].",
  ],
  manual: [
    "I wish [task] happened automatically instead of me copying it between [systems].",
    "Every [day/week] I manually [task] — it's the same steps every time.",
  ],
  team: [
    "It's just me right now, and I handle everything from [area] to [area].",
    "There are [N] of us — I own [area], and [person] handles [area].",
  ],
};

/**
 * The closing step — asked once all seven topics are covered, before the report
 * is built. Answers get appended to the transcript as ordinary Consultant/Client
 * turns, so the report generator picks them up with no changes on its side.
 * Implements the "Defining Success & Urgency" close from the discovery-call
 * question bank (see docs/discovery-call-questions.md) that the scripted
 * interview itself never asked.
 */
export const CLOSING_QUESTIONS = [
  {
    id: "urgency",
    title: "One last thing — how urgent does fixing this feel?",
    skippable: false,
    options: [
      { id: "now", title: "It's costing us now", description: "I want this fixed as soon as possible." },
      { id: "soon", title: "Important, but not on fire", description: "I could live with it for another 60 days." },
      { id: "exploring", title: "Just exploring", description: "Seeing what's out there before committing to anything." },
    ],
  },
  {
    id: "win",
    title: "And ninety days from now, what would make this whole thing feel like a win?",
    skippable: false,
    freeText: true,
    freeTextMultiline: true,
    freeTextPlaceholder: "In your own words…",
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
