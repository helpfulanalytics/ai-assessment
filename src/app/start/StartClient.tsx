"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { AskUserQuestions, type AskUserAnswer } from "../../components/ui/ask-user-questions";
import {
  ALL_QUESTIONS,
  TOPIC_LABELS,
  TOPIC_COUNT,
  GATE_COUNT,
  railIndexFor,
  answerText,
} from "./questions";

/**
 * v1 intake. Reuses the discovery gate's one-question-at-a-time presentation,
 * but the flow ends here: the answers are mailed to Brooks and the user gets a
 * thank-you. No payment and no interview in this version.
 */

function Mark() {
  return (
    <svg viewBox="0 0 256 256" aria-hidden="true" className="size-6 shrink-0 text-[var(--c-violet)]" fill="currentColor">
      <path d="M 100 136 C 111.046 136 120 144.954 120 156 L 120 256 L 100 256 C 44.772 256 0 211.228 0 156 L 0 136 Z M 256 256 L 136 256 L 136 156 C 136 144.954 144.954 136 156 136 L 256 136 Z M 120 100 C 120 111.046 111.046 120 100 120 L 0 120 L 0 100 C 0 44.772 44.772 0 100 0 L 120 0 Z M 156 0 C 211.228 0 256 44.772 256 100 L 256 120 L 156 120 C 144.954 120 136 111.046 136 100 L 136 0 Z" />
    </svg>
  );
}

function StepRow({ label, index, state }: { label: string; index: number; state: "done" | "current" | "todo" }) {
  return (
    <li className="flex items-start gap-2.5 py-1.5" aria-current={state === "current" ? "step" : undefined}>
      <span
        className={
          "mt-px flex size-[18px] shrink-0 items-center justify-center rounded-full text-[10px] font-semibold tabular-nums " +
          (state === "done"
            ? "bg-[var(--c-powder)] text-[var(--c-ink)]"
            : state === "current"
              ? "bg-[var(--c-ink)] text-white"
              : "border border-[var(--c-powder)] text-[var(--c-ghost)]")
        }
      >
        {state === "done" ? <Check size={11} strokeWidth={3} aria-hidden="true" /> : index + 1}
      </span>
      <span
        className={
          "text-[13px] leading-snug " +
          (state === "current"
            ? "font-medium text-[var(--c-ink)]"
            : state === "done"
              ? "text-[var(--c-slate)]"
              : "text-[var(--c-ghost)]")
        }
      >
        {label}
      </span>
    </li>
  );
}

function stepState(i: number, current: number): "done" | "current" | "todo" {
  return i < current ? "done" : i === current ? "current" : "todo";
}

function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="mb-4 rounded-[10px] bg-[var(--c-orange-bg)] px-3.5 py-2.5 text-[13.5px] text-[#b45309]"
    >
      {children}
    </p>
  );
}

