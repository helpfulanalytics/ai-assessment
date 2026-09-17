import { CLOSING_QUESTIONS, DISCOVERY_TOPICS } from "../../lib/discovery-script";
import type { AskUserQuestion as AskUserQuestionSpec } from "../../components/ui/ask-user-questions";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The gate's three intake questions, one at a time — mirrors the interview's
 *  own one-question-at-a-time framing rather than a stacked form. */
export const GATE_QUESTIONS: AskUserQuestionSpec[] = [
  {
    id: "name",
    title: "What's your name?",
    freeText: true,
    freeTextMultiline: false,
    freeTextPlaceholder: "Jane Doe",
    skippable: false,
  },
  {
    id: "company",
    title: "What's your business called?",
    freeText: true,
    freeTextMultiline: false,
    freeTextPlaceholder: "Acme Co.",
    skippable: false,
  },
  {
    id: "email",
    title: "Where should we send your assessment?",
    freeText: true,
    freeTextMultiline: false,
    freeTextPlaceholder: "jane@acme.com",
    skippable: false,
    freeTextValidate: (v) => (EMAIL_RE.test(v) ? null : "That doesn't look like a valid email address."),
  },
];

/**
 * The seven scripted interview topics, asked as plain questions. v1 has no
 * model in the loop to probe, so each topic's `question` is asked once and the
 * answer goes straight through — the wording is the script's own, unchanged.
 */
export const TOPIC_QUESTIONS: AskUserQuestionSpec[] = DISCOVERY_TOPICS.map((t) => ({
  id: t.id,
  title: t.question,
  freeText: true,
  freeTextMultiline: true,
  freeTextPlaceholder: "In your own words…",
  skippable: true,
}));

/** Urgency (multiple choice) and the ninety-day win, as the interview closed. */
export const CLOSING = CLOSING_QUESTIONS as AskUserQuestionSpec[];

export const ALL_QUESTIONS: AskUserQuestionSpec[] = [
  ...GATE_QUESTIONS,
  ...TOPIC_QUESTIONS,
  ...CLOSING,
];

/** Sidebar rail labels — the seven topics, as the interview sidebar showed them. */
export const TOPIC_LABELS = DISCOVERY_TOPICS.map((t) => t.label);

export const GATE_COUNT = GATE_QUESTIONS.length;
export const TOPIC_COUNT = TOPIC_QUESTIONS.length;

/**
 * Where the rail sits for a given question index. The gate runs before the
 * topics and the closing questions after, so both map to "nothing current":
 * before the topics everything is todo, after them everything is done.
 */
export function railIndexFor(questionIndex: number): number {
  if (questionIndex < GATE_COUNT) return -1;
  return Math.min(questionIndex - GATE_COUNT, TOPIC_COUNT);
}

/** Human-readable label for an answer, for the email sent to Brooks. */
export function answerText(q: AskUserQuestionSpec, a?: { selectedIds?: string[]; otherText?: string; skipped?: boolean }) {
  if (!a || a.skipped) return "";
  const chosen = (a.selectedIds ?? [])
    .map((id) => q.options?.find((o) => o.id === id)?.title ?? id)
    .filter(Boolean);
  return [...chosen, (a.otherText ?? "").trim()].filter(Boolean).join(" — ");
}
