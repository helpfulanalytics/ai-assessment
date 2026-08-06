"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import {
  MessageSquareText, FileText, ShieldCheck, Clock,
  ArrowRight, Check, Plus, Minus,
} from "lucide-react";

const PRICE = "$297";

/* ── Scroll reveal ── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Fallback in case IntersectionObserver never fires (older Safari, prerender).
    const fallback = setTimeout(() => setVisible(true), 900);
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          clearTimeout(fallback);
          obs.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => { clearTimeout(fallback); obs.disconnect(); };
  }, []);

  return { ref, visible };
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(18px)",
        transition: `opacity 620ms cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 620ms cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ── Primitives ── */
function CTA({ children, subtle }: { children: React.ReactNode; subtle?: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href="/discovery"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: "8px",
        padding: subtle ? "12px 22px" : "15px 30px",
        background: subtle ? "transparent" : "var(--c-violet)",
        color: subtle ? "var(--c-ink)" : "#fff",
        border: subtle ? "1px solid var(--c-stone)" : "none",
        borderRadius: "10px",
        fontSize: subtle ? "14px" : "16px",
        fontWeight: 600,
        letterSpacing: "-0.01em",
        textDecoration: "none",
        transform: hovered ? "translateY(-1px)" : "translateY(0)",
        boxShadow: hovered && !subtle ? "0 8px 22px -6px rgba(83,58,253,0.45)" : "none",
        transition: "transform 200ms cubic-bezier(0.22,1,0.36,1), box-shadow 200ms ease",
      }}
    >
      {children}
      <ArrowRight size={subtle ? 14 : 16} style={{ transform: hovered ? "translateX(2px)" : "none", transition: "transform 200ms cubic-bezier(0.22,1,0.36,1)" }} />
    </Link>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--c-violet)", letterSpacing: "0.6px", textTransform: "uppercase", margin: "0 0 14px" }}>
      {children}
    </p>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: "clamp(26px, 4.2vw, 42px)", fontWeight: 300, color: "var(--c-ink)", letterSpacing: "-0.028em", lineHeight: 1.14, margin: "0 0 16px" }}>
      {children}
    </h2>
  );
}

function Lede({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: "16px", color: "var(--c-slate)", lineHeight: 1.75, margin: "0 0 44px", maxWidth: "560px" }}>
      {children}
    </p>
  );
}

const SECTION: React.CSSProperties = { maxWidth: "1080px", margin: "0 auto", padding: "0 24px" };

/* ── Content ── */
const STEPS = [
  {
    icon: <MessageSquareText size={19} />,
    title: "Answer questions, not forms",
    body: "You'll talk through how your business actually runs — a typical week, what eats your time, where things slip. When you say something interesting, it digs deeper, the way a good consultant would. About 15 minutes.",
  },
  {
    icon: <FileText size={19} />,
    title: "Your report is written on the spot",
    body: "Every bottleneck you described, with the hours it costs you each week. Then the specific off-the-shelf tools that fix each one — real products with real prices, not \"leverage AI\" hand-waving.",
  },
  {
    icon: <Clock size={19} />,
    title: "Start Monday, not next quarter",
    body: "The report ends with a four-day plan that puts the highest-impact fix on day one. Nothing on it needs a developer, and nothing on it takes a month.",
  },
];

const CONTENTS = [
  "Every bottleneck we found, with hours lost per week",
  "3–7 named tools, each mapped to the bottleneck it solves",
  "Monthly cost and implementation effort for every recommendation",
  "An effort-vs-impact matrix so you know what to do first",
  "A four-day quick start plan, sequenced by impact",
  "An honest total — deduplicated, not the sum of best cases",
];

const FIT = [
  { label: "Fits", items: ["2–20 people", "$500K–$5M in revenue", "You're still doing ops yourself", "You suspect you're wasting time but can't name where"] },
  { label: "Doesn't fit", items: ["Solo, with no one to delegate to", "You already have an ops manager", "You want custom software built", "You want someone to do the implementing"] },
];