export default function StartClient() {
  /** Which gate question (name / business / email) is showing — controlled so a
   *  validation failure can hold the user on the step that failed. */
  const [gateIndex, setGateIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  /** Honeypot. Invisible to people, so it costs the gate's design nothing, but
   *  it is what makes the endpoint's bot check reachable from this page. */
  const honeypotRef = useRef<HTMLInputElement>(null);

  async function submit(answers: Record<string, AskUserAnswer>) {
    if (busy) return;
    const val = (id: string) => (answers[id]?.otherText ?? "").trim();

    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: val("name"),
          business: val("company"),
          email: val("email"),
          // Everything past the gate goes through as question/answer pairs so
          // Brooks reads the interview in the order it was asked.
          answers: ALL_QUESTIONS.slice(GATE_COUNT).map((q) => ({
            question: q.title,
            answer: answerText(q, answers[q.id ?? ""]),
          })),
          company_website: honeypotRef.current?.value ?? "",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Something went wrong. Please try again.");
        // Drop back to the last question (email) so the user can retry the
        // step most likely to have been the problem.
        setGateIndex(ALL_QUESTIONS.length - 1);
        setBusy(false);
        return;
      }
      setSent(true);
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
      setGateIndex(ALL_QUESTIONS.length - 1);
      setBusy(false);
    }
  }

  /* Once sent, every step reads as done. */
  const railIndex = sent ? TOPIC_COUNT : railIndexFor(gateIndex);

  return (
    <main className="flex h-dvh overflow-hidden bg-[var(--c-canvas)] font-sans">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-[var(--c-powder)] bg-[var(--c-porcelain)] lg:flex">
        <div className="px-4 pt-4">
          <Link href="/" className="inline-flex items-center gap-2 text-[15px] font-semibold tracking-tight text-[var(--c-ink)]">
            <Mark />
            AssessAI
          </Link>
        </div>

        <div className="mt-6 min-h-0 flex-1 overflow-y-auto px-4">
          <p className="text-[11px] font-medium tracking-wide text-[var(--c-ghost)] uppercase">Your interview</p>
          <ul className="mt-2">
            {TOPIC_LABELS.map((label, i) => (
              <StepRow key={label} label={label} index={i} state={stepState(i, railIndex)} />
            ))}
          </ul>
        </div>

        <div className="border-t border-[var(--c-powder)] px-4 py-3">
          <p className="text-[12px] leading-relaxed text-[var(--c-slate)]">
            No card to start. We&apos;ll come back to you by email within 48 hours.
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
      <header className="px-5 pt-6 sm:px-8 lg:hidden">
        <Link href="/" className="inline-flex items-center gap-2 text-[15px] font-semibold tracking-tight text-[var(--c-ink)]">
          <Mark />
          AssessAI
        </Link>
      </header>

      {/* Off-screen rather than display:none — bots commonly skip fields that
          are genuinely hidden, but will fill one that is merely positioned away. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-px w-px overflow-hidden">
        <label htmlFor="company_website">Don&apos;t fill this out if you&apos;re human:</label>
        <input ref={honeypotRef} id="company_website" name="company_website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-1 items-start justify-center overflow-y-auto px-5 py-16 md:py-24 lg:py-28">
        <div className="grid w-full max-w-2xl gap-10">
          {sent ? (
            <div>
              <span className="mb-6 flex size-11 items-center justify-center rounded-full bg-[var(--c-violet-bg)] text-[var(--c-violet)]">
                <Check className="size-5" aria-hidden="true" />
              </span>
              <h1 className="text-[clamp(28px,5vw,38px)] leading-[1.12] font-normal tracking-tight text-balance text-[var(--c-ink)]">
                Got it — thank you.
              </h1>
              <p className="mt-4 max-w-[48ch] text-[16px] leading-relaxed text-[var(--c-slate)]">
                Your answers are with us. We&apos;ll come back to you by email within 48 hours with a real
                response — no sales call, no commitment.
              </p>
              <Link
                href="/"
                className="mt-8 inline-flex min-h-11 items-center gap-1.5 rounded-full border border-[var(--c-washed)] bg-[var(--c-white)] px-5 text-[14px] font-semibold text-[var(--c-violet)] transition-colors hover:bg-[var(--c-violet-bg)]"
              >
                Back to the homepage
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <>
              <div>
                <h1 className="text-[clamp(28px,5vw,38px)] leading-[1.12] font-normal tracking-tight text-balance text-[var(--c-ink)]">
                  Let&apos;s talk about how your business runs.
                </h1>
                <p className="mt-4 max-w-[48ch] text-[16px] leading-relaxed text-[var(--c-slate)]">
                  The same questions we&apos;d ask on a discovery call. Answer what you can — we&apos;ll come
                  back within 48 hours with a real assessment of where your business is losing time.
                </p>
              </div>

              <div>
                {error && <ErrorNote>{error}</ErrorNote>}
                <AskUserQuestions
                  questions={ALL_QUESTIONS}
                  currentIndex={gateIndex}
                  onCurrentIndexChange={setGateIndex}
                  onComplete={submit}
                  className="w-full"
                />
                {busy && (
                  <p className="mt-2 text-[12px] text-[var(--c-slate)]">Sending…</p>
                )}

                <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-[var(--c-slate)]">
                  <li>No card to start</li>
                  <li aria-hidden="true">·</li>
                  <li>About 15 minutes</li>
                  <li aria-hidden="true">·</li>
                  <li>A real response within 48 hours</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
      </div>
    </main>
  );
}
