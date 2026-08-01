"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Settings, BarChart2, RefreshCw, Users, Bot, Map } from "lucide-react";

/* ── Design tokens (CSS custom properties — swapped by dark mode) ── */
const T = {
  ink:       "var(--c-ink)",
  slate:     "var(--c-slate)",
  ghost:     "var(--c-ghost)",
  white:     "var(--c-white)",
  porcelain: "var(--c-porcelain)",
  powder:    "var(--c-powder)",
  stone:     "var(--c-stone)",
  violet:    "var(--c-violet)",
  washed:    "var(--c-washed)",
  soft:      "var(--c-soft)",
  orange:    "var(--c-orange)",
  green:     "var(--c-green)",
  greenBg:   "var(--c-green-bg)",
  orangeBg:  "var(--c-orange-bg)",
  violetBg:  "var(--c-violet-bg)",
};

/* ── Scroll reveal hook ── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Fallback: always show after 900ms in case observer misses
    const fallback = setTimeout(() => setVisible(true), 900);
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); clearTimeout(fallback); obs.disconnect(); } },
      { threshold: 0, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => { obs.disconnect(); clearTimeout(fallback); };
  }, []);
  return { ref, visible };
}

/* ── Global keyframes injected once ── */
const KEYFRAMES = `
  @keyframes slideUpSheet {
    from { transform: translateY(100%); }
    to   { transform: translateY(0); }
  }
  @keyframes marquee {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
  @keyframes toastIn {
    from { opacity: 0; transform: translateX(120px) scale(0.95); }
    to   { opacity: 1; transform: translateX(0) scale(1); }
  }
  @keyframes toastOut {
    from { opacity: 1; transform: translateX(0) scale(1); }
    to   { opacity: 0; transform: translateX(120px) scale(0.95); }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(28px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0)    scale(1); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes floatGlow {
    0%, 100% { transform: translateY(0px) scale(1);   opacity: 0.55; }
    50%       { transform: translateY(-14px) scale(1.06); opacity: 0.85; }
  }
  @keyframes floatGlow2 {
    0%, 100% { transform: translateY(0px) translateX(0px) scale(1); opacity: 0.4; }
    33%       { transform: translateY(-10px) translateX(8px) scale(1.04); opacity: 0.7; }
    66%       { transform: translateY(6px) translateX(-6px) scale(0.97); opacity: 0.5; }
  }
  @keyframes floatGlow3 {
    0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.3; }
    50%       { transform: translateY(12px) translateX(-10px); opacity: 0.6; }
  }
  @keyframes meshRotate {
    0%   { transform: rotate(0deg) scale(1.1); }
    100% { transform: rotate(360deg) scale(1.1); }
  }
  @keyframes gradientShift {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes gridDrift {
    0%   { transform: translateY(0px); }
    100% { transform: translateY(40px); }
  }
  @keyframes particleDrift {
    0%   { transform: translateY(0px) translateX(0px); opacity: 0; }
    10%  { opacity: 1; }
    90%  { opacity: 1; }
    100% { transform: translateY(-120px) translateX(20px); opacity: 0; }
  }
  @keyframes spinSlow {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes counterPop {
    0%   { transform: scale(0.85); opacity: 0; }
    60%  { transform: scale(1.06); }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes badgePulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(83, 58, 253, 0.3); }
    50%       { box-shadow: 0 0 0 8px rgba(83, 58, 253, 0); }
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

function StyleTag() {
  return <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />;
}

/* ── Animated section wrapper ── */
function Reveal({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(24px) scale(0.98)",
        transition: `opacity 0.55s cubic-bezier(0.23, 1, 0.32, 1) ${delay}ms, transform 0.55s cubic-bezier(0.23, 1, 0.32, 1) ${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ── CTA Button with shimmer ── */
function PrimaryButton({ children, onClick, style }: { children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        background: hovered
          ? "linear-gradient(90deg, #533afd 0%, #8087ff 40%, #533afd 80%, #533afd 100%)"
          : T.violet,
        backgroundSize: hovered ? "200% auto" : "100% auto",
        animation: hovered ? "shimmer 1.4s linear infinite" : "none",
        color: T.white,
        borderRadius: "4px",
        padding: "15px 28px",
        fontSize: "15px",
        fontWeight: 500,
        border: "none",
        cursor: "pointer",
        lineHeight: 1.4,
        letterSpacing: "0.003px",
        transform: pressed ? "scale(0.97)" : hovered ? "scale(1.02)" : "scale(1)",
        transition: "transform 160ms cubic-bezier(0.23, 1, 0.32, 1), box-shadow 200ms ease",
        boxShadow: hovered
          ? `0 6px 24px rgba(83, 58, 253, 0.38), 0 2px 8px rgba(83, 58, 253, 0.2)`
          : `0 2px 8px rgba(83, 58, 253, 0.18)`,
        display: "inline-block",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function OutlineButton({ children, onClick, style }: { children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        background: hovered ? T.powder : "transparent",
        color: T.violet,
        border: `1.5px solid ${hovered ? T.soft : T.washed}`,
        borderRadius: "4px",
        padding: "13.5px 24px",
        fontSize: "14px",
        fontWeight: 400,
        cursor: "pointer",
        lineHeight: 1.4,
        transform: pressed ? "scale(0.97)" : "scale(1)",
        transition: "transform 160ms cubic-bezier(0.23, 1, 0.32, 1), background 180ms ease, border-color 180ms ease",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

/* ── Value card ── */
function ValueCard({ icon, title, body, delay }: { icon: React.ReactNode; title: string; body: string; delay: number }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Reveal delay={delay}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: T.white,
          borderRadius: "8px",
          padding: "28px 24px",
          border: `1px solid ${hovered ? T.washed : T.powder}`,
          boxShadow: hovered
            ? "rgba(83, 58, 253, 0.08) 0px 12px 36px 0px, rgba(0,0,0,0.06) 0px 2px 8px 0px"
            : "rgba(23, 23, 23, 0.06) 0px 3px 6px 0px",
          transform: hovered ? "translateY(-4px) scale(1.01)" : "translateY(0) scale(1)",
          transition: "transform 260ms cubic-bezier(0.23, 1, 0.32, 1), box-shadow 260ms ease, border-color 200ms ease",
          cursor: "default",
        }}
      >
        <div style={{
          width: "40px", height: "40px", borderRadius: "8px",
          background: T.violetBg, display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: "16px", color: T.violet,
        }}>{icon}</div>
        <h3 style={{ fontSize: "16px", fontWeight: 600, color: T.ink, marginBottom: "10px", letterSpacing: "-0.01em" }}>
          {title}
        </h3>
        <p style={{ fontSize: "14px", color: T.slate, lineHeight: 1.65, margin: 0 }}>{body}</p>
      </div>
    </Reveal>
  );
}

/* ── Process step ── */
function ProcessStep({ num, title, body, delay }: { num: string; title: string; body: string; delay: number }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Reveal delay={delay}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: T.porcelain,
          borderRadius: "8px",
          padding: "28px 24px",
          border: `1px solid ${hovered ? T.stone : "transparent"}`,
          boxShadow: hovered
            ? "rgba(0, 0, 0, 0.12) 0px 12px 40px 0px"
            : "rgba(0, 0, 0, 0.07) 0px 4px 16px 0px",
          transform: hovered ? "translateY(-3px)" : "translateY(0)",
          transition: "transform 240ms cubic-bezier(0.23, 1, 0.32, 1), box-shadow 240ms ease, border-color 200ms ease",
        }}
      >
        <div style={{
          width: "36px", height: "36px", borderRadius: "50%",
          background: hovered ? T.violet : T.powder,
          color: hovered ? T.white : T.violet,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "14px", fontWeight: 700, marginBottom: "16px",
          transition: "background 220ms ease, color 220ms ease",
          flexShrink: 0,
        }}>
          {num}
        </div>
        <h3 style={{ fontSize: "15px", fontWeight: 600, color: T.ink, marginBottom: "8px", letterSpacing: "-0.01em" }}>
          {title}
        </h3>
        <p style={{ fontSize: "14px", color: T.slate, lineHeight: 1.65, margin: 0 }}>{body}</p>
      </div>
    </Reveal>
  );
}

/* ── FAQ item ── */
function FAQItem({ q, a, delay }: { q: string; a: string; delay: number }) {
  const [open, setOpen] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (bodyRef.current) setHeight(open ? bodyRef.current.scrollHeight : 0);
  }, [open]);

  return (
    <Reveal delay={delay}>
      <div
        style={{
          borderBottom: `1px solid ${T.powder}`,
          padding: "0",
        }}
      >
        <button
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          style={{
            width: "100%", textAlign: "left", background: "none", border: "none",
            cursor: "pointer", padding: "20px 0",
            display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px",
          }}
        >
          <span style={{ fontSize: "15px", fontWeight: 500, color: T.ink, letterSpacing: "-0.01em" }}>{q}</span>
          <span style={{
            width: "20px", height: "20px", borderRadius: "50%",
            background: open ? T.violet : T.powder,
            color: open ? T.white : T.slate,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "14px", fontWeight: 700, flexShrink: 0,
            transition: "background 220ms ease, color 220ms ease, transform 220ms ease",
            transform: open ? "rotate(45deg)" : "rotate(0deg)",
          }}>
            +
          </span>
        </button>
        <div style={{
          overflow: "hidden",
          height: `${height}px`,
          transition: "height 320ms cubic-bezier(0.23, 1, 0.32, 1)",
        }}>
          <div ref={bodyRef} style={{ paddingBottom: "20px" }}>
            <p style={{ fontSize: "14px", color: T.slate, lineHeight: 1.7, margin: 0 }}>{a}</p>
          </div>
        </div>
      </div>
    </Reveal>
  );
}