const FAQS = [
  {
    q: "Is this actually a consultant, or a chatbot?",
    a: "It's software. The interview follows the same structure a consultant uses on a discovery call — the same topics, in the same order, with follow-ups when you say something worth digging into. What you're paying for is the analysis and the report, delivered in an hour instead of a week, which is why it's $297 and not $2,970.",
  },
  {
    q: "What if it doesn't find anything?",
    a: "Then your report says so on the front page, and you get every dollar back. We promise at least 5 recoverable hours a week. The report calculates that number from your own answers and flags itself when it falls short — we'd rather tell you than pad the estimate.",
  },
  {
    q: "How long does the interview take?",
    a: "About 15 minutes. There are seven topics and you can answer in as much or as little detail as you like — though the more specific you are, the sharper the report. You can step away and pick up where you left off from the link in your email.",
  },
  {
    q: "Will it just tell me to use ChatGPT?",
    a: "No. Recommendations are real, purchasable products — the kind you'd find on a tool directory — chosen against the specific problem you described, with the monthly cost and the effort to set them up. If a problem genuinely doesn't need software, the report says that instead.",
  },
  {
    q: "Who sees my answers?",
    a: "Your interview is used to write your report and nothing else. The report lives at a private link only you have, and we email it to you so you always have a copy.",
  },
];

