"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, Check, Link2, Lock, AlertCircle } from "lucide-react";
import { ThinkingState } from "./ThinkingState";
import { Orb } from "./Orb";
import { DISCOVERY_TOPICS } from "../../lib/discovery-script";

type Role = "assistant" | "user";
interface ChatMessage { role: Role; content: string }

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

/* ─────────────────────────── primitives ─────────────────────────── */

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <span className="flex size-5 items-center justify-center rounded-[6px] bg-[var(--c-violet)]">
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

const fieldClass =
  "w-full rounded-[6px] border border-[var(--c-powder)] bg-[var(--c-white)] px-3.5 py-2.5 text-[15px] text-[var(--c-ink)] " +
  "transition-[border-color,box-shadow] duration-150 placeholder:text-[var(--c-ghost)] " +
  "focus-visible:border-[var(--c-violet)] focus-visible:shadow-[0_0_0_3px_var(--c-violet-bg)] focus-visible:outline-none";

const primaryBtnClass =
  "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[6px] bg-[var(--c-violet)] px-6 text-[15px] font-semibold text-white " +
  "transition-[background-color,transform] duration-150 hover:bg-[#4630e0] active:translate-y-px " +
  "disabled:cursor-default disabled:bg-[var(--c-slate)] " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--c-violet)]";