/* ── Payment Modal ── */
function PaymentModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<"qualify" | "form" | "success">("qualify");
  const [loading, setLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, company }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");
      window.location.href = data.url;
    } catch (err: unknown) {
      setLoading(false);
      setCheckoutError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  return createPortal(
    <>
      {/* Scrim */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(6,27,49,0.6)" }} />
      {/* Card */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: "fixed", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 9001,
          background: T.white,
          borderRadius: "10px",
          width: "calc(100% - 32px)", maxWidth: "480px",
          maxHeight: "calc(100dvh - 40px)",
          overflowY: "auto",
          boxShadow: "rgba(0,0,0,0.3) 0px 24px 64px -12px",
        }}
      >
        {/* Modal header */}
        <div style={{
          padding: "24px 28px 20px",
          borderBottom: `1px solid ${T.powder}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <div style={{ fontSize: "13px", color: T.ghost, marginBottom: "2px", letterSpacing: "0.3px" }}>
              AI BUSINESS ASSESSMENT
            </div>
            <div style={{ fontSize: "22px", fontWeight: 300, color: T.ink, letterSpacing: "-0.02em" }}>
              {step === "qualify" ? "What's your annual revenue?" : "Complete your order"}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: T.powder, border: "none", borderRadius: "50%",
              width: "44px", height: "44px", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "16px", color: T.slate,
              transition: "background 160ms ease",
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: "24px 28px 28px" }}>
          {step === "qualify" ? (
            <div style={{ padding: "8px 0" }}>
              <p style={{ fontSize: "14px", color: T.slate, marginBottom: "24px", lineHeight: 1.6 }}>
                Help us understand your business so we can give you an accurate savings estimate.
              </p>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: T.ghost, marginBottom: "8px", letterSpacing: "0.3px" }}>ANNUAL REVENUE</label>
                {[
                  "Under $500K",
                  "$500K – $1M",
                  "$1M – $3M",
                  "$3M – $10M",
                  "$10M+",
                ].map(r => (
                  <button key={r} onClick={() => setStep("form")} style={{ display: "block", width: "100%", textAlign: "left", padding: "12px 16px", marginBottom: "8px", background: T.porcelain, border: `1.5px solid ${T.powder}`, borderRadius: "6px", cursor: "pointer", fontSize: "14px", color: T.ink, transition: "border-color 160ms ease, background 160ms ease" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = T.violet; e.currentTarget.style.background = T.violetBg; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.powder; e.currentTarget.style.background = T.porcelain; }}
                  >{r}</button>
                ))}
              </div>
              <p style={{ fontSize: "11px", color: T.ghost, textAlign: "center" }}>All revenue ranges qualify — this helps us tailor your report</p>
            </div>
          ) : step === "success" ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
                <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: T.greenBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M4 12l5 5L20 7" stroke="var(--c-green)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
              <div style={{ fontSize: "20px", fontWeight: 500, color: T.ink, marginBottom: "8px" }}>
                Order confirmed
              </div>
              <p style={{ color: T.slate, fontSize: "14px", lineHeight: 1.6, marginBottom: "24px" }}>
                Check your inbox — your assessment kickoff details are on the way.
              </p>
              <PrimaryButton onClick={onClose}>Close</PrimaryButton>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "20px" }}>
                <div style={{
                  background: T.porcelain, borderRadius: "6px", padding: "14px 16px",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  marginBottom: "16px",
                }}>
                  <span style={{ fontSize: "14px", color: T.ink, fontWeight: 500 }}>AI Business Assessment</span>
                  <span style={{ fontSize: "18px", fontWeight: 300, color: T.violet, letterSpacing: "-0.02em" }}>$997</span>
                </div>
              </div>
              {[
                { label: "Full name",    placeholder: "Alex Johnson",      type: "text",  value: name,    onChange: (v: string) => setName(v) },
                { label: "Work email",   placeholder: "alex@company.com",  type: "email", value: email,   onChange: (v: string) => setEmail(v) },
                { label: "Company name", placeholder: "Acme Corp",         type: "text",  value: company, onChange: (v: string) => setCompany(v) },
              ].map(field => (
                <div key={field.label} style={{ marginBottom: "14px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: T.ghost, marginBottom: "6px", letterSpacing: "0.3px" }}>
                    {field.label.toUpperCase()}
                  </label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={field.value}
                    onChange={e => field.onChange(e.target.value)}
                    required
                    style={{
                      width: "100%", padding: "10px 12px",
                      border: `1.5px solid ${T.stone}`, borderRadius: "4px",
                      fontSize: "14px", color: T.ink, background: T.white,
                      boxSizing: "border-box",
                      transition: "border-color 180ms ease",
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = T.violet)}
                    onBlur={e => (e.currentTarget.style.borderColor = T.stone)}
                  />
                </div>
              ))}
              {checkoutError && (
                <p style={{ fontSize: "12px", color: "#e16540", marginBottom: "12px", lineHeight: 1.5 }}>
                  {checkoutError}
                </p>
              )}
              <div style={{ marginTop: "22px" }}>
                <PrimaryButton style={{ width: "100%", textAlign: "center" as const }}>
                  {loading ? (
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" style={{ animation: "spinSlow 0.8s linear infinite" }}>
                        <circle cx="8" cy="8" r="6" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                        <path d="M8 2 A6 6 0 0 1 14 8" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      Redirecting to Stripe…
                    </span>
                  ) : "Claim my assessment — $997"}
                </PrimaryButton>
              </div>
              <p style={{ fontSize: "12px", color: T.ghost, textAlign: "center", marginTop: "12px", lineHeight: 1.5 }}>
                Secured by Stripe · 30-day money-back guarantee
              </p>
            </form>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}

/* ── Animated counter ── */
function AnimatedCounter({ target, prefix = "", suffix = "", duration = 1400 }: { target: number; prefix?: string; suffix?: string; duration?: number }) {
  const [val, setVal] = useState(0);
  const started = useRef(false);
  const elRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const step = (now: number) => {
          const p = Math.min((now - start) / duration, 1);
          const ease = 1 - Math.pow(1 - p, 3);
          setVal(Math.round(ease * target));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        obs.disconnect();
      }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);

  return <span ref={elRef}>{prefix}{val.toLocaleString()}{suffix}</span>;
}

/* ── Floating particle ── */
function Particle({ x, y, size, delay, dur, opacity }: { x: string; y: string; size: number; delay: number; dur: number; opacity: number }) {
  return (
    <div style={{
      position: "absolute", left: x, top: y, pointerEvents: "none",
      width: size, height: size, borderRadius: "50%",
      background: `rgba(83, 58, 253, ${opacity})`,
      animation: `particleDrift ${dur}s ease-in-out ${delay}s infinite`,
      zIndex: 0,
    }} />
  );
}

/* ── Hero Section ── */
function HeroSection({ heroVisible, onCTA }: { heroVisible: boolean; onCTA: () => void }) {
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const orb1Ref = useRef<HTMLDivElement>(null);
  const orb2Ref = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight };
    };
    window.addEventListener("mousemove", handleMove, { passive: true });

    const animate = () => {
      if (orb1Ref.current) {
        const dx = (mouseRef.current.x - 0.5) * 40;
        const dy = (mouseRef.current.y - 0.5) * 30;
        orb1Ref.current.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      }
      if (orb2Ref.current) {
        const dx = (mouseRef.current.x - 0.5) * -24;
        const dy = (mouseRef.current.y - 0.5) * -18;
        orb2Ref.current.style.transform = `translate(${dx}px, ${dy}px)`;
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const particles = [
    { x: "12%", y: "20%", size: 5, delay: 0,   dur: 7,  opacity: 0.22 },
    { x: "88%", y: "15%", size: 3, delay: 1.2, dur: 9,  opacity: 0.18 },
    { x: "75%", y: "70%", size: 4, delay: 2.5, dur: 8,  opacity: 0.28 },
    { x: "20%", y: "75%", size: 6, delay: 0.8, dur: 11, opacity: 0.16 },
    { x: "55%", y: "85%", size: 3, delay: 3,   dur: 7,  opacity: 0.24 },
    { x: "35%", y: "12%", size: 4, delay: 1.8, dur: 10, opacity: 0.20 },
    { x: "92%", y: "55%", size: 5, delay: 0.4, dur: 8,  opacity: 0.15 },
    { x: "8%",  y: "50%", size: 3, delay: 2.2, dur: 9,  opacity: 0.26 },
  ];

  return (
    <section style={{
      minHeight: "100vh",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      textAlign: "center",
      padding: "80px 24px 60px",
      position: "relative",
      overflow: "hidden",
      background: T.white,
    }}>
      {/* Animated grid backdrop */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `
          linear-gradient(rgba(83, 58, 253, 0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(83, 58, 253, 0.04) 1px, transparent 1px)
        `,
        backgroundSize: "48px 48px",
        animation: "gridDrift 12s ease-in-out infinite alternate",
        maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)",
        WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)",
      }} />

      {/* Primary orb — mouse-tracked */}
      <div ref={orb1Ref} style={{
        position: "absolute",
        top: "50%", left: "50%",
        width: "780px", height: "780px",
        background: "radial-gradient(circle at 40% 40%, rgba(127, 125, 252, 0.55) 0%, rgba(244, 75, 204, 0.28) 38%, rgba(229, 237, 245, 0.4) 65%, transparent 85%)",
        borderRadius: "50%",
        animation: "floatGlow 9s ease-in-out infinite",
        pointerEvents: "none",
        zIndex: 0,
        transition: "transform 1.2s cubic-bezier(0.23, 1, 0.32, 1)",
        willChange: "transform",
      }} />

      {/* Secondary orb — opposite mouse direction */}
      <div ref={orb2Ref} style={{
        position: "absolute",
        top: "22%", right: "10%",
        width: "460px", height: "460px",
        background: "radial-gradient(circle, rgba(128, 135, 255, 0.42) 0%, rgba(83, 58, 253, 0.16) 50%, transparent 75%)",
        borderRadius: "50%",
        animation: "floatGlow2 11s ease-in-out infinite",
        pointerEvents: "none",
        zIndex: 0,
        transition: "transform 1.6s cubic-bezier(0.23, 1, 0.32, 1)",
        willChange: "transform",
      }} />

      {/* Tertiary warm orb */}
      <div style={{
        position: "absolute",
        bottom: "10%", left: "8%",
        width: "320px", height: "320px",
        background: "radial-gradient(circle, rgba(255, 97, 24, 0.16) 0%, transparent 70%)",
        borderRadius: "50%",
        animation: "floatGlow3 13s ease-in-out infinite",
        pointerEvents: "none",
        zIndex: 0,
      }} />

      {/* Particles */}
      {particles.map((p, i) => <Particle key={i} {...p} />)}

      {/* Spinning ring accent */}
      <div style={{
        position: "absolute",
        top: "50%", left: "50%",
        width: "680px", height: "680px",
        transform: "translate(-50%, -50%)",
        border: "1px solid rgba(83, 58, 253, 0.06)",
        borderRadius: "50%",
        animation: "meshRotate 40s linear infinite",
        pointerEvents: "none",
        zIndex: 0,
      }} />
      <div style={{
        position: "absolute",
        top: "50%", left: "50%",
        width: "500px", height: "500px",
        transform: "translate(-50%, -50%)",
        border: "1px solid rgba(83, 58, 253, 0.04)",
        borderRadius: "50%",
        animation: "meshRotate 28s linear infinite reverse",
        pointerEvents: "none",
        zIndex: 0,
      }} />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, maxWidth: "780px", width: "100%" }}>
        {/* Eyebrow badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          background: "rgba(83, 58, 253, 0.07)",
          border: "1px solid rgba(83, 58, 253, 0.16)",
          borderRadius: "100px", padding: "7px 16px",
          marginBottom: "36px",
          opacity: heroVisible ? 1 : 0,
          transform: heroVisible ? "translateY(0) scale(1)" : "translateY(14px) scale(0.95)",
          transition: "opacity 0.55s cubic-bezier(0.23, 1, 0.32, 1) 0ms, transform 0.55s cubic-bezier(0.23, 1, 0.32, 1) 0ms",
          animation: heroVisible ? "badgePulse 3s ease-in-out 1.2s infinite" : "none",
        }}>
          <span style={{
            width: "6px", height: "6px", borderRadius: "50%",
            background: T.violet, display: "inline-block", flexShrink: 0,
            boxShadow: `0 0 6px ${T.violet}`,
          }} />
          <span style={{ fontSize: "12px", fontWeight: 600, color: T.violet, letterSpacing: "0.4px" }}>
            AI-POWERED BUSINESS ASSESSMENT
          </span>
        </div>

        {/* Headline — line by line stagger */}
        <h1 style={{
          fontSize: "clamp(44px, 6.5vw, 78px)",
          fontWeight: 300,
          lineHeight: 1.06,
          letterSpacing: "-0.038em",
          color: T.ink,
          margin: "0 0 28px",
        }}>
          <span style={{
            display: "block",
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? "translateY(0)" : "translateY(22px)",
            transition: "opacity 0.65s cubic-bezier(0.23, 1, 0.32, 1) 80ms, transform 0.65s cubic-bezier(0.23, 1, 0.32, 1) 80ms",
          }}>
            Your business
          </span>
          <span style={{
            display: "block",
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? "translateY(0)" : "translateY(22px)",
            transition: "opacity 0.65s cubic-bezier(0.23, 1, 0.32, 1) 160ms, transform 0.65s cubic-bezier(0.23, 1, 0.32, 1) 160ms",
          }}>
            has a leak. We&apos;ll find it
          </span>
          <span style={{
            display: "block",
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? "translateY(0)" : "translateY(22px)",
            transition: "opacity 0.65s cubic-bezier(0.23, 1, 0.32, 1) 240ms, transform 0.65s cubic-bezier(0.23, 1, 0.32, 1) 240ms",
          }}>
            in{" "}<span style={{
              background: `linear-gradient(120deg, ${T.violet} 20%, #a78bfa 60%, ${T.soft} 100%)`,
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: heroVisible ? "shimmer 4s linear infinite" : "none",
            }}>5 days.</span>
          </span>
        </h1>

        {/* Sub */}
        <p style={{
          fontSize: "19px", fontWeight: 400, color: T.slate, lineHeight: 1.65,
          maxWidth: "520px", margin: "0 auto 44px",
          opacity: heroVisible ? 1 : 0,
          transform: heroVisible ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 0.65s cubic-bezier(0.23, 1, 0.32, 1) 320ms, transform 0.65s cubic-bezier(0.23, 1, 0.32, 1) 320ms",
        }}>
          Businesses doing $500K–$10M bleed $8,000–$20,000 a year through duplicate tools, underpriced services, and manual work that should be automated. We audit everything and hand you a clear fix-it plan — guaranteed.
        </p>

        {/* Urgency badge */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px", opacity: heroVisible ? 1 : 0, transition: "opacity 0.65s cubic-bezier(0.23, 1, 0.32, 1) 360ms" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: T.orangeBg, border: `1px solid ${T.orange}`, borderRadius: "20px", padding: "5px 14px" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: T.orange }} />
            <span style={{ fontSize: "12px", fontWeight: 500, color: T.orange }}>3 spots remaining this week</span>
          </div>
        </div>

        {/* CTAs */}
        <div className="hero-ctas" style={{
          display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center",
          opacity: heroVisible ? 1 : 0,
          transform: heroVisible ? "translateY(0)" : "translateY(14px)",
          transition: "opacity 0.65s cubic-bezier(0.23, 1, 0.32, 1) 400ms, transform 0.65s cubic-bezier(0.23, 1, 0.32, 1) 400ms",
        }}>
          <PrimaryButton onClick={onCTA}>
            Find my hidden savings →
          </PrimaryButton>
          <button onClick={() => document.getElementById("process")?.scrollIntoView({ behavior: "smooth" })} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "15px", color: T.slate, padding: "10px 16px", transition: "color 160ms ease" }} onMouseEnter={e => (e.currentTarget.style.color = T.ink)} onMouseLeave={e => (e.currentTarget.style.color = T.slate)}>
            See how it works ↓
          </button>
        </div>

        {/* Animated metrics row */}
        <div className="hero-metrics" style={{
          marginTop: "60px",
          display: "flex", gap: "0", justifyContent: "center", flexWrap: "wrap",
          opacity: heroVisible ? 1 : 0,
          transition: "opacity 0.7s cubic-bezier(0.23, 1, 0.32, 1) 520ms",
        }}>
          {[
            { value: 214, prefix: "", suffix: "+", label: "Audits delivered", delay: 600 },
            { value: 10400, prefix: "$", suffix: "", label: "Average savings found", delay: 750 },
            { value: 97, prefix: "", suffix: "%", label: "Satisfaction rate", delay: 900 },
          ].map((m, i, arr) => (
            <div key={m.label} style={{
              textAlign: "center",
              padding: "0 32px",
              borderRight: i < arr.length - 1 ? `1px solid ${T.powder}` : "none",
            }}>
              <div style={{
                fontSize: "38px", fontWeight: 300, color: T.violet,
                letterSpacing: "-0.04em", lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
                animation: heroVisible ? `counterPop 0.5s cubic-bezier(0.23, 1, 0.32, 1) ${m.delay}ms both` : "none",
              }}>
                <AnimatedCounter target={m.value} prefix={m.prefix} suffix={m.suffix} duration={1200} />
              </div>
              <div style={{ fontSize: "13px", color: T.ghost, marginTop: "6px", letterSpacing: "0.01em" }}>
                {m.label}
              </div>
            </div>
          ))}
        </div>

        {/* Trust line */}
        <div style={{
          marginTop: "36px",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "18px",
          opacity: heroVisible ? 1 : 0,
          transition: "opacity 0.7s cubic-bezier(0.23, 1, 0.32, 1) 680ms",
          flexWrap: "wrap",
        }}>
          {["30-day money-back guarantee", "Read-only access only", "Secured by Stripe"].map(t => (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6.5L4.5 9L10 3.5" stroke="#81b81a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ fontSize: "13px", color: T.slate }}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div style={{
        position: "absolute", bottom: "32px", left: "50%", transform: "translateX(-50%)",
        opacity: heroVisible ? 0.5 : 0,
        transition: "opacity 0.7s cubic-bezier(0.23, 1, 0.32, 1) 800ms",
        animation: heroVisible ? "floatGlow 2.5s ease-in-out infinite" : "none",
        zIndex: 1,
      }}>
        <svg width="20" height="30" viewBox="0 0 20 30" fill="none">
          <rect x="1" y="1" width="18" height="28" rx="9" stroke={T.stone} strokeWidth="1.5" />
          <rect x="8.5" y="6" width="3" height="6" rx="1.5" fill={T.stone} />
        </svg>
      </div>
    </section>
  );
}

/* ── Logo ticker ── */
const TICKER_ITEMS = [
  { name: "Acme Inc",         saving: "$14,200" },
  { name: "Tech Startup Co",  saving: "$9,800" },
  { name: "FinTech Labs",      saving: "$22,100" },
  { name: "GrowthHQ",          saving: "$7,650" },
  { name: "Design Studios",   saving: "$11,400" },
  { name: "Marketing Agency", saving: "$8,900" },
  { name: "Consulting Group", saving: "$13,300" },
  { name: "Scale Commerce",   saving: "$18,700" },
];

function LogoTicker() {
  // Duplicate for seamless loop
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <section aria-hidden="true" style={{ background: T.porcelain, borderTop: `1px solid ${T.powder}`, borderBottom: `1px solid ${T.powder}`, padding: "20px 0", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0" }}>
        <div style={{
          display: "flex", gap: "0",
          animation: "marquee 28s linear infinite",
          willChange: "transform",
          flexShrink: 0,
        }}>
          {items.map((item, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "0 40px",
              borderRight: `1px solid ${T.powder}`,
              flexShrink: 0,
            }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: T.green, flexShrink: 0 }} />
              <span style={{ fontSize: "13px", fontWeight: 500, color: T.slate, whiteSpace: "nowrap" }}>{item.name}</span>
              <span style={{
                fontSize: "12px", fontWeight: 600, color: T.violet,
                background: "rgba(83,58,253,0.07)", borderRadius: "4px", padding: "1px 7px",
                whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums",
              }}>{item.saving} found</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── ROI Calculator ── */
function ROICalculator({ onCTA }: { onCTA: () => void }) {
  const [spend, setSpend] = useState(8000);
  const [headcount, setHeadcount] = useState(12);
  const [animating, setAnimating] = useState(false);
  const prevResult = useRef(0);

  const toolWaste    = Math.round(spend * 0.22);
  const processWaste = Math.round(headcount * 180);
  const revenueLeaks = Math.round(spend * 0.08);
  const total        = toolWaste + processWaste + revenueLeaks;

  useEffect(() => {
    if (total !== prevResult.current) {
      setAnimating(true);
      const t = setTimeout(() => setAnimating(false), 300);
      prevResult.current = total;
      return () => clearTimeout(t);
    }
  }, [total]);

  const roi = ((total - 997) / 997 * 100).toFixed(0);

  return (
    <section className="section-pad section-vpad" style={{ background: T.ink, padding: "96px 40px", position: "relative", overflow: "hidden" }}>
      {/* Background glow */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "600px", height: "600px",
        background: "radial-gradient(circle, rgba(83,58,253,0.2) 0%, transparent 70%)",
        borderRadius: "50%", pointerEvents: "none",
      }} />

      <div style={{ maxWidth: "900px", margin: "0 auto", position: "relative" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <p style={{ fontSize: "12px", fontWeight: 700, color: T.washed, letterSpacing: "0.8px", marginBottom: "12px" }}>
              ROI CALCULATOR
            </p>
            <h2 style={{ fontSize: "clamp(30px, 4vw, 44px)", fontWeight: 300, color: T.white, letterSpacing: "-0.025em", margin: "0 auto 16px" }}>
              See what you&apos;re leaving on the table
            </h2>
            <p style={{ fontSize: "16px", color: T.washed, lineHeight: 1.65, maxWidth: "440px", margin: "0 auto" }}>
              Adjust the sliders to your business. We&apos;ll show you what we typically find.
            </p>
          </div>
        </Reveal>

        <div className="grid-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", alignItems: "start" }}>
          {/* Sliders */}
          <Reveal delay={0}>
            <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
              {/* Monthly software spend */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                  <label style={{ fontSize: "13px", color: T.washed, fontWeight: 500 }}>Monthly software spend</label>
                  <span style={{ fontSize: "16px", fontWeight: 300, color: T.white, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
                    ${spend.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range" min={1000} max={50000} step={500}
                  value={spend} onChange={e => setSpend(Number(e.target.value))}
                  style={{ width: "100%", accentColor: T.violet, cursor: "pointer", height: "4px" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
                  <span style={{ fontSize: "11px", color: T.ghost }}>$1k</span>
                  <span style={{ fontSize: "11px", color: T.ghost }}>$50k</span>
                </div>
              </div>

              {/* Team size */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                  <label style={{ fontSize: "13px", color: T.washed, fontWeight: 500 }}>Team size</label>
                  <span style={{ fontSize: "16px", fontWeight: 300, color: T.white, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
                    {headcount} people
                  </span>
                </div>
                <input
                  type="range" min={2} max={100} step={1}
                  value={headcount} onChange={e => setHeadcount(Number(e.target.value))}
                  style={{ width: "100%", accentColor: T.violet, cursor: "pointer", height: "4px" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
                  <span style={{ fontSize: "11px", color: T.ghost }}>2</span>
                  <span style={{ fontSize: "11px", color: T.ghost }}>100</span>
                </div>
              </div>

              {/* Breakdown */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  { label: "Tool redundancy (est. 22%)", value: toolWaste, color: T.washed },
                  { label: "Process inefficiency savings", value: processWaste, color: T.washed },
                  { label: "Revenue leak recovery (est. 8%)", value: revenueLeaks, color: T.washed },
                ].map(row => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <span style={{ fontSize: "13px", color: T.ghost }}>{row.label}</span>
                    <span style={{ fontSize: "14px", fontWeight: 500, color: row.color, fontVariantNumeric: "tabular-nums" }}>
                      ${row.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Result card */}
          <Reveal delay={80}>
            <div className="roi-result-card" style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: "12px", padding: "36px",
              textAlign: "center",
              backdropFilter: "blur(8px)",
              position: "sticky", top: "80px",
            }}>
              <p style={{ fontSize: "12px", fontWeight: 600, color: T.washed, letterSpacing: "0.6px", marginBottom: "12px" }}>
                ESTIMATED ANNUAL SAVINGS
              </p>
              <div style={{
                fontSize: "clamp(48px, 6vw, 72px)", fontWeight: 300,
                color: T.white, letterSpacing: "-0.04em", lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
                opacity: animating ? 0.5 : 1,
                transform: animating ? "scale(0.96)" : "scale(1)",
                transition: "opacity 200ms ease, transform 200ms cubic-bezier(0.23,1,0.32,1)",
                marginBottom: "8px",
              }}>
                ${total.toLocaleString()}
              </div>
              <p style={{ fontSize: "14px", color: T.ghost, marginBottom: "28px" }}>
                per year, on average
              </p>

              <div style={{
                display: "flex", justifyContent: "center", gap: "24px",
                marginBottom: "28px", paddingBottom: "24px",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
              }}>
                <div>
                  <div style={{ fontSize: "22px", fontWeight: 300, color: T.soft, letterSpacing: "-0.02em" }}>{roi}×</div>
                  <div style={{ fontSize: "11px", color: T.ghost, marginTop: "3px" }}>ROI on $997</div>
                </div>
                <div>
                  <div style={{ fontSize: "22px", fontWeight: 300, color: T.soft, letterSpacing: "-0.02em" }}>5 days</div>
                  <div style={{ fontSize: "11px", color: T.ghost, marginTop: "3px" }}>to delivery</div>
                </div>
              </div>

              <PrimaryButton onClick={onCTA} style={{ width: "100%", textAlign: "center" as const }}>
                Claim my assessment — $997
              </PrimaryButton>
              <p style={{ fontSize: "12px", color: T.ghost, marginTop: "12px" }}>
                30-day money-back guarantee
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ── Sample Report Preview ── */
const REPORT_ITEMS = [
  { severity: "critical", category: "Software audit", title: "Redundant project management tools", saving: "$4,800/yr", revealed: true },
  { severity: "critical", category: "Revenue",        title: "Pricing gap vs. market benchmark",   saving: "$6,200/yr", revealed: true },
  { severity: "warning",  category: "Process",        title: "Manual invoice reconciliation",       saving: "$3,100/yr", revealed: false },
  { severity: "warning",  category: "AI readiness",   title: "Customer support automation gap",     saving: "$2,400/yr", revealed: false },
  { severity: "info",     category: "Team",           title: "Role duplication in operations",      saving: "$1,700/yr", revealed: false },
];

const SEV_STYLE: Record<string, { bg: string; color: string; dot: string }> = {
  critical: { bg: "#ffd7f0", color: "#111", dot: "#e16540" },
  warning:  { bg: "#fef3c7", color: "#111", dot: "#d97706" },
  info:     { bg: "#e5edf5", color: "#111", dot: "#50617a" },
};

function SampleReport({ onCTA }: { onCTA: () => void }) {
  const [unlocked, setUnlocked] = useState(false);
  const { ref, visible } = useReveal();

  return (
    <section className="section-pad section-vpad" style={{ background: T.porcelain, padding: "96px 40px" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <p style={{ fontSize: "12px", fontWeight: 700, color: T.violet, letterSpacing: "0.8px", marginBottom: "12px" }}>
              SAMPLE DELIVERABLE
            </p>
            <h2 style={{ fontSize: "clamp(30px, 4vw, 44px)", fontWeight: 300, color: T.ink, letterSpacing: "-0.025em", margin: "0 auto 16px" }}>
              This is what you receive
            </h2>
            <p style={{ fontSize: "16px", color: T.slate, lineHeight: 1.65, maxWidth: "440px", margin: "0 auto" }}>
              Every finding is ranked by dollar impact, with before/after code or process examples.
            </p>
          </div>
        </Reveal>

        <div
          ref={ref}
          style={{
            background: T.white, borderRadius: "12px",
            border: `1px solid ${T.powder}`,
            boxShadow: "rgba(0,0,0,0.1) 0px 20px 60px -12px",
            overflow: "hidden",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.98)",
            transition: "opacity 0.6s cubic-bezier(0.23,1,0.32,1), transform 0.6s cubic-bezier(0.23,1,0.32,1)",
          }}
        >
          {/* Report header */}
          <div style={{ background: T.ink, padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "7px", background: T.violet, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2L12 11H2L7 2Z" fill="white" fillOpacity="0.9" /></svg>
              </div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: T.white }}>AI Business Assessment Report</div>
                <div style={{ fontSize: "11px", color: T.ghost }}>Acme Inc · April 15, 2024 · Confidential</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "16px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "18px", fontWeight: 300, color: T.white, fontVariantNumeric: "tabular-nums" }}>$14,200</div>
                <div style={{ fontSize: "10px", color: T.ghost }}>Total savings</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "18px", fontWeight: 300, color: T.white }}>6</div>
                <div style={{ fontSize: "10px", color: T.ghost }}>Findings</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "18px", fontWeight: 300, color: T.white }}>90</div>
                <div style={{ fontSize: "10px", color: T.ghost }}>Day roadmap</div>
              </div>
            </div>
          </div>

          {/* Findings list */}
          <div style={{ padding: "8px 0" }}>
            {REPORT_ITEMS.map((item, i) => {
              const sev = SEV_STYLE[item.severity];
              const blur = !item.revealed && !unlocked;
              return (
                <div key={i} style={{
                  padding: "16px 28px",
                  borderBottom: i < REPORT_ITEMS.length - 1 ? `1px solid ${T.powder}` : "none",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  gap: "16px", flexWrap: "wrap",
                  filter: blur ? "blur(5px)" : "none",
                  userSelect: blur ? "none" : "auto",
                  transition: "filter 400ms ease",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                    <span style={{
                      padding: "3px 10px", borderRadius: "100px",
                      background: sev.bg, color: sev.color,
                      fontSize: "11px", fontWeight: 600, letterSpacing: "0.2px",
                      display: "flex", alignItems: "center", gap: "5px",
                      whiteSpace: "nowrap", flexShrink: 0,
                    }}>
                      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: sev.dot }} />
                      {item.severity.toUpperCase()}
                    </span>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 500, color: T.ink }}>{item.title}</div>
                      <div style={{ fontSize: "12px", color: T.ghost, marginTop: "2px" }}>{item.category}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: "16px", fontWeight: 500, color: "#3a6b05", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                    {item.saving}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Unlock overlay */}
          {!unlocked && (
            <div style={{
              padding: "28px", textAlign: "center",
              background: "linear-gradient(to top, rgba(255,255,255,1) 0%, rgba(255,255,255,0.96) 60%, rgba(255,255,255,0) 100%)",
              marginTop: "-60px", position: "relative",
            }}>
              <p style={{ fontSize: "14px", color: T.slate, marginBottom: "14px" }}>
                3 findings blurred — get your own report to see every detail
              </p>
              <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
                <PrimaryButton onClick={onCTA}>Get my assessment — $997</PrimaryButton>
                <OutlineButton onClick={() => setUnlocked(true)}>Preview full sample</OutlineButton>
              </div>
            </div>
          )}

          {unlocked && (
            <div style={{ padding: "20px 28px", borderTop: `1px solid ${T.powder}`, display: "flex", justifyContent: "center" }}>
              <p style={{ fontSize: "13px", color: T.ghost, margin: 0 }}>
                This is a sample — your actual report will reflect your specific business.{" "}
                <button onClick={onCTA} style={{ background: "none", border: "none", cursor: "pointer", color: T.violet, fontSize: "13px", fontWeight: 500, padding: 0 }}>
                  Get started →
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}


/* ── Mobile nav ── */
function MobileNav({ open, onClose, onCTA }: { open: boolean; onClose: () => void; onCTA: () => void }) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const links = [
    { label: "How it works", id: "process" },
    { label: "Pricing",      id: "pricing" },
    { label: "FAQ",          id: "faq" },
  ];

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 9999,
      background: "rgba(255,255,255,0.85)",
      backdropFilter: open ? "blur(28px) saturate(180%)" : "none",
      WebkitBackdropFilter: open ? "blur(28px) saturate(180%)" : "none",
      display: "flex", flexDirection: "column",
      transform: open ? "translateX(0)" : "translateX(100%)",
      transition: "transform 300ms cubic-bezier(0.32, 0.72, 0, 1)",
      visibility: open ? "visible" : "hidden",
      borderLeft: "1px solid rgba(255,255,255,0.5)",
    }}>

      {/* Top bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "18px 24px",
        borderBottom: "1px solid rgba(229,237,245,0.6)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "26px", height: "26px", borderRadius: "6px", background: "#533afd", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="11" height="11" viewBox="0 0 14 14" fill="none"><path d="M7 2L12 11H2L7 2Z" fill="white" fillOpacity="0.9" /></svg>
          </div>
          <span style={{ fontSize: "15px", fontWeight: 400, color: "#061b31", letterSpacing: "-0.01em" }}>AuditAI</span>
        </div>
        <button
          onClick={onClose}
          aria-label="Close menu"
          style={{
            width: "44px", height: "44px",
            background: "rgba(255,255,255,0.5)", border: "1px solid rgba(216,214,223,0.5)",
            borderRadius: "4px", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 150ms ease",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(229,237,245,0.8)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.5)")}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 1l10 10M11 1L1 11" stroke="#061b31" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Nav links */}
      <div style={{ flex: 1, padding: "8px 16px" }}>
        {links.map(({ label, id }, i) => (
          <button
            key={label}
            onClick={() => { onClose(); setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 320); }}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              width: "100%", padding: "16px 8px",
              background: "transparent",
              border: "none",
              borderBottom: i < links.length - 1 ? "1px solid rgba(229,237,245,0.6)" : "none",
              cursor: "pointer", textAlign: "left",
              fontSize: "18px", fontWeight: 400, color: "#061b31",
              letterSpacing: "-0.009px",
              transition: "color 150ms ease",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "#533afd")}
            onMouseLeave={e => (e.currentTarget.style.color = "#061b31")}
          >
            {label}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 3l5 5-5 5" stroke="#d8d6df" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        ))}
      </div>

      {/* Divider */}
      <div style={{ height: "1px", background: "rgba(229,237,245,0.6)", margin: "0 24px" }} />

      {/* CTA block */}
      <div style={{ padding: "24px", background: "rgba(248,250,253,0.6)", margin: "0 16px 16px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.7)" }}>
        {/* Price line */}
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "12px" }}>
          <span style={{ fontSize: "32px", fontWeight: 300, color: "#061b31", letterSpacing: "-0.02px", lineHeight: 1 }}>$997</span>
          <span style={{ fontSize: "14px", color: "#64748d", fontWeight: 400 }}>one-time</span>
        </div>

        {/* Primary button */}
        <button
          onClick={() => { onClose(); setTimeout(onCTA, 320); }}
          style={{
            display: "block", width: "100%", padding: "15.5px 24px",
            background: "#533afd", color: "#ffffff",
            border: "none", borderRadius: "4px", cursor: "pointer",
            fontSize: "16px", fontWeight: 400,
            transition: "opacity 160ms ease, transform 160ms ease",
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          onMouseDown={e => (e.currentTarget.style.transform = "scale(0.98)")}
          onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
        >
          Get my assessment
        </button>

        {/* Trust line */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", marginTop: "12px" }}>
          {["30-day guarantee", "5-day delivery"].map(t => (
            <span key={t} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#64748d", letterSpacing: "0.03px" }}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6.5L4.5 9L10 3.5" stroke="var(--c-green)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {t}
            </span>
          ))}
        </div>
      </div>

    </div>
  );
}

/* ── Sticky bottom CTA ── */
function StickyCTA({ visible, onCTA }: { visible: boolean; onCTA: () => void }) {
  return (
    <div className="sticky-cta" style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40,
      padding: "12px 24px",
      background: T.white,
      borderTop: `1px solid ${T.powder}`,
      boxShadow: "0 -4px 24px rgba(0,0,0,0.08)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: "16px", flexWrap: "wrap",
      transform: visible ? "translateY(0)" : "translateY(100%)",
      transition: "transform 320ms cubic-bezier(0.23,1,0.32,1)",
    }}>
      <div>
        <div style={{ fontSize: "14px", fontWeight: 600, color: T.ink }}>AI Business Assessment</div>
        <div style={{ fontSize: "12px", color: T.ghost }}>30-day guarantee · Delivered in 5 days</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ fontSize: "20px", fontWeight: 300, color: T.violet, letterSpacing: "-0.02em" }}>$997</span>
        <PrimaryButton onClick={onCTA} style={{ padding: "10px 20px", fontSize: "13px" }}>
          Get started
        </PrimaryButton>
      </div>
    </div>
  );
}

/* ── Exit intent overlay ── */
function ExitIntent({ onCTA, onDismiss }: { onCTA: () => void; onDismiss: () => void }) {
  return (
    <div
      onClick={onDismiss}
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(6,27,49,0.6)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
        animation: "fadeUp 0.3s cubic-bezier(0.23,1,0.32,1)",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: T.white, borderRadius: "14px", padding: "44px 40px",
          maxWidth: "520px", width: "100%",
          boxShadow: "rgba(0,0,0,0.25) 0px 24px 64px -12px",
          textAlign: "center",
          animation: "fadeUp 0.35s cubic-bezier(0.23,1,0.32,1)",
          position: "relative",
        }}
      >
        <button onClick={onDismiss} aria-label="Close" style={{
          position: "absolute", top: "8px", right: "8px",
          background: T.porcelain, border: "none", borderRadius: "50%",
          width: "44px", height: "44px", cursor: "pointer",
          fontSize: "16px", color: T.ghost, display: "flex", alignItems: "center", justifyContent: "center",
        }}>×</button>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
          <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: T.violetBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M1 11s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" stroke="var(--c-violet)" strokeWidth="1.8" strokeLinejoin="round"/>
              <circle cx="11" cy="11" r="3" stroke="var(--c-violet)" strokeWidth="1.8"/>
            </svg>
          </div>
        </div>
        <h2 style={{ fontSize: "24px", fontWeight: 300, color: T.ink, letterSpacing: "-0.025em", marginBottom: "12px" }}>
          Before you go…
        </h2>
        <p style={{ fontSize: "15px", color: T.slate, lineHeight: 1.65, marginBottom: "8px" }}>
          Businesses like yours are leaving an average of{" "}
          <strong style={{ color: T.violet }}>$10,400/year</strong> on the table.
        </p>
        <p style={{ fontSize: "14px", color: T.ghost, marginBottom: "28px" }}>
          See what we&apos;d find in your business — backed by a 30-day guarantee.
        </p>
        <PrimaryButton onClick={() => { onDismiss(); onCTA(); }} style={{ width: "100%", textAlign: "center" as const }}>
          Get my assessment — $997
        </PrimaryButton>
        <button onClick={onDismiss} style={{
          display: "block", width: "100%", marginTop: "12px",
          background: "none", border: "none", cursor: "pointer",
          fontSize: "13px", color: T.ghost,
        }}>
          No thanks, I&apos;ll leave money on the table
        </button>
      </div>
    </div>
  );
}

/* ── Video testimonial ── */
function VideoTestimonial() {
  const [playing, setPlaying] = useState(false);
  const { ref } = useReveal();
  return (
    <section className="section-pad section-vpad" style={{ background: T.porcelain, padding: "80px 40px" }}>
      <div style={{ maxWidth: "760px", margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <p style={{ fontSize: "12px", fontWeight: 700, color: T.violet, letterSpacing: "0.8px", marginBottom: "10px" }}>CLIENT STORY</p>
            <h2 style={{ fontSize: "clamp(26px, 3.5vw, 38px)", fontWeight: 300, color: T.ink, letterSpacing: "-0.025em", margin: 0 }}>
              &quot;We recovered $14,200 in the first month&quot;
            </h2>
          </div>
        </Reveal>

        <div
          ref={ref}
          onClick={() => setPlaying(true)}
          onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setPlaying(true); } }}
          role="button"
          tabIndex={0}
          style={{
            position: "relative",
            aspectRatio: "16 / 9",
            borderRadius: "14px",
            overflow: "hidden",
            background: T.ink,
            boxShadow: "0 20px 48px -12px rgba(0,0,0,0.25)",
            cursor: "pointer",
          }}
        >
          {playing ? (
            <iframe
              src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
              title="Client video testimonial"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ width: "100%", height: "100%", border: "none" }}
            />
          ) : (
            <>
              {/* Thumbnail backdrop */}
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(135deg, rgba(83,58,253,0.3) 0%, rgba(15,17,23,0.85) 100%)",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              }}>
                <div style={{
                  width: "68px", height: "68px", borderRadius: "50%",
                  background: T.violet,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 8px 24px rgba(83,58,253,0.4)",
                  transition: "transform 200ms ease",
                }}>
                  <svg width="20" height="22" viewBox="0 0 20 22" fill="none" style={{ marginLeft: "4px" }}>
                    <path d="M1 2v18l17-9L1 2z" fill="#fff" />
                  </svg>
                </div>
                <span style={{ marginTop: "16px", fontSize: "13px", fontWeight: 500, color: T.white, letterSpacing: "0.02em" }}>
                  Watch Sarah&apos;s story (1:42)
                </span>
              </div>
            </>
          )}
        </div>

        {/* Quote */}
        <Reveal delay={80}>
          <div style={{ display: "flex", gap: "16px", marginTop: "28px", padding: "0 8px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "linear-gradient(135deg, #533afd, #8087ff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>S</div>
            <div>
              <p style={{ fontSize: "15px", color: T.ink, lineHeight: 1.7, margin: "0 0 6px", fontStyle: "italic" }}>
                &quot;The findings call alone changed how I think about the whole business. They found $14,200 in software waste I didn&apos;t even know I was paying for.&quot;
              </p>
              <p style={{ fontSize: "13px", color: T.ghost, margin: 0 }}>Sarah Kim, CEO · Acme Inc</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Guarantee section ── */
function GuaranteeSection() {
  return (
    <section className="section-pad section-vpad" style={{ background: T.porcelain, padding: "80px 40px" }}>
      <div style={{ maxWidth: "820px", margin: "0 auto" }}>
        <Reveal>
          <div className="grid-guarantee guarantee-card" style={{
            background: T.white, borderRadius: "14px",
            padding: "48px 52px",
            border: `1px solid ${T.powder}`,
            display: "grid", gridTemplateColumns: "auto 1fr", gap: "40px", alignItems: "center",
          }}>
            {/* Shield icon */}
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: "80px", height: "80px", borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(83,58,253,0.1), rgba(128,135,255,0.1))",
                border: `2px solid rgba(83,58,253,0.2)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 12px",
              }}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path d="M16 3L4 8v9c0 6.627 5.15 12.835 12 14 6.85-1.165 12-7.373 12-14V8L16 3z" stroke="var(--c-violet)" strokeWidth="1.8" strokeLinejoin="round"/>
                  <path d="M10 16l4 4 8-8" stroke="var(--c-violet)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: T.violet, letterSpacing: "0.5px" }}>GUARANTEED</div>
            </div>

            <div>
              <h2 style={{ fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 300, color: T.ink, letterSpacing: "-0.025em", margin: "0 0 12px" }}>
                If you don&apos;t save more than you spent, we&apos;ll refund every dollar.
              </h2>
              <p style={{ fontSize: "15px", color: T.slate, lineHeight: 1.7, margin: "0 0 20px" }}>
                We&apos;ve done 214 audits. Fewer than 3% of clients have ever asked for a refund. But the guarantee is there because we stand behind the work — not because we need it as a sales tactic. If you don&apos;t identify at least <strong style={{ color: T.ink }}>$997 in actionable savings</strong>, just reply to your delivery email.
              </p>
              <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                {["No questions asked", "Instant refund", "Applies for 30 days"].map(item => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <path d="M2 6.5l3 3 6-6" stroke="var(--c-green)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span style={{ fontSize: "13px", color: T.slate }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════ */
const SCHEMA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://auditai.co/#org",
      name: "AuditAI",
      url: "https://auditai.co",
      description: "AI-powered business assessment delivering $10,000+ in identified savings in 5 days.",
    },
    {
      "@type": "Product",
      "@id": "https://auditai.co/#product",
      name: "AI Business Assessment",
      description: "A senior consultant audits your entire business — tools, pricing, processes, and team — and delivers a prioritized roadmap in 5 business days.",
      brand: { "@type": "Brand", name: "AuditAI" },
      offers: {
        "@type": "Offer",
        price: "997",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        seller: { "@id": "https://auditai.co/#org" },
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        reviewCount: "214",
        bestRating: "5",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What if I don't find $997 in savings?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "We'll refund you in full — no questions asked. If you don't identify at least $997 in actionable savings within 30 days of delivery, we return every dollar. This has happened in fewer than 3% of audits.",
          },
        },
        {
          "@type": "Question",
          name: "What access do you need?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Read-only access to your accounting software, project management tool, and a list of your active subscriptions. We never need write access or passwords.",
          },
        },
        {
          "@type": "Question",
          name: "Who actually does the work?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "A senior consultant with 8+ years of operational experience. AI tools assist with data processing — a human makes every recommendation.",
          },
        },
        {
          "@type": "Question",
          name: "How long does the assessment take?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "We deliver your full report within 5 business days of receiving your intake form and tool access. The process requires about 30 minutes of your time upfront and one 60-minute call.",
          },
        },
      ],
    },
  ],
};

export default function LandingPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showStickyCTA, setShowStickyCTA] = useState(false);
  const [exitIntent, setExitIntent] = useState(false);
  const exitShown = useRef(false);

  // Landing page is always light
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  useEffect(() => {
    setTimeout(() => setHeroVisible(true), 80);
    const onScroll = () => {
      setScrolled(window.scrollY > 48);
      setShowStickyCTA(window.scrollY > window.innerHeight * 0.7);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = modalOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [modalOpen]);

  // Exit intent — fire once when cursor leaves toward top of viewport.
  // Armed only after a few seconds so a page load/reload with the cursor
  // already parked near the top (address bar, devtools) can't trigger it instantly.
  useEffect(() => {
    let armed = false;
    const armTimer = setTimeout(() => { armed = true; }, 4000);

    const handler = (e: MouseEvent) => {
      if (armed && e.clientY < 20 && !exitShown.current && !modalOpen) {
        exitShown.current = true;
        setExitIntent(true);
      }
    };
    document.addEventListener("mouseleave", handler);
    return () => {
      clearTimeout(armTimer);
      document.removeEventListener("mouseleave", handler);
    };
  }, [modalOpen]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA) }}
      />
      <StyleTag />

      {/* ── Nav ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        padding: "0 32px",
        height: "60px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: scrolled ? "color-mix(in srgb, var(--c-white) 92%, transparent)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? `1px solid ${T.powder}` : "1px solid transparent",
        transition: "background 280ms ease, border-color 280ms ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: T.violet, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2L12 11H2L7 2Z" fill="white" fillOpacity="0.9" />
            </svg>
          </div>
          <span style={{ fontSize: "15px", fontWeight: 600, color: T.ink, letterSpacing: "-0.01em" }}>AuditAI</span>
        </div>

        {/* Desktop nav links */}
        <div className="nav-desktop-links" style={{ display: "flex", alignItems: "center", gap: "28px", position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
          {["How it works", "Pricing", "FAQ"].map(l => (
            <button key={l} onClick={() => { const id = l === "How it works" ? "process" : l.toLowerCase(); document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); }}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px", color: T.slate, transition: "color 150ms ease", padding: 0 }}
              onMouseEnter={e => e.currentTarget.style.color = T.ink as string}
              onMouseLeave={e => e.currentTarget.style.color = T.slate as string}
            >{l}</button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Desktop CTA */}
          <div className="nav-desktop-cta" style={{ display: "flex" }}>
            <OutlineButton onClick={() => setModalOpen(true)}>Get started</OutlineButton>
          </div>
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation menu"
            style={{ display: "none", width: "44px", height: "44px", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: T.ink }}
            className="mobile-menu-btn"
          >
            <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
              <path d="M0 1h18M0 7h18M0 13h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </nav>

      <style>{`
        /* ── Responsive overrides ── */
        @media (max-width: 768px) {
          /* Nav */
          .nav-desktop-links { display: none !important; }
          .nav-desktop-cta   { display: none !important; }
          .mobile-menu-btn   { display: flex !important; }

          /* Section padding */
          .section-pad  { padding-left: 20px !important; padding-right: 20px !important; }
          .section-vpad { padding-top: 64px !important; padding-bottom: 64px !important; }

          /* Grids → single column */
          .grid-2col  { grid-template-columns: 1fr !important; }
          .grid-auto  { grid-template-columns: 1fr !important; }
          .grid-guarantee { grid-template-columns: 1fr !important; gap: 20px !important; }

          /* Guarantee: stack icon + text */
          .guarantee-icon { text-align: left !important; }
          .guarantee-card { padding: 28px 22px !important; }

          /* ROI calculator sticky card → normal flow */
          .roi-result-card { position: static !important; }

          /* Pricing dark card */
          .pricing-card { padding: 28px 22px !important; }

          /* Hero */
          .hero-metrics { gap: 0 !important; }
          .hero-metrics > div { padding: 0 16px !important; }
          .hero-ctabtn { width: 100% !important; text-align: center !important; }
          .hero-ctas   { flex-direction: column !important; align-items: stretch !important; }

          /* Footer */
          .footer-top        { grid-template-columns: 1fr !important; gap: 40px !important; padding: 40px 20px 32px !important; }
          .footer-nav-cols   { gap: 40px !important; }
          .footer-bottom     { padding: 16px 20px !important; flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
          .footer-trust      { gap: 14px !important; }

          /* Sticky CTA */
          .sticky-cta { padding: 10px 16px !important; }

          /* Ticker items — smaller gap */
          .ticker-item { padding: 0 20px !important; }

          /* Process steps min width */
          .process-grid { grid-template-columns: 1fr 1fr !important; }

          /* Testimonials */
          .testimonials-grid { grid-template-columns: 1fr !important; }

          /* Sample report header */
          .report-header { flex-direction: column !important; gap: 12px !important; }
          .report-header-stats { gap: 12px !important; }

          /* CTA banner */
          .cta-banner { padding: 36px 24px !important; }

          /* Value cards — 1 col on mobile */
          .value-grid { grid-template-columns: 1fr !important; }

          /* Pricing grid */
          .pricing-grid { grid-template-columns: 1fr !important; }
        }

        @media (max-width: 480px) {
          .process-grid { grid-template-columns: 1fr !important; }
          .hero-metrics > div:not(:last-child) { border-right: none !important; border-bottom: 1px solid var(--c-powder); padding-bottom: 16px !important; margin-bottom: 16px !important; }
          .hero-metrics { flex-direction: column !important; align-items: center !important; }
        }
      `}</style>

      {/* ── Hero ── */}
      <HeroSection heroVisible={heroVisible} onCTA={() => setModalOpen(true)} />

      {/* ── Logo ticker ── */}
      <LogoTicker />

      {/* ── ROI Calculator ── */}
      <ROICalculator onCTA={() => setModalOpen(true)} />

      {/* ── Value ── */}
      <section className="section-pad section-vpad" style={{ background: T.powder, padding: "96px 40px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: "64px" }}>
              <p style={{ fontSize: "12px", fontWeight: 700, color: T.violet, letterSpacing: "0.8px", marginBottom: "12px" }}>
                WHAT YOU GET
              </p>
              <h2 style={{ fontSize: "clamp(30px, 4vw, 44px)", fontWeight: 300, color: T.ink, letterSpacing: "-0.025em", margin: "0 auto 16px", maxWidth: "560px" }}>
                A full operational teardown. Nothing skipped.
              </h2>
              <p style={{ fontSize: "16px", color: T.slate, lineHeight: 1.65, maxWidth: "480px", margin: "0 auto" }}>
                Not a generic checklist — a forensic review of your actual business with dollar amounts attached to every finding.
              </p>
            </div>
          </Reveal>

          <div className="value-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
            {[
              { icon: <Settings size={20} />, title: "Software & tool audit", body: "We map every subscription you're paying for and find the $3K–$15K in annual overlap most teams don't even know exists.", delay: 0 },
              { icon: <BarChart2 size={20} />, title: "Pricing gap analysis", body: "We benchmark your rates against market data. Most clients find they're leaving 15–30% on the table without knowing it.", delay: 60 },
              { icon: <RefreshCw size={20} />, title: "Process efficiency review", body: "Manual workflows that eat hours get flagged with automation ROI estimates. You'll know exactly what to fix first.", delay: 120 },
              { icon: <Users size={20} />, title: "Team & hiring analysis", body: "Understaffed, overstaffed, or misaligned — we show you the org changes that unlock growth without adding headcount.", delay: 180 },
              { icon: <Bot size={20} />, title: "AI readiness score", body: "A scored breakdown of exactly where AI can save you 10–20 hours a week — without adding complexity to your stack.", delay: 240 },
              { icon: <Map size={20} />, title: "90-day action roadmap", body: "Every finding becomes a prioritized task with an owner, effort estimate, and expected ROI. Drops straight into your PM tool.", delay: 300 },
            ].map(c => (
              <ValueCard key={c.title} {...c} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Sample Report ── */}
      <SampleReport onCTA={() => setModalOpen(true)} />

      {/* ── Process ── */}
      <section id="process" className="section-pad section-vpad" style={{ background: T.porcelain, padding: "96px 40px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: "64px" }}>
              <p style={{ fontSize: "12px", fontWeight: 700, color: T.violet, letterSpacing: "0.8px", marginBottom: "12px" }}>
                THE PROCESS
              </p>
              <h2 style={{ fontSize: "clamp(30px, 4vw, 44px)", fontWeight: 300, color: T.ink, letterSpacing: "-0.025em", margin: "0 auto 16px" }}>
                Four steps. Five days. Zero calls required upfront.
              </h2>
            </div>
          </Reveal>

          <div className="process-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            {[
              { num: "1", title: "Fill out the intake form", body: "20 minutes. Tell us about your tools, team, and goals. Grant read-only access. We handle the rest.", delay: 0 },
              { num: "2", title: "We go deep", body: "A senior consultant spends 8–10 hours inside your actual business data — not skimming a template.", delay: 80 },
              { num: "3", title: "Findings call", body: "We walk you through every finding, answer every question, and explain the priority order.", delay: 160 },
              { num: "4", title: "You get the report", body: "Full written audit, prioritized roadmap, ROI estimates, and 30 days of follow-up access.", delay: 240 },
            ].map(s => (
              <ProcessStep key={s.num} {...s} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="section-pad section-vpad" style={{ background: T.white, padding: "96px 40px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: "64px" }}>
              <p style={{ fontSize: "12px", fontWeight: 700, color: T.violet, letterSpacing: "0.8px", marginBottom: "12px" }}>
                PRICING
              </p>
              <h2 style={{ fontSize: "clamp(30px, 4vw, 44px)", fontWeight: 300, color: T.ink, letterSpacing: "-0.025em", margin: "0 auto" }}>
                One price. No retainer. No surprises.
              </h2>
            </div>
          </Reveal>

          <div className="pricing-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "24px", alignItems: "start" }}>
            {/* Main plan */}
            <Reveal delay={0}>
              <div style={{
                background: T.ink,
                borderRadius: "10px",
                padding: "36px",
                position: "relative",
                overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute", top: 0, right: 0,
                  width: "200px", height: "200px",
                  background: "radial-gradient(circle, rgba(83,58,253,0.35) 0%, transparent 70%)",
                  borderRadius: "50%",
                  transform: "translate(30%, -30%)",
                  pointerEvents: "none",
                }} />
                <div style={{ position: "relative" }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: T.washed, letterSpacing: "0.5px", marginBottom: "20px" }}>
                    AI BUSINESS ASSESSMENT
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "52px", fontWeight: 300, color: T.white, letterSpacing: "-0.04em", lineHeight: 1 }}>$997</span>
                    <span style={{ fontSize: "14px", color: T.washed }}>one time</span>
                  </div>
                  <p style={{ fontSize: "13px", color: T.soft, marginBottom: "12px", fontStyle: "italic" }}>
                    A senior consultant charges $400/hr. This is 2.5 hours of their time — for a full business teardown.
                  </p>
                  <p style={{ fontSize: "14px", color: T.washed, lineHeight: 1.65, marginBottom: "28px" }}>
                    Delivered in 5 business days. Full refund if you don&apos;t find at least $997 in actionable savings.
                  </p>
                  <PrimaryButton onClick={() => setModalOpen(true)} style={{ width: "100%", textAlign: "center" as const }}>
                    Start my audit
                  </PrimaryButton>
                  <div style={{ marginTop: "28px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    {[
                      "Full business audit report",
                      "60-min findings call",
                      "90-day prioritized roadmap",
                      "AI readiness score",
                      "30 days follow-up access",
                      "30-day money-back guarantee",
                    ].map(f => (
                      <div key={f} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M2.5 7L5.5 10L11.5 4" stroke={T.soft} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span style={{ fontSize: "13px", color: T.washed }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>

            {/* What's included */}
            <Reveal delay={80}>
              <div style={{ padding: "36px 0" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 500, color: T.ink, marginBottom: "8px", letterSpacing: "-0.015em" }}>
                  Built for businesses doing $500K–$10M
                </h3>
                <p style={{ fontSize: "14px", color: T.slate, lineHeight: 1.65, marginBottom: "28px" }}>
                  You&apos;ve grown past the early hustle but things feel fragmented. Stop guessing where the profit is going — we&apos;ll show you, with data.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {[
                    { label: "Average ROI", value: "10×" },
                    { label: "Savings identified on average", value: "$10,400" },
                    { label: "Businesses assessed", value: "214+" },
                    { label: "Satisfaction rate", value: "97%" },
                  ].map(s => (
                    <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "14px", borderBottom: `1px solid ${T.powder}` }}>
                      <span style={{ fontSize: "14px", color: T.slate }}>{s.label}</span>
                      <span style={{ fontSize: "16px", fontWeight: 600, color: T.ink, letterSpacing: "-0.015em", fontVariantNumeric: "tabular-nums" }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Video testimonial ── */}
      <VideoTestimonial />

      {/* ── Guarantee ── */}
      <GuaranteeSection />

      {/* ── Testimonials ── */}
      <section className="section-pad section-vpad" style={{ background: T.powder, padding: "96px 40px" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: "56px" }}>
              <p style={{ fontSize: "12px", fontWeight: 700, color: T.violet, letterSpacing: "0.8px", marginBottom: "12px" }}>
                CLIENT RESULTS
              </p>
              <h2 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 300, color: T.ink, letterSpacing: "-0.025em" }}>
                Founders who stopped guessing.
              </h2>
            </div>
          </Reveal>

          <div className="testimonials-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
            {[
              {
                quote: "We found $14,200 in software we forgot we were paying for. Paid for itself 14× before the month was out.",
                name: "Sarah K.",
                role: "CEO, e-commerce brand",
                initials: "SK",
                delay: 0,
              },
              {
                quote: "The roadmap alone was worth it. We knocked out the top 3 items and cut our support load by 40%.",
                name: "Marcus D.",
                role: "Founder, B2B SaaS",
                initials: "MD",
                delay: 80,
              },
              {
                quote: "I almost didn't buy it. The findings call changed how I think about the whole business. Worth every dollar.",
                name: "Priya M.",
                role: "COO, professional services",
                initials: "PM",
                delay: 160,
              },
            ].map(t => (
              <Reveal key={t.name} delay={t.delay}>
                <div style={{
                  background: T.white,
                  borderRadius: "8px",
                  padding: "28px",
                  border: `1px solid ${T.powder}`,
                  height: "100%",
                  boxSizing: "border-box",
                }}>
                  <svg width="24" height="18" viewBox="0 0 24 18" fill="none" style={{ marginBottom: "16px", opacity: 0.3 }}>
                    <path d="M0 18V10.5C0 7.5 1.5 4.5 4.5 1.5L6 3C4.5 4.5 3.75 6 3.75 7.5H7.5V18H0ZM13.5 18V10.5C13.5 7.5 15 4.5 18 1.5L19.5 3C18 4.5 17.25 6 17.25 7.5H21V18H13.5Z" fill={T.violet} />
                  </svg>
                  <p style={{ fontSize: "15px", color: T.ink, lineHeight: 1.7, marginBottom: "20px", fontStyle: "italic" }}>
                    &quot;{t.quote}&quot;
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "20px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: T.violetBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: "11px", fontWeight: 600, color: T.violet }}>{t.initials}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 500, color: T.ink }}>{t.name}</div>
                      <div style={{ fontSize: "12px", color: T.ghost }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="section-pad section-vpad" style={{ background: T.white, padding: "96px 40px" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: "56px" }}>
              <p style={{ fontSize: "12px", fontWeight: 700, color: T.violet, letterSpacing: "0.8px", marginBottom: "12px" }}>FAQ</p>
              <h2 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 300, color: T.ink, letterSpacing: "-0.025em" }}>
                Everything you want to know before buying.
              </h2>
            </div>
          </Reveal>

          {[
            { q: "How long does the assessment take?", a: "We deliver your full report within 5 business days of receiving your intake form and tool access. The process requires about 30 minutes of your time upfront and one 60-minute call.", delay: 0 },
            { q: "What if I don't find $997 in savings?", a: "We'll refund you in full — no questions asked. If you don't identify at least $997 in actionable savings within 30 days of delivery, we return every dollar. This has happened in fewer than 3% of audits.", delay: 40 },
            { q: "What access do you need?", a: "Read-only access to your accounting software, project management tool, and a list of your active subscriptions. We never need write access or passwords.", delay: 80 },
            { q: "How is this different from hiring a consultant?", a: "A typical consultant charges $400–$800/hr and takes weeks to ramp up. We deliver a structured, data-driven report in 5 days at a fixed price — with a money-back guarantee.", delay: 120 },
            { q: "Is this right for my company size?", a: "We work best with businesses doing $500K–$10M in revenue with 5–50 employees. Below that, ROI is lower. Above it, we offer a custom enterprise package.", delay: 160 },
            { q: "Who actually does the work?", a: "A senior consultant with 8+ years of operational experience. AI tools assist with data processing — a human makes every recommendation.", delay: 200 },
          ].map(f => (
            <FAQItem key={f.q} {...f} />
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="section-pad section-vpad" style={{ padding: "80px 40px", background: T.porcelain }}>
        <Reveal>
          <div className="cta-banner" style={{
            maxWidth: "760px", margin: "0 auto",
            background: T.ink,
            borderRadius: "12px",
            padding: "56px 48px",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", inset: 0,
              background: "radial-gradient(circle at 30% 50%, rgba(83,58,253,0.28) 0%, transparent 60%)",
              pointerEvents: "none",
            }} />
            <div style={{ position: "relative" }}>
              <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 300, color: T.white, letterSpacing: "-0.025em", margin: "0 0 16px" }}>
                Stop leaving money on the table.
              </h2>
              <p style={{ fontSize: "16px", color: T.washed, lineHeight: 1.65, marginBottom: "32px", maxWidth: "520px", margin: "0 auto 32px" }}>
                You built this business to grow — not to bleed profit through tools you forgot about and processes you never had time to fix. Let us find it for you.
              </p>
              <PrimaryButton onClick={() => setModalOpen(true)}>
                Show me what I&apos;m losing
              </PrimaryButton>
              <p style={{ fontSize: "13px", color: T.ghost, marginTop: "14px" }}>
                30-day guarantee · 5-day delivery · Secured by Stripe
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: T.ink }}>
        {/* Main grid */}
        <div className="footer-top" style={{
          maxWidth: "1100px", margin: "0 auto",
          padding: "64px 40px 52px",
          display: "grid", gridTemplateColumns: "1fr auto", gap: "64px", alignItems: "start",
        }}>
          {/* Brand column */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "18px" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: T.violet, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <path d="M7 2L12 11H2L7 2Z" fill="white" fillOpacity="0.9" />
                </svg>
              </div>
              <span style={{ fontSize: "15px", fontWeight: 600, color: T.white, letterSpacing: "-0.01em" }}>AuditAI</span>
            </div>

            <p style={{ fontSize: "14px", color: T.washed, lineHeight: 1.7, maxWidth: "268px", margin: "0 0 28px" }}>
              Find the hidden profit in your business. Delivered in 5 days, backed by a 30-day guarantee.
            </p>

            {/* Micro metrics */}
            <div className="footer-metrics" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                { value: "214+", label: "audits delivered" },
                { value: "$10,400", label: "average savings found" },
                { value: "97%", label: "satisfaction rate" },
              ].map(m => (
                <div key={m.label} style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                  <span style={{ fontSize: "14px", fontWeight: 500, color: T.soft, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.015em" }}>{m.value}</span>
                  <span style={{ fontSize: "12px", color: T.ghost }}>{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          <div className="footer-nav-cols" style={{ display: "flex", gap: "56px" }}>
            <div>
              <p style={{ fontSize: "10px", fontWeight: 700, color: T.ghost, letterSpacing: "0.6px", marginBottom: "20px" }}>PRODUCT</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {[
                  { label: "How it works", id: "process" },
                  { label: "Pricing",      id: "pricing" },
                  { label: "FAQ",          id: "faq" },
                ].map(({ label, id }) => (
                  <button
                    key={label}
                    onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left", fontSize: "13px", color: T.washed, transition: "color 160ms ease" }}
                    onMouseEnter={e => (e.currentTarget.style.color = T.white)}
                    onMouseLeave={e => (e.currentTarget.style.color = T.washed)}
                  >{label}</button>
                ))}
              </div>
            </div>

            <div>
              <p style={{ fontSize: "10px", fontWeight: 700, color: T.ghost, letterSpacing: "0.6px", marginBottom: "20px" }}>LEGAL</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {["Privacy", "Terms", "Contact"].map(l => (
                  <a key={l} href="#" style={{ fontSize: "13px", color: T.washed, textDecoration: "none", transition: "color 160ms ease" }}
                    onMouseEnter={e => (e.currentTarget.style.color = T.white)}
                    onMouseLeave={e => (e.currentTarget.style.color = T.washed)}
                  >{l}</a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", margin: "0 40px" }} />

        {/* Bottom bar */}
        <div className="footer-bottom" style={{
          maxWidth: "1100px", margin: "0 auto",
          padding: "20px 40px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: "12px",
        }}>
          <p style={{ fontSize: "12px", color: T.ghost, margin: 0 }}>
            © 2026 AuditAI. All rights reserved.
          </p>
          <div className="footer-trust" style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
            {["Secured by Stripe", "30-day guarantee", "Read-only access"].map(t => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6.5L4.5 9L10 3.5" stroke="var(--c-green)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span style={{ fontSize: "11px", color: T.ghost }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </footer>

      {/* ── Mobile nav sheet ── */}
      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} onCTA={() => setModalOpen(true)} />

      {/* ── Sticky bottom CTA ── */}
      <StickyCTA visible={showStickyCTA && !modalOpen} onCTA={() => setModalOpen(true)} />

      {/* ── Exit intent ── */}
      {exitIntent && <ExitIntent onCTA={() => setModalOpen(true)} onDismiss={() => setExitIntent(false)} />}

      {/* ── Payment Modal ── */}
      {modalOpen && <PaymentModal onClose={() => setModalOpen(false)} />}
    </>
  );
}