function FAQItem({ q, a, delay }: { q: string; a: string; delay: number }) {
  const [open, setOpen] = useState(false);
  return (
    <Reveal delay={delay}>
      <div style={{ borderBottom: "1px solid var(--c-powder)" }}>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", padding: "20px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
        >
          <span style={{ fontSize: "16px", fontWeight: 500, color: "var(--c-ink)", letterSpacing: "-0.012em", lineHeight: 1.45 }}>{q}</span>
          <span style={{ flexShrink: 0, color: "var(--c-violet)", display: "flex" }}>
            {open ? <Minus size={16} /> : <Plus size={16} />}
          </span>
        </button>
        <div style={{ display: "grid", gridTemplateRows: open ? "1fr" : "0fr", transition: "grid-template-rows 320ms cubic-bezier(0.22,1,0.36,1)" }}>
          <div style={{ overflow: "hidden" }}>
            <p style={{ fontSize: "15px", color: "var(--c-slate)", lineHeight: 1.75, margin: "0 0 22px", maxWidth: "660px" }}>{a}</p>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

export default function Home() {
  return (
    <div style={{ background: "var(--c-white)", fontFamily: "var(--font-sans)", overflowX: "hidden" }}>

      {/* ── Nav ── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(255,255,255,0.86)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--c-powder)" }}>
        <div style={{ ...SECTION, height: "62px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ background: "var(--c-violet)", borderRadius: "6px", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontSize: "11px", fontWeight: 700 }}>▲</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--c-ink)", letterSpacing: "-0.015em", lineHeight: 1.2 }}>AssessAI</span>
              <span style={{ fontSize: "9px", color: "var(--c-slate)", lineHeight: 1, marginTop: "2px" }}>powered by EraseFriction</span>
            </div>
          </div>
          <CTA subtle>Start — {PRICE}</CTA>
        </div>
      </nav>

      {/* ── Hero ── */}
      <header style={{ ...SECTION, paddingTop: "clamp(64px, 11vw, 120px)", paddingBottom: "clamp(56px, 9vw, 100px)" }}>
        <Reveal>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "7px", background: "var(--c-violet-bg)", color: "var(--c-violet)", borderRadius: "100px", padding: "6px 14px", fontSize: "12px", fontWeight: 600, marginBottom: "26px" }}>
            <ShieldCheck size={13} />
            5 hours a week back, or your money back
          </div>
        </Reveal>

        <Reveal delay={60}>
          <h1 style={{ fontSize: "clamp(34px, 6.6vw, 68px)", fontWeight: 300, color: "var(--c-ink)", letterSpacing: "-0.038em", lineHeight: 1.06, margin: "0 0 22px", maxWidth: "880px" }}>
            You know your business is<br />wasting time. This tells you<br />exactly where.
          </h1>
        </Reveal>

        <Reveal delay={120}>
          <p style={{ fontSize: "clamp(16px, 2vw, 19px)", color: "var(--c-slate)", lineHeight: 1.7, margin: "0 0 34px", maxWidth: "580px" }}>
            A 15-minute interview about how your business actually runs. Then a written
            assessment of every bottleneck it found, the tools that fix each one, and a
            four-day plan to start. {PRICE}, delivered the same hour.
          </p>
        </Reveal>

        <Reveal delay={180}>
          <div style={{ display: "flex", alignItems: "center", gap: "18px", flexWrap: "wrap" }}>
            <CTA>Start your assessment</CTA>
            <span style={{ fontSize: "13px", color: "var(--c-ghost)" }}>
              No account needed · 15 minutes
            </span>
          </div>
        </Reveal>
      </header>

      {/* ── How it works ── */}
      <section style={{ background: "var(--c-porcelain)", borderTop: "1px solid var(--c-powder)", borderBottom: "1px solid var(--c-powder)", padding: "clamp(56px, 9vw, 96px) 0" }}>
        <div style={SECTION}>
          <Reveal><Eyebrow>How it works</Eyebrow></Reveal>
          <Reveal delay={50}><SectionTitle>A discovery call, without the calendar.</SectionTitle></Reveal>
          <Reveal delay={90}>
            <Lede>
              The value of a consultant&apos;s first call isn&apos;t the consultant — it&apos;s the
              questions, asked in the right order, with someone paying attention to the answers.
              That part is repeatable.
            </Lede>
          </Reveal>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(268px, 1fr))", gap: "18px" }}>
            {STEPS.map((step, i) => (
              <Reveal key={step.title} delay={140 + i * 70}>
                <div style={{ background: "var(--c-white)", border: "1px solid var(--c-powder)", borderRadius: "14px", padding: "26px 26px 28px", height: "100%", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                  <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "var(--c-violet-bg)", color: "var(--c-violet)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "18px" }}>
                    {step.icon}
                  </div>
                  <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--c-ghost)", letterSpacing: "0.5px", margin: "0 0 7px" }}>
                    STEP {i + 1}
                  </p>
                  <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--c-ink)", letterSpacing: "-0.018em", margin: "0 0 10px", lineHeight: 1.3 }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: "14px", color: "var(--c-slate)", lineHeight: 1.7, margin: 0 }}>
                    {step.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── What's in the report ── */}
      <section style={{ ...SECTION, padding: "clamp(56px, 9vw, 96px) 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "clamp(32px, 5vw, 64px)", alignItems: "start" }}>
          <div>
            <Reveal><Eyebrow>What you get</Eyebrow></Reveal>
            <Reveal delay={50}><SectionTitle>A document you can act on, not a score.</SectionTitle></Reveal>
            <Reveal delay={90}>
              <Lede>
                Every recommendation names a real product, what it costs per month, and how much
                work it is to set up. If a fix isn&apos;t worth the effort, the report tells you that too.
              </Lede>
            </Reveal>
          </div>

          <Reveal delay={140}>
            <div style={{ background: "var(--c-porcelain)", border: "1px solid var(--c-powder)", borderRadius: "14px", padding: "28px 30px" }}>
              {CONTENTS.map((item, i) => (
                <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: "11px", marginBottom: i === CONTENTS.length - 1 ? 0 : "15px" }}>
                  <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: "var(--c-violet-bg)", color: "var(--c-violet)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" }}>
                    <Check size={11} strokeWidth={3} />
                  </div>
                  <p style={{ fontSize: "15px", color: "var(--c-ink)", lineHeight: 1.6, margin: 0 }}>{item}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Fit ── */}
      <section style={{ background: "var(--c-porcelain)", borderTop: "1px solid var(--c-powder)", borderBottom: "1px solid var(--c-powder)", padding: "clamp(56px, 9vw, 96px) 0" }}>
        <div style={SECTION}>
          <Reveal><Eyebrow>Honest fit</Eyebrow></Reveal>
          <Reveal delay={50}><SectionTitle>This isn&apos;t for everyone.</SectionTitle></Reveal>
          <Reveal delay={90}>
            <Lede>
              The assessment is built for owner-operated businesses with enough people to have
              real handoffs, and not so many that you already have someone managing them.
            </Lede>
          </Reveal>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "18px" }}>
            {FIT.map((col, i) => {
              const good = i === 0;
              return (
                <Reveal key={col.label} delay={140 + i * 70}>
                  <div style={{ background: "var(--c-white)", border: `1px solid ${good ? "#bbf7d0" : "var(--c-powder)"}`, borderRadius: "14px", padding: "24px 26px", height: "100%" }}>
                    <p style={{ fontSize: "11px", fontWeight: 700, color: good ? "#16a34a" : "var(--c-ghost)", letterSpacing: "0.5px", textTransform: "uppercase", margin: "0 0 16px" }}>
                      {col.label}
                    </p>
                    {col.items.map((item, j) => (
                      <p key={item} style={{ fontSize: "15px", color: good ? "var(--c-ink)" : "var(--c-ghost)", lineHeight: 1.6, margin: j === col.items.length - 1 ? 0 : "0 0 11px" }}>
                        {item}
                      </p>
                    ))}
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" style={{ ...SECTION, padding: "clamp(56px, 9vw, 96px) 24px" }}>
        <Reveal>
          <div style={{ background: "var(--c-ink)", borderRadius: "18px", padding: "clamp(34px, 5.5vw, 56px)", textAlign: "center" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--c-soft)", letterSpacing: "0.6px", textTransform: "uppercase", margin: "0 0 18px" }}>
              One assessment, one price
            </p>
            <p style={{ fontSize: "clamp(52px, 9vw, 82px)", fontWeight: 300, color: "#fff", letterSpacing: "-0.045em", lineHeight: 1, margin: "0 0 14px", fontVariantNumeric: "tabular-nums" }}>
              {PRICE}
            </p>
            <p style={{ fontSize: "16px", color: "#a9b6c9", lineHeight: 1.7, margin: "0 auto 32px", maxWidth: "430px" }}>
              No subscription, no upsell, no call to book. You answer the questions, you get the
              document, it&apos;s yours.
            </p>

            <div style={{ display: "flex", justifyContent: "center", marginBottom: "26px" }}>
              <CTA>Start your assessment</CTA>
            </div>

            <div style={{ display: "inline-flex", alignItems: "flex-start", gap: "9px", maxWidth: "460px", textAlign: "left", borderTop: "1px solid #1e3855", paddingTop: "24px" }}>
              <ShieldCheck size={17} style={{ color: "var(--c-green)", flexShrink: 0, marginTop: "2px" }} />
              <p style={{ fontSize: "14px", color: "#a9b6c9", lineHeight: 1.65, margin: 0 }}>
                <strong style={{ color: "#fff", fontWeight: 600 }}>Find 5 hours a week, or it&apos;s free.</strong>{" "}
                Your report calculates the number from your own answers. If it lands under five, it
                says so on the front page and we refund you in full.
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── FAQ ── */}
      <section style={{ ...SECTION, padding: "0 24px clamp(64px, 10vw, 110px)" }}>
        <Reveal><Eyebrow>Questions</Eyebrow></Reveal>
        <Reveal delay={50}>
          <h2 style={{ fontSize: "clamp(26px, 4.2vw, 42px)", fontWeight: 300, color: "var(--c-ink)", letterSpacing: "-0.028em", lineHeight: 1.14, margin: "0 0 34px" }}>
            Before you start.
          </h2>
        </Reveal>
        <div style={{ borderTop: "1px solid var(--c-powder)" }}>
          {FAQS.map((f, i) => (
            <FAQItem key={f.q} q={f.q} a={f.a} delay={80 + i * 40} />
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid var(--c-powder)", background: "var(--c-porcelain)", padding: "34px 0" }}>
        <div style={{ ...SECTION, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
          <p style={{ fontSize: "13px", color: "var(--c-ghost)", margin: 0 }}>
            © 2026 AssessAI · powered by{" "}
            <a href="https://erasefriction.com" style={{ color: "var(--c-violet)", textDecoration: "none" }}>EraseFriction</a>
          </p>
          <CTA subtle>Start — {PRICE}</CTA>
        </div>
      </footer>
    </div>
  );
}
