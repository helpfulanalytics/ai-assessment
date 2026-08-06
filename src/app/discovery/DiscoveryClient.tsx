"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, Lock, ShieldCheck, Sparkles, AlertCircle } from "lucide-react";
import { ThinkingState } from "./ThinkingState";
import { Orb } from "./Orb";

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

/** What the report contains. Doubles as the paywall's value proof, so it stays truthful. */
const REPORT_CONTENTS = [
  "A written breakdown of every bottleneck we found, with hours lost per week",
  "3–7 specific off-the-shelf tools, each mapped to the bottleneck it solves",
  "An effort-vs-impact matrix so you know what to do first",
  "A four-day quick start plan, highest-impact fix on day one",
];

const GENERATING_STEPS = [
  "Reading back through your interview...",
  "Identifying where the time is going...",
  "Estimating hours lost per process...",
  "Matching bottlenecks to off-the-shelf tools...",
  "Scoring effort against impact...",
  "Building your four-day quick start plan...",
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--c-white)",
  border: "1px solid var(--c-powder)",
  borderRadius: "10px",
  padding: "11px 14px",
  fontSize: "14px",
  color: "var(--c-ink)",
  fontFamily: "inherit",
  outline: "none",
};

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
      <div style={{ background: "var(--c-violet)", borderRadius: "5px", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "#fff", fontSize: "10px", fontWeight: 700 }}>▲</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--c-ink)", letterSpacing: "-0.01em", lineHeight: 1.2 }}>AssessAI</span>
        <span style={{ fontSize: "9px", color: "var(--c-slate)", lineHeight: 1, marginTop: "2px" }}>powered by EraseFriction</span>
      </div>
    </div>
  );
}

function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" style={{ display: "flex", alignItems: "flex-start", gap: "7px", fontSize: "13px", color: "#b45309", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "9px", padding: "10px 13px", margin: "0 0 14px", lineHeight: 1.5 }}>
      <AlertCircle size={14} style={{ flexShrink: 0, marginTop: "2px" }} />
      {children}
    </p>
  );
}

