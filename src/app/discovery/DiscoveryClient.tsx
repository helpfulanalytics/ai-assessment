"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Link2, Lock, AlertCircle } from "lucide-react";
import { Orb } from "./Orb";
import { CLOSING_QUESTIONS, DISCOVERY_TOPICS, TOPIC_SUGGESTIONS } from "../../lib/discovery-script";
import { InputMessage, type QueuedMessage } from "../../components/ui/input-message";
import { ChatMessage } from "../../components/ui/chat-message";
import { ThinkingIndicator } from "../../components/ui/thinking-indicator";
import { ThinkingStep } from "../../components/ui/thinking-steps";
import {
  AskUserQuestions,
  type AskUserAnswer,
  type AskUserQuestion as AskUserQuestionSpec,
} from "../../components/ui/ask-user-questions";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Role = "assistant" | "user";
interface ChatMessage { role: Role; content: string; suggestions?: string[] }

export type InitialState =
  | { kind: "gate"; paywall: "upfront" | "report" }
  | {
      kind: "session";
      paywall: "upfront" | "report";
      sessionId: string;
      status: string;
      company: string;
      reportId: string | null;
      chatComplete: boolean;
      closingComplete: boolean;
      progress: number;
      messages: ChatMessage[];
    };

const PRICE = "$297";
const TOPIC_COUNT = DISCOVERY_TOPICS.length;

/** Mirrors the landing page's list exactly — the offer must not shrink at the moment of payment. */
const REPORT_CONTENTS = [
  "Every bottleneck we found, with hours lost per week",
  "3–7 named tools, each mapped to the bottleneck it solves",
  "Monthly cost and implementation effort for every recommendation",
  "An effort-vs-impact matrix so you know what to do first",
  "A four-day quick start plan, sequenced by impact",
  "An honest total — deduplicated, not the sum of best cases",
];

const GENERATING_STEPS = [
  "Reading back through your interview…",
  "Identifying where the time is going…",
  "Estimating hours lost per process…",
  "Matching bottlenecks to off-the-shelf tools…",
  "Scoring effort against impact…",
  "Building your four-day quick start plan…",
];

/** Shown once the scripted steps run out, so a slow generation never looks frozen. */
const GENERATING_HOLD = "Still writing — longer answers take a little longer to work through.";

const SUPPORT_EMAIL = "support@erasefriction.com";

/** The gate's three intake questions, one at a time — mirrors the interview's
 *  own one-question-at-a-time framing rather than a stacked form. */
const GATE_QUESTIONS: AskUserQuestionSpec[] = [
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
    title: "Where should we send your report?",
    freeText: true,
    freeTextMultiline: false,
    freeTextPlaceholder: "jane@acme.com",
    skippable: false,
    freeTextValidate: (v) => (EMAIL_RE.test(v) ? null : "That doesn't look like a valid email address."),
  },
];

/* ─────────────────────────── primitives ─────────────────────────── */

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <span className="flex size-5 items-center justify-center rounded-[6px] bg-[var(--c-ink)]">
        <span className="text-[10px] font-bold leading-none text-white">▲</span>
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-[13px] font-semibold tracking-tight text-[var(--c-ink)]">AssessAI</span>
        <span className="mt-0.5 text-[9px] text-[var(--c-slate)]">powered by EraseFriction</span>
      </span>
    </div>
  );
}

function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="mb-3.5 flex items-start gap-2 rounded-[6px] border border-[#fde68a] bg-[#fffbeb] px-3 py-2.5 text-[13px] leading-relaxed text-[#92400e]">
      <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
      {children}
    </p>
  );
}

const primaryBtnClass =
  "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[6px] bg-[var(--c-ink)] px-6 text-[15px] font-semibold text-white " +
  "transition-[opacity,transform] duration-150 hover:opacity-90 active:translate-y-px " +
  "disabled:cursor-default disabled:bg-[var(--c-slate)] disabled:opacity-100 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--c-ink)]";

