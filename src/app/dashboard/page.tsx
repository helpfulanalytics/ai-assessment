"use client";

import React, { useState } from "react";
import Link from "next/link";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../../lib/firebase-client";
import type { AuditReport } from "../../data/mockAuditData";

type AuditRecord = AuditReport & {
  id: string;
  createdAt: string;
  persona?: string;
  viewport?: string;
};

/* ── Design tokens ── */
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
  green:     "var(--c-green)",
  orange:    "var(--c-orange)",
  greenBg:   "var(--c-green-bg)",
  orangeBg:  "var(--c-orange-bg)",
  violetBg:  "var(--c-violet-bg)",
};

const KEYFRAMES = `
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-8px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  @keyframes spinSlow {
    to { transform: rotate(360deg); }
  }
  @keyframes dashDraw {
    from { stroke-dashoffset: 110; }
    to   { stroke-dashoffset: var(--target-offset); }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.94); }
    to   { opacity: 1; transform: scale(1); }
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

/* ── Score helpers ── */
const scoreColor = (s: number) => s >= 80 ? "#81b81a" : s >= 60 ? "#f59e0b" : "#ef4444";
const scoreLabel = (s: number) => s >= 80 ? "Good" : s >= 60 ? "Fair" : "Needs work";

/* ── Score ring ── */
function ScoreRing({ score, size = 52 }: { score: number; size?: number }) {
  const r = (size / 2) - 5;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = scoreColor(score);
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ flexShrink: 0, transform: "rotate(-90deg)" }}
      aria-hidden="true"
    >
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color + "22"} strokeWidth="3.5" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 800ms cubic-bezier(0.23,1,0.32,1)" }}
      />
    </svg>
  );
}

/* ── Skeleton card ── */
function SkeletonCard({ delay = 0 }: { delay?: number }) {
  const shimmerStyle: React.CSSProperties = {
    background: "linear-gradient(90deg, var(--c-powder) 25%, var(--c-porcelain) 50%, var(--c-powder) 75%)",
    backgroundSize: "800px 100%",
    animation: `shimmer 1.4s ease-in-out ${delay}ms infinite`,
    borderRadius: "6px",
  };
  return (
    <div style={{
      background: T.white,
      border: `1px solid ${T.powder}`,
      borderRadius: "12px",
      padding: "18px 20px",
      display: "flex",
      alignItems: "center",
      gap: "16px",
    }}>
      <div style={{ ...shimmerStyle, width: "52px", height: "52px", borderRadius: "50%", flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ ...shimmerStyle, height: "14px", width: "60%" }} />
        <div style={{ ...shimmerStyle, height: "11px", width: "40%" }} />
      </div>
      <div style={{ ...shimmerStyle, width: "48px", height: "22px", borderRadius: "100px" }} />
    </div>
  );
}

/* ── Severity chip ── */
function SeverityChip({ count, type }: { count: number; type: "critical" | "warning" | "info" }) {
  const cfg = {
    critical: { bg: "#fef2f2", color: "#dc2626", dot: "#ef4444" },
    warning:  { bg: "#fffbeb", color: "#b45309", dot: "#f59e0b" },
    info:     { bg: T.violetBg, color: T.violet, dot: T.violet },
  }[type];
  if (!count) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      background: cfg.bg, color: cfg.color,
      borderRadius: "100px", padding: "2px 8px",
      fontSize: "11px", fontWeight: 600, whiteSpace: "nowrap",
    }}>
      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: cfg.dot }} />
      {count} {type}
    </span>
  );
}

/* ── Audit card ── */
function AuditCard({ audit, index }: { audit: AuditRecord; index: number }) {
  const [hov, setHov] = useState(false);
  const color = scoreColor(audit.overallScore);

  const critical = audit.issues?.filter(i => i.severity === "critical").length ?? 0;
  const warning  = audit.issues?.filter(i => i.severity === "warning").length  ?? 0;
  const info     = (audit.issues?.length ?? 0) - critical - warning;

  let hostname = audit.targetUrl ?? "";
  try { hostname = new URL(audit.targetUrl).hostname; } catch {}

  return (
    <Link href={`/report/${audit.id}`} style={{ textDecoration: "none" }}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          background: T.white,
          border: `1px solid ${hov ? T.washed : T.powder}`,
          borderRadius: "12px",
          padding: "18px 20px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          cursor: "pointer",
          transform: hov ? "translateY(-2px)" : "translateY(0)",
          boxShadow: hov
            ? "0 8px 28px rgba(83,58,253,0.10), 0 2px 8px rgba(0,0,0,0.04)"
            : "0 1px 4px rgba(0,0,0,0.04)",
          transition: "transform 200ms cubic-bezier(0.23,1,0.32,1), box-shadow 200ms ease, border-color 200ms ease",
          animation: `fadeUp 0.35s cubic-bezier(0.23,1,0.32,1) ${index * 60}ms both`,
        }}
        role="article"
        aria-label={`Audit report for ${hostname}, score ${audit.overallScore}`}
      >
        {/* Score ring */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <ScoreRing score={audit.overallScore} size={52} />
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{
              fontSize: "13px", fontWeight: 700,
              color: color,
              lineHeight: 1,
            }}>
              {audit.overallScore}
            </span>
          </div>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
            <p style={{
              margin: 0, fontSize: "14px", fontWeight: 600,
              color: T.ink, overflow: "hidden",
              textOverflow: "ellipsis", whiteSpace: "nowrap",
              letterSpacing: "-0.01em",
            }}>
              {hostname || audit.targetUrl}
            </p>
            <span style={{
              fontSize: "11px", fontWeight: 500,
              color: color,
              background: color + "18",
              borderRadius: "100px",
              padding: "1px 7px",
              flexShrink: 0,
            }}>
              {scoreLabel(audit.overallScore)}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "12px", color: T.ghost }}>{audit.date}</span>
            {audit.persona  && <><span style={{ color: T.stone, fontSize: "10px" }}>·</span><span style={{ fontSize: "12px", color: T.ghost }}>{audit.persona}</span></>}
            {audit.viewport && <><span style={{ color: T.stone, fontSize: "10px" }}>·</span><span style={{ fontSize: "12px", color: T.ghost }}>{audit.viewport}</span></>}
          </div>

          {(critical > 0 || warning > 0 || info > 0) && (
            <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
              <SeverityChip count={critical} type="critical" />
              <SeverityChip count={warning}  type="warning"  />
              <SeverityChip count={info}     type="info"     />
            </div>
          )}
        </div>

        {/* Arrow */}
        <div style={{
          width: "32px", height: "32px", borderRadius: "8px",
          background: hov ? T.violetBg : T.porcelain,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
          transition: "background 200ms ease",
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
              d="M5 2.5l4.5 4.5L5 11.5"
              stroke={hov ? T.violet : T.stone}
              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
              style={{ transition: "stroke 200ms ease" }}
            />
          </svg>
        </div>
      </div>
    </Link>
  );
}

/* ── Empty state ── */
function EmptyState({ email, onReset }: { email: string; onReset: () => void }) {
  return (
    <div style={{
      background: T.white,
      border: `1px solid ${T.powder}`,
      borderRadius: "16px",
      padding: "64px 32px",
      textAlign: "center",
      animation: "scaleIn 0.3s cubic-bezier(0.23,1,0.32,1)",
    }}>
      {/* Icon */}
      <div style={{
        width: "56px", height: "56px", borderRadius: "16px",
        background: T.porcelain,
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 20px",
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 13h6M9 17h4M5 3h14l2 4v14H3V7l2-4z" stroke={T.ghost} strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M8 3v4h8V3" stroke={T.ghost} strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      </div>
      <p style={{ fontSize: "16px", fontWeight: 500, color: T.ink, margin: "0 0 8px", letterSpacing: "-0.01em" }}>
        No reports found
      </p>
      <p style={{ fontSize: "13px", color: T.ghost, margin: "0 0 28px", lineHeight: 1.6, maxWidth: "280px", marginLeft: "auto", marginRight: "auto" }}>
        We couldn&apos;t find any audits for <strong style={{ color: T.slate }}>{email}</strong>. Double-check the email or run your first audit.
      </p>
      <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
        <Link href="/" style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          padding: "9px 18px",
          background: T.violet, color: T.white,
          borderRadius: "8px", fontSize: "13px", fontWeight: 500,
          textDecoration: "none",
          transition: "background 150ms ease",
        }}
          onMouseEnter={e => e.currentTarget.style.background = T.soft}
          onMouseLeave={e => e.currentTarget.style.background = T.violet}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M6 1v10M1 6h10" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Run first audit
        </Link>
        <button onClick={onReset} style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          padding: "9px 18px",
          background: "transparent", color: T.slate,
          border: `1.5px solid ${T.stone}`, borderRadius: "8px",
          fontSize: "13px", cursor: "pointer",
          transition: "all 150ms ease",
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.washed; e.currentTarget.style.color = T.violet; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.stone;  e.currentTarget.style.color = T.slate; }}
        >
          Try another email
        </button>
      </div>
    </div>
  );
}

/* ── Main ── */
export default function DashboardPage() {
  const [email, setEmail]         = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [audits, setAudits]       = useState<AuditRecord[]>([]);
  const [error, setError]         = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const q = query(
        collection(db, "audits"),
        where("email", "==", email.trim()),
        orderBy("createdAt", "desc"),
      );
      const snap = await getDocs(q);
      setAudits(snap.docs.map(d => d.data() as AuditRecord));
      setSubmitted(true);
    } catch {
      setError("Couldn't load audits — please try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setSubmitted(false); setAudits([]); setError(null); };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />
      <div style={{
        display: "flex", height: "100vh", background: T.porcelain,
        fontFamily: "var(--font-sans, system-ui, sans-serif)",
        fontFeatureSettings: '"ss01" on, "tnum"',
        overflow: "hidden",
      }}>

        {/* ── Sidebar ── */}
        <aside
          style={{
            width: sidebarCollapsed ? "56px" : "224px",
            background: T.white,
            borderRight: `1px solid ${T.powder}`,
            display: "flex", flexDirection: "column",
            flexShrink: 0,
            transition: "width 260ms cubic-bezier(0.23,1,0.32,1)",
            overflow: "hidden",
          }}
          aria-label="Sidebar navigation"
        >
          {/* Logo */}
          <div style={{
            height: "56px", display: "flex", alignItems: "center",
            padding: sidebarCollapsed ? "0 14px" : "0 20px",
            borderBottom: `1px solid ${T.powder}`,
            flexShrink: 0,
            justifyContent: sidebarCollapsed ? "center" : "flex-start",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
              <div style={{
                width: "28px", height: "28px", borderRadius: "6px",
                background: T.violet, display: "flex", alignItems: "center",
                justifyContent: "center", flexShrink: 0,
              }}>
                <svg width="13" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M7 2L12 11H2L7 2Z" fill="white" fillOpacity="0.95" />
                </svg>
              </div>
              {!sidebarCollapsed && (
                <div style={{ display: "flex", flexDirection: "column", animation: "slideIn 0.18s ease" }}>
                  <span style={{ fontSize: "15px", fontWeight: 600, color: "#1e293b", letterSpacing: "-0.01em", lineHeight: 1.2 }}>AssessAI</span>
                  <span style={{ fontSize: "10px", fontWeight: 400, color: "#64748b", lineHeight: 1, marginTop: "2px" }}>powered by EraseFriction</span>
                </div>
              )}
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: "1px", overflowY: "auto" }} aria-label="Main">
            {!sidebarCollapsed && (
              <p style={{ fontSize: "10px", fontWeight: 600, color: T.ghost, letterSpacing: "0.06em", padding: "4px 10px 8px", margin: 0, textTransform: "uppercase" }}>
                Navigation
              </p>
            )}
            <button
              aria-current="page"
              title={sidebarCollapsed ? "My Audits" : undefined}
              style={{
                display: "flex", alignItems: "center", gap: "9px",
                padding: sidebarCollapsed ? "10px 0" : "9px 10px",
                borderRadius: "6px", border: "none",
                cursor: "pointer",
                justifyContent: sidebarCollapsed ? "center" : "flex-start",
                background: T.violetBg, color: T.violet,
                width: "100%",
                boxShadow: `inset 3px 0 0 ${T.violet}`,
              }}
            >
              <span style={{ flexShrink: 0, display: "flex" }}>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
                  <path d="M3 2h6.5L12 4.5V13H3V2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                  <path d="M9 2v3h3" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                  <path d="M5 7.5h5M5 10h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </span>
              {!sidebarCollapsed && (
                <span style={{ fontSize: "13px", fontWeight: 500, letterSpacing: "-0.005em", whiteSpace: "nowrap", animation: "slideIn 0.18s ease" }}>
                  My Audits
                </span>
              )}
            </button>
          </nav>

          {/* Collapse toggle */}
          <div style={{ borderTop: `1px solid ${T.powder}`, padding: "12px 8px" }}>
            <button
              onClick={() => setSidebarCollapsed(c => !c)}
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              style={{
                display: "flex", alignItems: "center", gap: "9px",
                padding: sidebarCollapsed ? "9px 0" : "9px 10px",
                borderRadius: "6px", border: "none", background: "transparent",
                cursor: "pointer", color: T.ghost, width: "100%",
                justifyContent: sidebarCollapsed ? "center" : "flex-start",
                transition: "background 130ms ease, color 130ms ease",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = T.porcelain; e.currentTarget.style.color = T.ink; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.ghost; }}
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true"
                style={{ flexShrink: 0, transform: sidebarCollapsed ? "rotate(180deg)" : "none", transition: "transform 260ms cubic-bezier(0.23,1,0.32,1)" }}>
                <path d="M5 3L9 7.5 5 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 3v9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              {!sidebarCollapsed && <span style={{ fontSize: "13px", animation: "slideIn 0.18s ease" }}>Collapse</span>}
            </button>
          </div>
        </aside>

        {/* ── Main column ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

          {/* ── Top bar ── */}
          <header style={{
            background: T.white,
            borderBottom: `1px solid ${T.powder}`,
            padding: "0 28px",
            height: "56px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexShrink: 0, gap: "16px",
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
              <h1 style={{ fontSize: "15px", fontWeight: 600, color: T.ink, letterSpacing: "-0.02em", margin: 0, lineHeight: 1.2 }}>
                My Audits
              </h1>
              <p style={{ fontSize: "11px", color: T.ghost, margin: 0 }}>
                {submitted
                  ? `${audits.length} ${audits.length === 1 ? "report" : "reports"} · ${email}`
                  : "View your past audit reports"}
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "1px", height: "20px", background: T.powder }} />
              <Link
                href="/"
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  fontSize: "13px", fontWeight: 400, color: T.violet,
                  textDecoration: "none", padding: "6px 14px", borderRadius: "4px",
                  border: `1.5px solid ${T.washed}`, background: "transparent",
                  transition: "background 130ms ease, border-color 130ms ease",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = T.violetBg; e.currentTarget.style.borderColor = T.violet; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = T.washed; }}
              >
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
                  <path d="M1.5 5.5h8M6 2l3.5 3.5L6 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Run new audit
              </Link>
            </div>
          </header>

          {/* ── Content ── */}
          <main
            style={{ flex: 1, overflowY: "auto", padding: "40px 40px 60px" }}
            id="main-content"
            tabIndex={-1}
          >

            {/* ── Lookup form ── */}
            {!submitted && (
              <div style={{ animation: "fadeUp 0.4s cubic-bezier(0.23,1,0.32,1)" }}>
                {/* Header */}
                <div style={{ marginBottom: "32px", maxWidth: "560px" }}>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    background: T.violetBg, borderRadius: "100px",
                    padding: "4px 12px", marginBottom: "14px",
                  }}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                      <circle cx="5" cy="5" r="3.5" fill={T.violet} />
                    </svg>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: T.violet, letterSpacing: "0.04em" }}>
                      AUDIT PORTAL
                    </span>
                  </div>
                  <h2 style={{
                    fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 300,
                    color: T.ink, letterSpacing: "-0.03em",
                    lineHeight: 1.2, margin: "0 0 10px",
                  }}>
                    Access your reports
                  </h2>
                  <p style={{ fontSize: "14px", color: T.ghost, margin: 0, lineHeight: 1.65, maxWidth: "440px" }}>
                    Enter the email you used at checkout. We&apos;ll pull up all your past UX audit reports instantly.
                  </p>
                </div>

                {/* Form card */}
                <div style={{
                  maxWidth: "480px",
                  background: T.white,
                  borderRadius: "16px",
                  border: `1px solid ${inputFocused ? T.washed : T.powder}`,
                  boxShadow: inputFocused
                    ? "0 0 0 4px var(--c-violet-bg), 0 4px 20px rgba(83,58,253,0.08)"
                    : "0 2px 12px rgba(0,0,0,0.04)",
                  transition: "box-shadow 200ms ease, border-color 200ms ease",
                  overflow: "hidden",
                }}>
                  {/* Card header */}
                  <div style={{ padding: "22px 24px 18px", borderBottom: `1px solid ${T.powder}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{
                        width: "34px", height: "34px", borderRadius: "9px",
                        background: T.violetBg,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
                          <circle cx="6" cy="5.5" r="3.5" stroke={T.violet} strokeWidth="1.4" />
                          <path d="M1.5 13c0-2.21 2.01-4 4.5-4s4.5 1.79 4.5 4" stroke={T.violet} strokeWidth="1.4" strokeLinecap="round" />
                          <path d="M11 8l1.5 1.5L15 7" stroke={T.violet} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: T.ink, letterSpacing: "-0.01em" }}>
                          Lookup your audits
                        </p>
                        <p style={{ margin: 0, fontSize: "12px", color: T.ghost }}>
                          Secure · Read-only access
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Form body */}
                  <form onSubmit={handleLookup} style={{ padding: "22px 24px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                      <label
                        htmlFor="audit-email"
                        style={{ display: "block", fontSize: "11px", fontWeight: 600, color: T.ghost, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "8px" }}
                      >
                        Email address
                      </label>
                      <div style={{ position: "relative" }}>
                        <svg
                          width="14" height="14" viewBox="0 0 14 14" fill="none"
                          aria-hidden="true"
                          style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: T.ghost, pointerEvents: "none" }}
                        >
                          <rect x="1" y="2.5" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                          <path d="M1 4l6 4.5L13 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                        </svg>
                        <input
                          id="audit-email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          required
                          autoComplete="email"
                          onFocus={() => setInputFocused(true)}
                          onBlur={() => setInputFocused(false)}
                          style={{
                            width: "100%", padding: "11px 14px 11px 36px",
                            border: `1.5px solid ${T.stone}`, borderRadius: "8px",
                            fontSize: "14px", color: T.ink, background: T.white,
                            outline: "none", fontFamily: "inherit",
                            boxSizing: "border-box",
                            transition: "border-color 160ms ease",
                          }}
                          onFocusCapture={e => { e.currentTarget.style.borderColor = T.violet; }}
                          onBlurCapture={e => { e.currentTarget.style.borderColor = T.stone; }}
                        />
                      </div>
                    </div>

                    {error && (
                      <div style={{
                        display: "flex", alignItems: "center", gap: "8px",
                        padding: "10px 14px",
                        background: "#fff1f2", border: "1px solid #fecdd3",
                        borderRadius: "8px",
                      }} role="alert">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                          <circle cx="7" cy="7" r="6" stroke="#ef4444" strokeWidth="1.4" />
                          <path d="M7 4v3.5" stroke="#ef4444" strokeWidth="1.4" strokeLinecap="round" />
                          <circle cx="7" cy="10" r="0.75" fill="#ef4444" />
                        </svg>
                        <span style={{ fontSize: "13px", color: "#dc2626" }}>{error}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      aria-busy={loading}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                        width: "100%", padding: "11px 16px",
                        background: loading ? T.soft : T.violet,
                        color: T.white, border: "none", borderRadius: "8px",
                        fontSize: "14px", fontWeight: 500,
                        cursor: loading ? "not-allowed" : "pointer",
                        transition: "background 150ms ease, transform 150ms ease",
                        letterSpacing: "-0.005em",
                      }}
                      onMouseEnter={e => { if (!loading) e.currentTarget.style.background = T.soft; }}
                      onMouseLeave={e => { if (!loading) e.currentTarget.style.background = T.violet; }}
                      onMouseDown={e => { if (!loading) e.currentTarget.style.transform = "scale(0.98)"; }}
                      onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
                    >
                      {loading ? (
                        <svg width="15" height="15" viewBox="0 0 15 15" aria-label="Loading" style={{ animation: "spinSlow 0.7s linear infinite" }}>
                          <circle cx="7.5" cy="7.5" r="5.5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                          <path d="M7.5 2A5.5 5.5 0 0 1 13 7.5" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                          <circle cx="6" cy="6" r="4.5" stroke="white" strokeWidth="1.5" />
                          <path d="M9.5 9.5L13 13" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      )}
                      {loading ? "Looking up reports…" : "View my audits"}
                    </button>
                  </form>
                </div>

                {/* Hint row */}
                <div style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  marginTop: "20px", maxWidth: "480px",
                }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M6 1v4l2.5 2" stroke={T.stone} strokeWidth="1.4" strokeLinecap="round" />
                    <circle cx="6" cy="6" r="5" stroke={T.stone} strokeWidth="1.2" />
                  </svg>
                  <span style={{ fontSize: "12px", color: T.ghost }}>
                    Reports are available immediately after your audit completes.
                  </span>
                </div>
              </div>
            )}

            {/* ── Loading skeletons ── */}
            {submitted && loading && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "680px" }}>
                <SkeletonCard delay={0} />
                <SkeletonCard delay={100} />
                <SkeletonCard delay={200} />
              </div>
            )}

            {/* ── Results ── */}
            {submitted && !loading && (
              <div style={{ animation: "fadeUp 0.35s cubic-bezier(0.23,1,0.32,1)" }}>

                {/* Results header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "14px" }}>
                  <div>
                    <h2 style={{ fontSize: "20px", fontWeight: 400, color: T.ink, letterSpacing: "-0.025em", margin: "0 0 4px", lineHeight: 1.2 }}>
                      {audits.length > 0
                        ? <><strong style={{ fontWeight: 600 }}>{audits.length}</strong> {audits.length === 1 ? "report" : "reports"} found</>
                        : "No reports found"
                      }
                    </h2>
                    <p style={{ fontSize: "13px", color: T.ghost, margin: 0 }}>{email}</p>
                  </div>

                  <button
                    onClick={reset}
                    style={{
                      display: "flex", alignItems: "center", gap: "6px",
                      fontSize: "12px", color: T.slate,
                      background: T.white,
                      border: `1.5px solid ${T.stone}`, borderRadius: "8px",
                      padding: "7px 14px", cursor: "pointer",
                      transition: "all 150ms ease",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = T.washed; e.currentTarget.style.color = T.violet; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.stone;  e.currentTarget.style.color = T.slate; }}
                  >
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
                      <path d="M5.5 1l-4 4.5 4 4.5M1.5 5.5h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Switch email
                  </button>
                </div>

                {/* Empty state */}
                {audits.length === 0 && <EmptyState email={email} onReset={reset} />}

                {/* Audit cards */}
                {audits.length > 0 && (
                  <>
                    {/* Average score banner */}
                    {audits.length > 1 && (() => {
                      const avg = Math.round(audits.reduce((s, a) => s + a.overallScore, 0) / audits.length);
                      return (
                        <div style={{
                          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                          gap: "10px", marginBottom: "20px",
                        }}>
                          {[
                            {
                              label: "Average score",
                              value: `${avg}/100`,
                              color: scoreColor(avg),
                              bg: scoreColor(avg) + "14",
                            },
                            {
                              label: "Total reports",
                              value: String(audits.length),
                              color: T.violet,
                              bg: T.violetBg,
                            },
                            {
                              label: "Issues found",
                              value: String(audits.reduce((s, a) => s + (a.issues?.length ?? 0), 0)),
                              color: T.orange,
                              bg: T.orangeBg,
                            },
                          ].map(stat => (
                            <div key={stat.label} style={{
                              background: T.white,
                              border: `1px solid ${T.powder}`,
                              borderRadius: "10px",
                              padding: "14px 18px",
                            }}>
                              <p style={{ fontSize: "11px", fontWeight: 600, color: T.ghost, letterSpacing: "0.4px", textTransform: "uppercase", margin: "0 0 4px" }}>
                                {stat.label}
                              </p>
                              <p style={{
                                fontSize: "24px", fontWeight: 300, color: stat.color,
                                letterSpacing: "-0.04em", margin: 0,
                                fontVariantNumeric: "tabular-nums",
                              }}>
                                {stat.value}
                              </p>
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                    {/* List */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxWidth: "760px" }}>
                      {audits.map((audit, i) => (
                        <AuditCard key={audit.id} audit={audit} index={i} />
                      ))}
                    </div>

                    {/* Footer action */}
                    <div style={{ marginTop: "28px" }}>
                      <Link href="/" style={{
                        display: "inline-flex", alignItems: "center", gap: "7px",
                        fontSize: "13px", color: T.violet, textDecoration: "none", fontWeight: 500,
                        padding: "8px 0",
                      }}
                        onMouseEnter={e => e.currentTarget.style.opacity = "0.75"}
                        onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                          <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                        Run a new audit
                      </Link>
                    </div>
                  </>
                )}
              </div>
            )}

          </main>
        </div>
      </div>
    </>
  );
}