export default function DiscoveryClient({ initial }: { initial: InitialState }) {
  const router = useRouter();

  const [sessionId, setSessionId] = useState(initial.kind === "session" ? initial.sessionId : "");
  const [status, setStatus] = useState(initial.kind === "session" ? initial.status : "gate");
  const [messages, setMessages] = useState<ChatMessage[]>(initial.kind === "session" ? initial.messages : []);
  const [progress, setProgress] = useState(initial.kind === "session" ? initial.progress : 0);
  const [chatComplete, setChatComplete] = useState(initial.kind === "session" ? initial.chatComplete : false);

  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");

  // A session that arrives already paid for and fully answered goes straight to
  // generating — derived here rather than set from an effect, so the page renders
  // in its real state on the first pass instead of flashing the chat.
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

  const paywall = initial.paywall;
  const blocked = chatComplete && paywall === "report" && status === "awaiting_payment";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => {
    if (!generating) return;
    const t = setInterval(() => setStep((s) => Math.min(s + 1, GENERATING_STEPS.length - 1)), 6000);
    return () => clearInterval(t);
  }, [generating]);

  /** Callers own the `generating` flag; this only performs the request and routes. */
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
    // An already-generated report is just a redirect. Otherwise, a session that
    // arrived entitled starts generating — including the return trip from Stripe,
    // so the client never has to press anything twice.
    if (initial.kind === "session" && initial.reportId) {
      router.replace(`/assessment/${initial.reportId}`);
      return;
    }
    // generate() only setStates behind an await, on the failure path — no synchronous
    // cascade, which the rule can't see through the async boundary.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (arrivesEntitled) generate();
    // Mount-only: this is an arrival decision, not a reaction to state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startSession(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const endpoint = paywall === "upfront" ? "/api/checkout" : "/api/discovery";
      const payload = paywall === "upfront"
        ? { name, email, company }
        : { action: "start", email, company, contact: name };

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

      // Upfront payers have nothing left to do — the report starts building itself.
      if (data.chatComplete && paywall === "upfront") {
        setBusy(false);
        setGenerating(true);
        generate();
        return;
      }
    } catch (err) {
      // Put the answer back so nothing the client typed is lost to a failed turn.
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

  const shell = (children: React.ReactNode) => (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--c-porcelain)", fontFamily: "var(--font-sans)" }}>
      <header style={{ background: "var(--c-white)", borderBottom: "1px solid var(--c-powder)", padding: "0 20px", height: "52px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <Logo />
        {sessionId && !chatComplete && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--c-ghost)", letterSpacing: "0.3px", textTransform: "uppercase" }}>
              {Math.round(progress * 100)}% through
            </span>
            <div style={{ width: "88px", height: "4px", borderRadius: "100px", background: "var(--c-powder)", overflow: "hidden" }}>
              <div style={{ width: "100%", height: "100%", background: "var(--c-violet)", borderRadius: "100px", transformOrigin: "left", transform: `scaleX(${Math.max(progress, 0.04)})`, transition: "transform 500ms cubic-bezier(0.22, 1, 0.36, 1)" }} />
            </div>
          </div>
        )}
      </header>
      {children}
    </div>
  );

  // ── Generating ──
  if (generating) {
    return shell(
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ maxWidth: "440px", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", margin: "0 0 18px" }}>
            <Orb variant="G1" size={40} style={{ color: "var(--c-violet)" }} label="Building your assessment" />
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 300, color: "var(--c-ink)", letterSpacing: "-0.025em", margin: "0 0 10px" }}>
            Building your assessment
          </h1>
          <p style={{ fontSize: "14px", color: "var(--c-slate)", lineHeight: 1.65, margin: "0 0 22px" }}>
            {GENERATING_STEPS[step]}
          </p>
          <p style={{ fontSize: "12px", color: "var(--c-ghost)", margin: 0 }}>
            This takes about a minute. Don&apos;t close this page — we&apos;ll also email you the link.
          </p>
        </div>
      </main>
    );
  }

  // ── Paywall (report position) ──
  if (blocked) {
    return shell(
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        <div style={{ maxWidth: "480px", width: "100%" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "var(--c-violet-bg)", color: "var(--c-violet)", borderRadius: "100px", padding: "5px 12px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.4px", textTransform: "uppercase", marginBottom: "16px" }}>
            <Sparkles size={12} /> Interview complete
          </div>

          <h1 style={{ fontSize: "clamp(24px, 5vw, 32px)", fontWeight: 300, color: "var(--c-ink)", letterSpacing: "-0.03em", margin: "0 0 12px", lineHeight: 1.2 }}>
            Your assessment is ready to build.
          </h1>
          <p style={{ fontSize: "15px", color: "var(--c-slate)", lineHeight: 1.7, margin: "0 0 24px" }}>
            You answered every question — that&apos;s everything needed. Unlock your report and it&apos;s generated and emailed to you in about a minute.
          </p>

          {error && <ErrorNote>{error}</ErrorNote>}

          <div style={{ background: "var(--c-white)", border: "1px solid var(--c-powder)", borderRadius: "14px", padding: "22px 24px", marginBottom: "18px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--c-slate)", letterSpacing: "0.5px", textTransform: "uppercase", margin: "0 0 14px" }}>
              What you get
            </p>
            {REPORT_CONTENTS.map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: "9px", marginBottom: "11px" }}>
                <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--c-violet)", flexShrink: 0, marginTop: "7px" }} />
                <p style={{ fontSize: "14px", color: "var(--c-slate)", lineHeight: 1.6, margin: 0 }}>{item}</p>
              </div>
            ))}

            <button
              onClick={payForReport}
              disabled={busy}
              style={{ width: "100%", marginTop: "12px", padding: "14px", background: busy ? "var(--c-washed)" : "var(--c-violet)", color: "#fff", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: 600, cursor: busy ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontFamily: "inherit" }}
            >
              {busy ? <Orb variant="G1" size={15} label="Opening checkout" /> : <Lock size={14} />}
              {busy ? "Opening checkout..." : `Unlock my assessment — ${PRICE}`}
            </button>
          </div>

          <p style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "13px", color: "var(--c-slate)", lineHeight: 1.6, margin: 0 }}>
            <ShieldCheck size={15} style={{ color: "var(--c-green)", flexShrink: 0, marginTop: "1px" }} />
            If your assessment doesn&apos;t identify at least 5 recoverable hours a week, it says so on the front page — and your {PRICE} is refunded in full.
          </p>
        </div>
      </main>
    );
  }

  // ── Generation failed on a session that has nothing left to answer ──
  // Without this the client falls through to the chat view and is asked to keep
  // typing after they've already finished — and, in report mode, already paid.
  if (chatComplete && error && !generating) {
    return shell(
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        <div style={{ maxWidth: "440px", textAlign: "center" }}>
          <h1 style={{ fontSize: "24px", fontWeight: 300, color: "var(--c-ink)", letterSpacing: "-0.025em", margin: "0 0 12px", lineHeight: 1.2 }}>
            We couldn&apos;t finish your report
          </h1>
          <p style={{ fontSize: "15px", color: "var(--c-slate)", lineHeight: 1.7, margin: "0 0 8px" }}>
            {error}
          </p>
          <p style={{ fontSize: "14px", color: "var(--c-ghost)", lineHeight: 1.65, margin: "0 0 24px" }}>
            Your interview is saved and your payment is safe — nothing needs redoing. Try again, or
            reply to your receipt and we&apos;ll sort it out by hand.
          </p>
          <button
            onClick={() => { setError(null); setGenerating(true); generate(); }}
            style={{ padding: "13px 26px", background: "var(--c-violet)", color: "#fff", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  // ── Gate: name, email, company ──
  if (!sessionId) {
    return shell(
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        <div style={{ maxWidth: "420px", width: "100%" }}>
          <h1 style={{ fontSize: "clamp(24px, 5vw, 32px)", fontWeight: 300, color: "var(--c-ink)", letterSpacing: "-0.03em", margin: "0 0 12px", lineHeight: 1.2 }}>
            {paywall === "upfront" ? "Start your assessment." : "Let's talk about your business."}
          </h1>
          <p style={{ fontSize: "15px", color: "var(--c-slate)", lineHeight: 1.7, margin: "0 0 26px" }}>
            {paywall === "upfront"
              ? `${PRICE} gets you a 15-minute interview and a written assessment of where your business is losing time.`
              : "A 15-minute interview, then a written assessment of where your business is losing time. Nothing to pay to get started."}
          </p>

          {error && <ErrorNote>{error}</ErrorNote>}

          <form onSubmit={startSession}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--c-slate)", marginBottom: "6px" }}>Your name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jordan Reyes" style={{ ...inputStyle, marginBottom: "14px" }} />

            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--c-slate)", marginBottom: "6px" }}>Business name</label>
            <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Riverside Family Dental" style={{ ...inputStyle, marginBottom: "14px" }} />

            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--c-slate)", marginBottom: "6px" }}>Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.com" style={{ ...inputStyle, marginBottom: "8px" }} />
            <p style={{ fontSize: "12px", color: "var(--c-ghost)", margin: "0 0 20px", lineHeight: 1.5 }}>
              We send your report here, and a link back into your interview if you need to step away.
            </p>

            <button
              type="submit"
              disabled={busy}
              style={{ width: "100%", padding: "14px", background: busy ? "var(--c-washed)" : "var(--c-violet)", color: "#fff", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: 600, cursor: busy ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontFamily: "inherit" }}
            >
              {busy && <Orb variant="G1" size={15} label="One moment" />}
              {busy ? "One moment..." : paywall === "upfront" ? `Continue to payment — ${PRICE}` : "Start the interview"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  // ── Chat ──
  return shell(
    <>
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "28px 20px" }}>
        <div style={{ maxWidth: "660px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "16px" }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "82%",
                background: m.role === "user" ? "var(--c-violet)" : "var(--c-white)",
                color: m.role === "user" ? "#fff" : "var(--c-ink)",
                border: m.role === "user" ? "none" : "1px solid var(--c-powder)",
                borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                padding: "13px 17px",
                fontSize: "15px",
                lineHeight: 1.65,
                whiteSpace: "pre-wrap",
                boxShadow: m.role === "user" ? "none" : "0 1px 4px rgba(0,0,0,0.04)",
              }}>
                {m.content}
              </div>
            </div>
          ))}

          {busy && (
            <div style={{ display: "flex", justifyContent: "flex-start", padding: "13px 17px" }}>
              <ThinkingState />
            </div>
          )}
        </div>
      </div>

      <div style={{ borderTop: "1px solid var(--c-powder)", background: "var(--c-white)", padding: "14px 20px", flexShrink: 0 }}>
        <div style={{ maxWidth: "660px", margin: "0 auto" }}>
          {error && <ErrorNote>{error}</ErrorNote>}
          <div style={{ display: "flex", alignItems: "flex-end", gap: "9px" }}>
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder="Type your answer — the more specific, the better."
              aria-label="Your answer"
              style={{ ...inputStyle, resize: "none", maxHeight: "160px", minHeight: "44px", lineHeight: 1.55, padding: "12px 14px" }}
            />
            <button
              onClick={send}
              disabled={busy || !draft.trim()}
              aria-label="Send answer"
              style={{ flexShrink: 0, width: "44px", height: "44px", borderRadius: "10px", border: "none", background: draft.trim() && !busy ? "var(--c-violet)" : "var(--c-powder)", color: draft.trim() && !busy ? "#fff" : "var(--c-ghost)", cursor: draft.trim() && !busy ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <ArrowUp size={17} />
            </button>
          </div>
          <p style={{ fontSize: "11px", color: "var(--c-ghost)", margin: "8px 0 0", textAlign: "center" }}>
            Enter to send · Shift+Enter for a new line
          </p>
        </div>
      </div>
    </>
  );
}