/** One row of the interview's contents. The spine is the signature detail of this page. */
function TopicRow({ label, index, state }: { label: string; index: number; state: "done" | "current" | "todo" }) {
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

function topicState(i: number, current: number): "done" | "current" | "todo" {
  return i < current ? "done" : i === current ? "current" : "todo";
}

/* ─────────────────────────── component ─────────────────────────── */

export default function DiscoveryClient({ initial }: { initial: InitialState }) {
  const router = useRouter();

  const [sessionId, setSessionId] = useState(initial.kind === "session" ? initial.sessionId : "");
  const [status, setStatus] = useState(initial.kind === "session" ? initial.status : "gate");
  const [messages, setMessages] = useState<ChatMessage[]>(initial.kind === "session" ? initial.messages : []);
  const [progress, setProgress] = useState(initial.kind === "session" ? initial.progress : 0);
  const [chatComplete, setChatComplete] = useState(initial.kind === "session" ? initial.chatComplete : false);
  const [closingComplete, setClosingComplete] = useState(initial.kind === "session" ? initial.closingComplete : false);
  const [company, setCompany] = useState(initial.kind === "session" ? initial.company : "");

  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [queue, setQueue] = useState<QueuedMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  /** Which gate question (name / business / email) is showing — controlled so a
   *  failed submit can drop the user back onto the last one instead of stranding
   *  them past the end of the AskUserQuestions flow. */
  const [gateIndex, setGateIndex] = useState(0);
  /** Same idea, for the post-interview closing questions (urgency, 90-day win). */
  const [closingIndex, setClosingIndex] = useState(0);

  const arrivesEntitled =
    initial.kind === "session" &&
    !initial.reportId &&
    initial.chatComplete &&
    (initial.paywall === "upfront"
      ? initial.status !== "awaiting_payment"
      : initial.status === "paid" || initial.status === "complete");

  const [generating, setGenerating] = useState(arrivesEntitled);
  const [step, setStep] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  /** False once the user scrolls up to re-read; stops us yanking them back to the tail. */
  const followTail = useRef(true);
  /** The in-flight /api/discovery request, so the composer's Stop control can cancel it. */
  const sendAbortRef = useRef<AbortController | null>(null);

  const paywall = initial.paywall;
  const blocked = chatComplete && closingComplete && paywall === "report" && status === "awaiting_payment";
  const topicIndex = Math.min(Math.round(progress * TOPIC_COUNT), TOPIC_COUNT - 1);
  const answerCount = messages.filter((m) => m.role === "user").length;
  /** The composer's ArrowUp/ArrowDown recall — the client's own previous answers, oldest first. */
  const answerHistory = useMemo(
    () => messages.filter((m) => m.role === "user").map((m) => m.content),
    [messages]
  );

  /* Scroll discipline: follow the tail, but yield the moment the user scrolls up. */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      followTail.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [sessionId]);

  useEffect(() => {
    if (!followTail.current) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  /* A half-typed answer survives a reload or a stray back-swipe. Reading sessionStorage
     has to happen after hydration — the server cannot see it, so doing this during render
     would make the server and client markup disagree. */
  useEffect(() => {
    if (!sessionId) return;
    const saved = sessionStorage.getItem(`draft:${sessionId}`);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved) setDraft(saved);
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    const t = setTimeout(() => sessionStorage.setItem(`draft:${sessionId}`, draft), 400);
    return () => clearTimeout(t);
  }, [draft, sessionId]);

  useEffect(() => {
    if (!generating) return;
    const t = setInterval(() => setStep((s) => Math.min(s + 1, GENERATING_STEPS.length)), 6000);
    return () => clearInterval(t);
  }, [generating]);

  const generate = useCallback(async () => {
    try {
      const res = await fetch("/api/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      // Generation runs 30-90s+ server-side. A dropped connection or a killed
      // dev server mid-request lands here as an empty body, which res.json()
      // turns into a raw "Unexpected end of JSON input" SyntaxError — still an
      // Error instance, so it would otherwise flow straight through to the
      // customer verbatim. Give it a message that's actually theirs to read.
      let data: { id?: string; error?: string };
      try {
        data = await res.json();
      } catch {
        throw new Error(
          "Lost the connection before the report finished. Nothing was charged twice — try again."
        );
      }

      if (!res.ok) throw new Error(data.error ?? "Report generation failed.");
      router.push(`/assessment/${data.id}`);
    } catch (err) {
      setGenerating(false);
      setError(err instanceof Error ? err.message : "Report generation failed. Try again.");
    }
  }, [sessionId, router]);

  useEffect(() => {
    if (initial.kind === "session" && initial.reportId) {
      router.replace(`/assessment/${initial.reportId}`);
      return;
    }
    // generate() only setStates behind an await, on the failure path — no synchronous cascade.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (arrivesEntitled) generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Upfront-paywall sessions already paid before the interview started, so once
  // the closing questions are answered there's no checkout step left — go
  // straight to generation. `!error` stops this from retrying forever after a
  // failed attempt; the "failed" screen's own Try again button takes over from there.
  useEffect(() => {
    if (paywall === "upfront" && chatComplete && closingComplete && !generating && !error) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGenerating(true);
      generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paywall, chatComplete, closingComplete]);

  async function copyResumeLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setError("Couldn't copy — you can copy the address bar instead.");
    }
  }

  async function startSession(name: string, companyInput: string, email: string) {
    setBusy(true);
    setError(null);
    try {
      const endpoint = paywall === "upfront" ? "/api/checkout" : "/api/discovery";
      const payload =
        paywall === "upfront"
          ? { name, email, company: companyInput }
          : { action: "start", email, company: companyInput, contact: name };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not start your interview.");

      if (paywall === "upfront") {
        window.location.href = data.url;
        return;
      }

      setSessionId(data.sessionId);
      setStatus(data.status);
      setMessages(data.messages);
      setProgress(data.progress);
      setCompany(data.company ?? companyInput);
      window.history.replaceState(null, "", `/discovery?s=${data.sessionId}`);
      setTimeout(() => inputRef.current?.querySelector<HTMLTextAreaElement>("textarea")?.focus(), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start your interview.");
      // Drop back to the last question (email) so the user can retry the
      // submit without re-typing their name and business.
      setGateIndex(2);
    } finally {
      setBusy(false);
    }
  }

  async function send(rawText?: string) {
    const text = (rawText ?? draft).trim();
    if (!text || busy) return;

    const controller = new AbortController();
    sendAbortRef.current = controller;

    setBusy(true);
    setError(null);
    followTail.current = true;
    setMessages((m) => [...m, { role: "user", content: text }]);
    setDraft("");

    try {
      const res = await fetch("/api/discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: text }),
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");

      setMessages(data.messages);
      setProgress(data.progress);
      setStatus(data.status);
      setChatComplete(data.chatComplete);
      sessionStorage.removeItem(`draft:${sessionId}`);
      // Chat-complete falls through to the closing-questions screen (below) —
      // generation for upfront-paywall sessions is handled by the effect once
      // those are answered, not immediately here.
    } catch (err) {
      setMessages((m) => m.slice(0, -1));
      setDraft(text);
      // A user-initiated Stop lands here as an AbortError — the message and
      // draft are restored above, same as any other failed send, but silently:
      // it's not a failure worth an error banner.
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    } finally {
      sendAbortRef.current = null;
      setBusy(false);
      setTimeout(() => inputRef.current?.querySelector<HTMLTextAreaElement>("textarea")?.focus(), 50);
    }
  }

  /** Cancels the in-flight answer — the composer's Stop control (streaming, empty draft). */
  function stopSend() {
    sendAbortRef.current?.abort();
  }

  async function submitClosing(answers: Record<string, AskUserAnswer>) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const payload: Record<string, string> = {};
      for (const q of CLOSING_QUESTIONS) {
        const a = answers[q.id];
        if (!a) continue;
        if (q.freeText) {
          const text = (a.otherText ?? "").trim();
          if (text) payload[q.id] = text;
        } else {
          const opt = q.options?.find((o) => o.id === a.selectedIds[0]);
          if (opt) payload[q.id] = opt.title;
        }
      }

      const res = await fetch("/api/discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "closing", sessionId, answers: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save that.");

      setMessages(data.messages);
      setClosingComplete(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that.");
    } finally {
      setBusy(false);
    }
  }

  async function payForReport() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not open checkout.");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open checkout.");
      setBusy(false);
    }
  }

  /* ─────────────────────────── shell ─────────────────────────── */

  // The topic list now lives in the persistent sidebar, so its progress marks
  // reflect one piece of state regardless of which screen is showing: untouched
  // before a session exists, mid-interview during chat, all done once the
  // interview is complete (paywall / generating / failed screens).
  const sidebarTopicState = (i: number): "done" | "current" | "todo" => {
    if (!sessionId) return "todo";
    if (chatComplete) return "done";
    return topicState(i, topicIndex);
  };

  // A classic two-pane chat-app shell: a persistent left sidebar (the
  // interview's contents — a permanent conversation rail, not a per-screen
  // header) and a main pane whose content crossfades between screens.
  // Fixed to the viewport rather than min-height, so only the active pane
  // scrolls internally — the sidebar never gets carried off by page scroll.
  const shell = (children: React.ReactNode) => (
    <div className="flex h-dvh overflow-hidden bg-[var(--c-white)] font-sans">
      <motion.aside
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="hidden w-64 shrink-0 flex-col border-r border-[var(--c-powder)] bg-[var(--c-porcelain)] lg:flex"
      >
        <div className="px-4 pt-4">
          <Logo />
        </div>

        <div className="mt-6 min-h-0 flex-1 overflow-y-auto px-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--c-ghost)]">Your interview</p>
          <ul className="mt-2">
            {DISCOVERY_TOPICS.map((t, i) => (
              <TopicRow key={t.id} label={t.label} index={i} state={sidebarTopicState(i)} />
            ))}
          </ul>
        </div>

        <div className="border-t border-[var(--c-powder)] px-4 py-3">
          {sessionId && !chatComplete ? (
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12px] text-[var(--c-slate)] tabular-nums">
                Question <span className="font-medium text-[var(--c-ink)]">{topicIndex + 1}</span> of {TOPIC_COUNT}
              </span>
              <button
                onClick={copyResumeLink}
                className="inline-flex min-h-8 items-center gap-1.5 rounded-[6px] px-2 text-[12px] text-[var(--c-slate)] transition-colors duration-150 hover:text-[var(--c-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--c-ink)]"
              >
                {copied ? <Check size={13} aria-hidden="true" /> : <Link2 size={13} aria-hidden="true" />}
                {copied ? "Link copied" : "Save my link"}
              </button>
            </div>
          ) : (
            <p className="text-[12px] leading-relaxed text-[var(--c-slate)]">
              Answers save as you go.
              {paywall === "report" && <> The report is {PRICE} at the end.</>}
            </p>
          )}
        </div>
      </motion.aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--c-powder)] px-5 lg:hidden">
          <Logo />
          {sessionId && !chatComplete && (
            <div className="flex items-center gap-3">
              <span className="text-[12px] text-[var(--c-slate)] tabular-nums">
                Question <span className="font-medium text-[var(--c-ink)]">{topicIndex + 1}</span> of {TOPIC_COUNT}
              </span>
              <button
                onClick={copyResumeLink}
                aria-label={copied ? "Link copied" : "Save my link"}
                className="inline-flex size-8 items-center justify-center rounded-[6px] text-[var(--c-slate)] transition-colors duration-150 hover:text-[var(--c-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--c-ink)]"
              >
                {copied ? <Check size={14} aria-hidden="true" /> : <Link2 size={14} aria-hidden="true" />}
              </button>
            </div>
          )}
        </header>
        <AnimatePresence mode="wait">{children}</AnimatePresence>
      </div>
    </div>
  );

  const screenTransition = { duration: 0.22, ease: [0.16, 1, 0.3, 1] as const };

  /* ─────────────────────────── generating ─────────────────────────── */

  if (generating) {
    return shell(
      <motion.main
        key="generating"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={screenTransition}
        className="flex flex-1 items-center justify-center overflow-y-auto px-5 py-16 md:py-24"
        aria-busy="true"
      >
        <div className="w-full max-w-[440px]">
          <Orb variant="G1" size={36} style={{ color: "var(--c-ink)" }} label="Building your assessment" />
          <h1 className="mt-5 text-[26px] font-normal leading-tight tracking-tight text-[var(--c-ink)]">
            Writing {company || "your"} assessment
          </h1>
          <div aria-live="polite" className="mt-3 flex flex-col">
            {step >= GENERATING_STEPS.length ? (
              <p className="text-[15px] leading-relaxed text-[var(--c-slate)]">{GENERATING_HOLD}</p>
            ) : (
              GENERATING_STEPS.map((label, i) => (
                <ThinkingStep
                  key={label}
                  label={label}
                  status={i < step ? "complete" : i === step ? "active" : "pending"}
                  isLast={i === GENERATING_STEPS.length - 1}
                />
              ))
            )}
          </div>
          <p className="mt-5 border-t border-[var(--c-powder)] pt-4 text-[13px] leading-relaxed text-[var(--c-slate)]">
            Usually about a minute. Keep this tab open and your report opens by itself — if you need to go,
            we&apos;ll email the link to you. Nothing is lost either way.
          </p>
        </div>
      </motion.main>
    );
  }

  /* ─────────────────────────── generation failed ─────────────────────────── */

  if (chatComplete && closingComplete && error && !generating) {
    return shell(
      <motion.main
        key="failed"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={screenTransition}
        className="flex flex-1 items-center justify-center overflow-y-auto px-5 py-16 md:py-24"
      >
        <div className="w-full max-w-[460px]">
          <h1 className="text-[26px] font-normal leading-tight tracking-tight text-[var(--c-ink)]">
            Your interview and your payment are both safe.
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--c-slate)]">
            The report didn&apos;t finish writing. Nothing needs redoing — your answers are saved and we can pick
            up exactly where this stopped.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button onClick={() => { setError(null); setGenerating(true); generate(); }} className={primaryBtnClass + " sm:w-auto"}>
              Try again
            </button>
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Assessment didn't finish (${sessionId})`)}`}
              className="inline-flex min-h-11 items-center justify-center rounded-[6px] border border-[var(--c-stone)] px-6 text-[15px] font-medium text-[var(--c-ink)] transition-colors duration-150 hover:bg-[var(--c-white)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--c-ink)]"
            >
              Email us instead
            </a>
          </div>
          <p className="mt-5 text-[12px] leading-relaxed text-[var(--c-slate)]">
            Reference <code className="rounded bg-[var(--c-powder)] px-1 py-0.5 tabular-nums">{sessionId}</code> — it&apos;s already in the subject line.
          </p>
          <p className="mt-3 text-[12px] leading-relaxed text-[var(--c-slate)]">{error}</p>
        </div>
      </motion.main>
    );
  }

  /* ─────────────────────────── closing questions ─────────────────────────── */

  if (chatComplete && !closingComplete) {
    return shell(
      <motion.main
        key="closing"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={screenTransition}
        className="flex flex-1 items-start justify-center overflow-y-auto px-5 py-16 md:py-24 lg:py-28"
      >
        <div className="grid w-full max-w-2xl gap-10">
          <div>
            <p className="text-[13px] text-[var(--c-slate)]">
              <Check size={13} className="mr-1 inline text-[var(--c-ink)]" aria-hidden="true" />
              Interview complete
            </p>
            <h1 className="mt-2 text-[clamp(26px,4.5vw,34px)] font-normal leading-[1.15] tracking-tight text-[var(--c-ink)]">
              One last thing before we build your report.
            </h1>
            <p className="mt-3 max-w-[46ch] text-[15px] leading-relaxed text-[var(--c-slate)]">
              Two quick questions — they help the report tell you what to do first.
            </p>
          </div>

          <div>
            {error && <ErrorNote>{error}</ErrorNote>}
            <AskUserQuestions
              questions={CLOSING_QUESTIONS}
              currentIndex={closingIndex}
              onCurrentIndexChange={setClosingIndex}
              onComplete={submitClosing}
              className="w-full"
            />
            {busy && (
              <p className="mt-2 flex items-center gap-1.5 text-[12px] text-[var(--c-slate)]">
                <Orb variant="G1" size={12} label="One moment" />
                Saving…
              </p>
            )}
          </div>
        </div>
      </motion.main>
    );
  }

  /* ─────────────────────────── paywall ─────────────────────────── */

  if (blocked) {
    return shell(
      <motion.main
        key="paywall"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={screenTransition}
        className="flex flex-1 items-start justify-center overflow-y-auto px-5 py-16 md:py-24 lg:py-28"
      >
        <div className="grid w-full max-w-2xl gap-10">
          <div>
            <p className="text-[13px] text-[var(--c-slate)]">
              <Check size={13} className="mr-1 inline text-[var(--c-ink)]" aria-hidden="true" />
              Interview complete
            </p>
            <h1 className="mt-2 text-[clamp(26px,4.5vw,34px)] font-normal leading-[1.15] tracking-tight text-[var(--c-ink)]">
              {company ? `${company}'s assessment` : "Your assessment"} is ready to build.
            </h1>
            <p className="mt-3 max-w-[46ch] text-[15px] leading-relaxed text-[var(--c-slate)]">
              You gave {answerCount} answers across all {TOPIC_COUNT} topics — that&apos;s everything needed.
              Unlock it and the report is written and emailed to you in about a minute.
            </p>
          </div>

          <div>
            {error && <ErrorNote>{error}</ErrorNote>}
            <div className="rounded-lg border border-[var(--c-powder)] bg-[var(--c-white)] p-6">
              <p className="text-[13px] leading-relaxed text-[var(--c-slate)]">
                A consultant&apos;s discovery call is $2,000+ and takes a week.
              </p>
              <p className="mt-1 text-[32px] font-normal leading-none tracking-tight text-[var(--c-ink)] tabular-nums">{PRICE}</p>

              <ul className="mt-5 space-y-2.5">
                {REPORT_CONTENTS.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <Check size={13} strokeWidth={2.5} className="mt-1 shrink-0 text-[var(--c-slate)]" aria-hidden="true" />
                    <span className="text-[13px] leading-snug text-[var(--c-slate)]">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-5 rounded-[6px] border border-[var(--c-powder)] bg-[var(--c-porcelain)] p-3">
                <p className="text-[13px] font-medium text-[var(--c-ink)]">Find 5 hours a week, or it&apos;s free.</p>
                <p className="mt-1 text-[12px] leading-relaxed text-[var(--c-slate)]">
                  The report works the number out from your own answers. Under five, it says so on the front page
                  and you&apos;re refunded in full.
                </p>
              </div>

              <button onClick={payForReport} disabled={busy} className={primaryBtnClass + " mt-5"}>
                {busy ? <Orb variant="G1" size={15} label="Opening checkout" /> : <Lock size={14} aria-hidden="true" />}
                {busy ? "Opening checkout…" : `Build my assessment — ${PRICE}`}
              </button>

              <p className="mt-3 text-center text-[12px] leading-relaxed text-[var(--c-slate)]">
                Secure checkout by Stripe · one payment, no subscription
              </p>
            </div>

            <p className="mt-4 text-[13px] leading-relaxed text-[var(--c-slate)]">
              Not right now? Your interview stays saved at this page —{" "}
              <button onClick={copyResumeLink} className="font-medium text-[var(--c-ink)] underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--c-ink)]">
                {copied ? "link copied" : "copy the link"}
              </button>{" "}
              and come back to it.
            </p>
          </div>
        </div>
      </motion.main>
    );
  }

  /* ─────────────────────────── gate ─────────────────────────── */

  if (!sessionId) {
    return shell(
      <motion.main
        key="gate"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={screenTransition}
        className="flex flex-1 items-start justify-center overflow-y-auto px-5 py-16 md:py-24 lg:py-28"
      >
        <div className="grid w-full max-w-2xl gap-10">
          <div>
            <h1 className="text-[clamp(28px,5vw,38px)] font-normal leading-[1.12] tracking-tight text-[var(--c-ink)] text-balance">
              {paywall === "upfront" ? "Start your assessment." : "Let's talk about how your business runs."}
            </h1>
            <p className="mt-4 max-w-[48ch] text-[16px] leading-relaxed text-[var(--c-slate)]">
              {paywall === "upfront"
                ? `${PRICE} gets you the interview below and a written assessment of where your business is losing time.`
                : "Seven questions, about fifteen minutes. Then a written assessment of where your business is losing time."}
            </p>
          </div>

          <div>
            {error && <ErrorNote>{error}</ErrorNote>}
            <AskUserQuestions
              questions={GATE_QUESTIONS}
              currentIndex={gateIndex}
              onCurrentIndexChange={setGateIndex}
              onComplete={(answers: Record<string, AskUserAnswer>) => {
                if (busy) return;
                const val = (id: string) => (answers[id]?.otherText ?? "").trim();
                startSession(val("name"), val("company"), val("email"));
              }}
              className="w-full"
            />
            {busy && (
              <p className="mt-2 flex items-center gap-1.5 text-[12px] text-[var(--c-slate)]">
                <Orb variant="G1" size={12} label="One moment" />
                {paywall === "upfront" ? "Opening payment…" : "Starting your interview…"}
              </p>
            )}

            <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-[var(--c-slate)]">
              <li>No card to start</li>
              <li aria-hidden="true">·</li>
              <li>About 15 minutes</li>
              <li aria-hidden="true">·</li>
              <li>{PRICE} only if you want the report</li>
            </ul>
            <p className="mt-2.5 max-w-[42ch] text-[12px] leading-relaxed text-[var(--c-slate)]">
              If your assessment doesn&apos;t find at least 5 recoverable hours a week, it says so on the front page
              and you pay nothing.
            </p>
          </div>
        </div>
      </motion.main>
    );
  }

  /* ─────────────────────────── chat ─────────────────────────── */

  // The last assistant message is always the live question or probe — everything above
  // it is the record. Giving it prominence is what tells the user what to answer.
  const lastAssistant = messages.map((m) => m.role).lastIndexOf("assistant");

  return shell(
    <motion.main
      key="chat"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={screenTransition}
      className="flex min-h-0 min-w-0 flex-1 flex-col"
    >
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-8 sm:px-8">
          {messages.map((m, i) => {
            const isLive = i === lastAssistant && !busy;
            if (isLive) {
              return (
                <p
                  key={i}
                  className="max-w-[60ch] text-[19px] leading-[1.5] tracking-tight text-[var(--c-ink)] text-balance"
                >
                  {m.content}
                </p>
              );
            }
            return (
              <ChatMessage key={i} from={m.role}>
                {m.content}
              </ChatMessage>
            );
          })}

          {busy && <ThinkingIndicator />}
        </div>
      </div>

      {/* Floating composer — fades the transcript out behind it instead of a hard
          divider, so scrolled content disappears gradually under the input. */}
      <div className="shrink-0 bg-gradient-to-t from-[var(--c-white)] via-[var(--c-white)] to-transparent px-5 pb-6 pt-6 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-3xl"
        >
          {error && <ErrorNote>{error}</ErrorNote>}
          <InputMessage
            ref={inputRef}
            value={draft}
            onValueChange={setDraft}
            onSend={(value) => send(value)}
            minRows={2}
            maxRows={8}
            placeholder="Even a rough answer helps — say it how you'd say it out loud."
            sendLabel="Send answer"
            textareaProps={{ id: "d-answer", "aria-label": "Your answer" }}
            status={busy ? "streaming" : "idle"}
            onStop={stopSend}
            queue={queue}
            onQueueChange={setQueue}
            history={answerHistory}
            suggestions={
              messages[lastAssistant]?.suggestions?.length
                ? messages[lastAssistant].suggestions
                : TOPIC_SUGGESTIONS[DISCOVERY_TOPICS[topicIndex]?.id ?? ""]
            }
          />
          <p className="mt-2 flex items-center justify-between text-[12px] text-[var(--c-slate)]">
            <span>Enter to send · Shift+Enter for a new line · type ahead to queue your next answer</span>
            <span className="hidden items-center gap-1.5 sm:inline-flex">
              <Check size={12} aria-hidden="true" /> Saved as you go
            </span>
          </p>
        </motion.div>
      </div>
    </motion.main>
  );
}