/** One row of the interview's contents. The spine is the signature detail of this page. */
function TopicRow({ label, index, state }: { label: string; index: number; state: "done" | "current" | "todo" }) {
  return (
    <li className="flex items-start gap-2.5 py-1.5" aria-current={state === "current" ? "step" : undefined}>
      <span
        className={
          "mt-px flex size-[18px] shrink-0 items-center justify-center rounded-full text-[10px] font-semibold tabular-nums " +
          (state === "done"
            ? "bg-[var(--c-violet-bg)] text-[var(--c-violet)]"
            : state === "current"
            ? "bg-[var(--c-violet)] text-white"
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
  const [company, setCompany] = useState(initial.kind === "session" ? initial.company : "");

  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [companyInput, setCompanyInput] = useState("");

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
  const inputRef = useRef<HTMLTextAreaElement>(null);
  /** False once the user scrolls up to re-read; stops us yanking them back to the tail. */
  const followTail = useRef(true);

  const paywall = initial.paywall;
  const blocked = chatComplete && paywall === "report" && status === "awaiting_payment";
  const topicIndex = Math.min(Math.round(progress * TOPIC_COUNT), TOPIC_COUNT - 1);
  const answerCount = messages.filter((m) => m.role === "user").length;

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

  /* Auto-grow the composer. maxHeight matches the class below. */
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [draft]);

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
      const data = await res.json();
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

  async function copyResumeLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setError("Couldn't copy — you can copy the address bar instead.");
    }
  }

  async function startSession(e: React.FormEvent) {
    e.preventDefault();
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
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start your interview.");
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    const text = draft.trim();
    if (!text || busy) return;

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
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");

      setMessages(data.messages);
      setProgress(data.progress);
      setStatus(data.status);
      setChatComplete(data.chatComplete);
      sessionStorage.removeItem(`draft:${sessionId}`);

      if (data.chatComplete && paywall === "upfront") {
        setBusy(false);
        setGenerating(true);
        generate();
        return;
      }
    } catch (err) {
      setMessages((m) => m.slice(0, -1));
      setDraft(text);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
      setTimeout(() => inputRef.current?.focus(), 50);
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

  const shell = (children: React.ReactNode, opts?: { rail?: boolean }) => (
    <div className="flex min-h-[100dvh] flex-col bg-[var(--c-porcelain)] font-sans">
      <header className="flex h-13 shrink-0 items-center justify-between border-b border-[var(--c-powder)] bg-[var(--c-white)] px-5 py-3">
        <Logo />
        {sessionId && !chatComplete && (
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-[var(--c-slate)] tabular-nums">
              Question <span className="font-medium text-[var(--c-ink)]">{topicIndex + 1}</span> of {TOPIC_COUNT}
            </span>
            <button
              onClick={copyResumeLink}
              className="inline-flex min-h-8 items-center gap-1.5 rounded-[6px] px-2 text-[12px] text-[var(--c-slate)] transition-colors duration-150 hover:text-[var(--c-violet)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--c-violet)]"
            >
              {copied ? <Check size={13} aria-hidden="true" /> : <Link2 size={13} aria-hidden="true" />}
              <span className="hidden sm:inline">{copied ? "Link copied" : "Save my link"}</span>
            </button>
          </div>
        )}
      </header>
      <div className={opts?.rail ? "mx-auto flex w-full max-w-5xl flex-1 gap-10 px-5" : "flex flex-1 flex-col"}>{children}</div>
    </div>
  );

  /* ─────────────────────────── generating ─────────────────────────── */

  if (generating) {
    return shell(
      <main className="flex flex-1 items-center justify-center px-5 py-16" aria-busy="true">
        <div className="w-full max-w-[440px]">
          <Orb variant="G1" size={36} style={{ color: "var(--c-violet)" }} label="Building your assessment" />
          <h1 className="mt-5 text-[26px] font-normal leading-tight tracking-tight text-[var(--c-ink)]">
            Writing {company || "your"} assessment
          </h1>
          <p aria-live="polite" className="mt-2.5 text-[15px] leading-relaxed text-[var(--c-slate)]">
            {GENERATING_STEPS[step] ?? GENERATING_HOLD}
          </p>
          <p className="mt-5 border-t border-[var(--c-powder)] pt-4 text-[13px] leading-relaxed text-[var(--c-slate)]">
            Usually about a minute. Keep this tab open and your report opens by itself — if you need to go,
            we&apos;ll email the link to you. Nothing is lost either way.
          </p>
        </div>
      </main>
    );
  }

  /* ─────────────────────────── generation failed ─────────────────────────── */

  if (chatComplete && error && !generating) {
    return shell(
      <main className="flex flex-1 items-center justify-center px-5 py-16">
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
              className="inline-flex min-h-11 items-center justify-center rounded-[6px] border border-[var(--c-stone)] px-6 text-[15px] font-medium text-[var(--c-ink)] transition-colors duration-150 hover:bg-[var(--c-white)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--c-violet)]"
            >
              Email us instead
            </a>
          </div>
          <p className="mt-5 text-[12px] leading-relaxed text-[var(--c-slate)]">
            Reference <code className="rounded bg-[var(--c-powder)] px-1 py-0.5 tabular-nums">{sessionId}</code> — it&apos;s already in the subject line.
          </p>
          <p className="mt-3 text-[12px] leading-relaxed text-[var(--c-slate)]">{error}</p>
        </div>
      </main>
    );
  }

  /* ─────────────────────────── paywall ─────────────────────────── */

  if (blocked) {
    return shell(
      <main className="flex flex-1 items-start justify-center px-5 py-12 sm:py-16">
        <div className="grid w-full max-w-4xl gap-10 lg:grid-cols-[1fr_360px] lg:gap-14">
          <div>
            <p className="text-[13px] text-[var(--c-slate)]">
              <Check size={13} className="mr-1 inline text-[var(--c-violet)]" aria-hidden="true" />
              Interview complete
            </p>
            <h1 className="mt-2 text-[clamp(26px,4.5vw,34px)] font-normal leading-[1.15] tracking-tight text-[var(--c-ink)]">
              {company ? `${company}'s assessment` : "Your assessment"} is ready to build.
            </h1>
            <p className="mt-3 max-w-[46ch] text-[15px] leading-relaxed text-[var(--c-slate)]">
              You gave {answerCount} answers across all {TOPIC_COUNT} topics — that&apos;s everything needed.
              Unlock it and the report is written and emailed to you in about a minute.
            </p>

            <p className="mt-8 text-[13px] font-medium text-[var(--c-ink)]">What you told us about</p>
            <ul className="mt-2">
              {DISCOVERY_TOPICS.map((t, i) => (
                <TopicRow key={t.id} label={t.label} index={i} state="done" />
              ))}
            </ul>
          </div>

          <div>
            {error && <ErrorNote>{error}</ErrorNote>}
            <div className="rounded-[10px] border border-[var(--c-powder)] bg-[var(--c-white)] p-6 shadow-[0_1px_2px_rgba(6,27,49,0.04),0_8px_24px_-12px_rgba(6,27,49,0.10)]">
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
              <button onClick={copyResumeLink} className="font-medium text-[var(--c-violet)] underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--c-violet)]">
                {copied ? "link copied" : "copy the link"}
              </button>{" "}
              and come back to it.
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* ─────────────────────────── gate ─────────────────────────── */

  if (!sessionId) {
    return shell(
      <main className="flex flex-1 items-start justify-center px-5 py-12 sm:py-16">
        <div className="grid w-full max-w-4xl gap-10 lg:grid-cols-[1fr_380px] lg:gap-16">
          <div className="lg:pt-1">
            <h1 className="text-[clamp(28px,5vw,38px)] font-normal leading-[1.12] tracking-tight text-[var(--c-ink)] text-balance">
              {paywall === "upfront" ? "Start your assessment." : "Let's talk about how your business runs."}
            </h1>
            <p className="mt-4 max-w-[48ch] text-[16px] leading-relaxed text-[var(--c-slate)]">
              {paywall === "upfront"
                ? `${PRICE} gets you the interview below and a written assessment of where your business is losing time.`
                : "Seven questions, about fifteen minutes. Then a written assessment of where your business is losing time."}
            </p>

            <p className="mt-8 text-[13px] font-medium text-[var(--c-ink)]">What we&apos;ll cover</p>
            <ul className="mt-2 max-w-[38ch]">
              {DISCOVERY_TOPICS.map((t, i) => (
                <TopicRow key={t.id} label={t.label} index={i} state="todo" />
              ))}
            </ul>
          </div>

          <div className="lg:pt-2">
            {error && <ErrorNote>{error}</ErrorNote>}
            <form onSubmit={startSession} noValidate>
              <div className="flex flex-col gap-4">
                <div>
                  <label htmlFor="d-name" className="mb-1.5 block text-[13px] font-medium text-[var(--c-ink)]">Your name</label>
                  <input id="d-name" name="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
                </div>
                <div>
                  <label htmlFor="d-company" className="mb-1.5 block text-[13px] font-medium text-[var(--c-ink)]">Business name</label>
                  <input id="d-company" name="organization" autoComplete="organization" value={companyInput} onChange={(e) => setCompanyInput(e.target.value)} aria-describedby="d-company-hint" className={fieldClass} />
                  <p id="d-company-hint" className="mt-1.5 text-[12px] text-[var(--c-slate)]">Your report is titled and written for this business.</p>
                </div>
                <div>
                  <label htmlFor="d-email" className="mb-1.5 block text-[13px] font-medium text-[var(--c-ink)]">Email</label>
                  <input id="d-email" name="email" type="email" inputMode="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} aria-describedby="d-email-hint" className={fieldClass} />
                  <p id="d-email-hint" className="mt-1.5 text-[12px] leading-relaxed text-[var(--c-slate)]">Where your finished report gets sent.</p>
                </div>
              </div>

              <button type="submit" disabled={busy} className={primaryBtnClass + " mt-6"}>
                {busy && <Orb variant="G1" size={15} label="One moment" />}
                {busy ? "One moment…" : paywall === "upfront" ? `Continue to payment — ${PRICE}` : "Start the interview"}
              </button>
            </form>

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
      </main>
    );
  }

  /* ─────────────────────────── chat ─────────────────────────── */

  // The last assistant message is always the live question or probe — everything above
  // it is the record. Giving it prominence is what tells the user what to answer.
  const lastAssistant = messages.map((m) => m.role).lastIndexOf("assistant");

  return shell(
    <>
      <aside className="hidden w-52 shrink-0 py-8 lg:block">
        <p className="text-[13px] font-medium text-[var(--c-ink)]">Your interview</p>
        <ul className="mt-2.5">
          {DISCOVERY_TOPICS.map((t, i) => (
            <TopicRow key={t.id} label={t.label} index={i} state={topicState(i, topicIndex)} />
          ))}
        </ul>
        <p className="mt-4 border-t border-[var(--c-powder)] pt-3 text-[12px] leading-relaxed text-[var(--c-slate)]">
          Answers save as you go.
          {paywall === "report" && <> The report is {PRICE} at the end.</>}
        </p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div ref={scrollRef} className="flex-1 overflow-y-auto py-8">
          <p className="mb-5 text-[13px] text-[var(--c-slate)] lg:hidden">
            <span className="font-medium text-[var(--c-ink)]">{DISCOVERY_TOPICS[topicIndex]?.label}</span>
            {" · "}
            <span className="tabular-nums">{topicIndex + 1} of {TOPIC_COUNT}</span>
          </p>

          <div className="flex flex-col gap-5" aria-live="polite" aria-atomic="false">
            {messages.map((m, i) => {
              const isLive = i === lastAssistant && !busy;
              if (m.role === "assistant") {
                return (
                  <p
                    key={i}
                    className={
                      isLive
                        ? "max-w-[60ch] text-[19px] leading-[1.5] tracking-tight text-[var(--c-ink)] text-balance"
                        : "max-w-[62ch] text-[15px] leading-relaxed text-[var(--c-slate)]"
                    }
                  >
                    {m.content}
                  </p>
                );
              }
              return (
                <div key={i} className="flex justify-end">
                  <p className="max-w-[54ch] whitespace-pre-wrap rounded-[10px] rounded-br-[3px] bg-[var(--c-powder)] px-4 py-3 text-[15px] leading-relaxed text-[var(--c-ink)]">
                    {m.content}
                  </p>
                </div>
              );
            })}

            {busy && <ThinkingState />}
          </div>
        </div>

        <div className="sticky bottom-0 shrink-0 border-t border-[var(--c-powder)] bg-[var(--c-porcelain)] py-4">
          {error && <ErrorNote>{error}</ErrorNote>}
          <div className="flex items-end gap-2.5">
            <label htmlFor="d-answer" className="sr-only">Your answer</label>
            <textarea
              id="d-answer"
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={2}
              placeholder="Even a rough answer helps — say it how you'd say it out loud."
              className={fieldClass + " max-h-[200px] min-h-[64px] resize-none leading-relaxed"}
            />
            <button
              onClick={send}
              disabled={busy || !draft.trim()}
              aria-label="Send answer"
              className="flex size-11 shrink-0 items-center justify-center rounded-[6px] bg-[var(--c-violet)] text-white transition-[background-color,transform] duration-150 hover:bg-[#4630e0] active:translate-y-px disabled:bg-[var(--c-powder)] disabled:text-[var(--c-slate)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--c-violet)]"
            >
              <ArrowUp size={17} aria-hidden="true" />
            </button>
          </div>
          <p className="mt-2 flex items-center justify-between text-[12px] text-[var(--c-slate)]">
            <span>Enter to send · Shift+Enter for a new line</span>
            <span className="hidden items-center gap-1.5 sm:inline-flex">
              <Check size={12} aria-hidden="true" /> Saved as you go
            </span>
          </p>
        </div>
      </div>
    </>,
    { rail: true }
  );
}
