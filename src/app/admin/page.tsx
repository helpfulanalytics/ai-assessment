"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { CreditCard, Check, Phone, Zap, ClipboardList, Loader2, Lock } from "lucide-react";
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, User } from "firebase/auth";
import { db, auth } from "../../lib/firebase-client";
import { useDarkMode } from "../../hooks/useDarkMode";
import AuditRunner from "../../components/AuditRunner";
import AuraScore from "../../components/AuraScore";
import BentoGrid from "../../components/BentoGrid";
import IssueDrawer from "../../components/IssueDrawer";
import type { AuditReport, AuditIssue } from "../../data/mockAuditData";

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
  green:     "var(--c-green)",
  orange:    "var(--c-orange)",
  greenBg:   "var(--c-green-bg)",
  orangeBg:  "var(--c-orange-bg)",
  violetBg:  "var(--c-violet-bg)",
};

/* ── Helper ── */
function formatDateShort(val: unknown, defaultText = "Recent"): string {
  if (!val) return defaultText;
  try {
    let d = new Date(val as string | number);
    if (val && typeof val === "object" && "toDate" in val && typeof (val as { toDate: () => Date }).toDate === "function") {
      d = (val as { toDate: () => Date }).toDate();
    }
    if (isNaN(d.getTime())) return defaultText;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch (e) {
    return defaultText;
  }
}

/* ── Login Screen ── */
function LoginScreen() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(() => {
    if (typeof window !== "undefined") {
      return isSignInWithEmailLink(auth, window.location.href);
    }
    return false;
  });
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    async function checkLink() {
      await Promise.resolve(); // Yield to avoid synchronous setState warnings
      // Check if user is returning from email link
      if (isSignInWithEmailLink(auth, window.location.href)) {
        let emailForSignIn = window.localStorage.getItem("emailForSignIn");
        if (!emailForSignIn) {
          emailForSignIn = window.prompt("Please provide your email for confirmation");
        }
        if (emailForSignIn) {
          try {
            await signInWithEmailLink(auth, emailForSignIn, window.location.href);
            window.localStorage.removeItem("emailForSignIn");
            // Successful login will trigger onAuthStateChanged in parent
          } catch (err) {
            if (err instanceof Error) {
              setError(err.message || "Failed to sign in with email link");
            } else {
              setError("Failed to sign in with email link");
            }
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      }
    }
    checkLink();
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const actionCodeSettings = {
        url: window.location.origin + "/admin", // redirect back to dashboard
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem("emailForSignIn", email);
      setEmailSent(true);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Failed to send login link");
      } else {
        setError("Failed to send login link");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: T.washed, color: T.ink, fontFamily: "var(--font-sans)"
    }}>
      <div style={{
        background: T.white, padding: "40px", borderRadius: "16px",
        boxShadow: "rgba(0,0,0,0.08) 0px 4px 12px", width: "100%", maxWidth: "400px"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px" }}>
          <div style={{ width: 48, height: 48, borderRadius: "12px", background: T.violetBg, color: T.violet, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Lock size={24} />
          </div>
        </div>
        <h1 style={{ fontSize: "24px", fontWeight: 700, textAlign: "center", marginBottom: "8px" }}>Admin Login</h1>
        
        {emailSent ? (
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "14px", color: T.ghost, marginBottom: "16px" }}>
              We sent a magic link to <strong>{email}</strong>. Check your inbox and click the link to log in.
            </p>
            <button
              onClick={() => setEmailSent(false)}
              style={{
                background: "transparent", color: T.violet, border: `1.5px solid ${T.washed}`,
                padding: "8px 16px", borderRadius: "6px", fontSize: "13px", fontWeight: 500, cursor: "pointer"
              }}
            >
              Try another email
            </button>
          </div>
        ) : (
          <>
            <p style={{ fontSize: "14px", color: T.ghost, textAlign: "center", marginBottom: "32px" }}>Sign in with a magic link</p>
            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Email</label>
                <input
                  type="email" required
                  value={email} onChange={e => setEmail(e.target.value)}
                  style={{ width: "100%", padding: "12px", borderRadius: "8px", border: `1px solid ${T.powder}`, background: T.porcelain, color: T.ink, fontSize: "14px" }}
                  placeholder="admin@example.com"
                />
              </div>
              {error && <div style={{ color: "#d93025", fontSize: "13px", background: "#fce8e6", padding: "10px", borderRadius: "6px" }}>{error}</div>}
              
              <button
                type="submit" disabled={loading}
                style={{
                  background: T.violet, color: "#fff", padding: "12px", borderRadius: "8px",
                  border: "none", fontSize: "14px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  marginTop: "8px"
                }}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : "Send Magic Link"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Types ── */
type Tab    = "dashboard" | "orders" | "assessments" | "reports" | "settings";
type Status = "completed" | "processing" | "paid" | "pending";

type Order = {
  id: string;
  company: string;
  contact: string;
  email: string;
  status: Status;
  date: string;
  amount: number;
};

type Assessment = {
  id: string;
  company: string;
  contact: string;
  date: string;
  score: number;
  savings: string;
  status: Status;
};

type Report = {
  id: string;
  fullId: string;
  company: string;
  contact: string;
  generated: string;
  findings: number;
  topSaving: string;
};

const STATUS_MAP: Record<Status, { bg: string; color: string; dot: string; label: string }> = {
  completed:  { bg: T.greenBg,   color: "#3a6b05", dot: T.green,   label: "Completed" },
  processing: { bg: T.violetBg,  color: T.violet,  dot: T.violet,  label: "Processing" },
  paid:       { bg: T.powder,    color: T.slate,   dot: T.slate,   label: "Paid" },
  pending:    { bg: T.orangeBg,  color: "#c2440a", dot: T.orange,  label: "Pending" },
};

const NAV: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard",   label: "Dashboard",   icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1" y="1" width="5.5" height="5.5" rx="1" fill="currentColor" /><rect x="8.5" y="1" width="5.5" height="5.5" rx="1" fill="currentColor" /><rect x="1" y="8.5" width="5.5" height="5.5" rx="1" fill="currentColor" /><rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1" fill="currentColor" /></svg> },
  { id: "orders",      label: "Orders",      icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M2 3h11M2 7.5h11M2 12h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg> },
  { id: "assessments", label: "Assessments", icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.4" /><path d="M5 7.5l2 2 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg> },
  { id: "reports",     label: "Reports",     icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M3 2h6.5L12 4.5V13H3V2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /><path d="M9 2v3h3" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /><path d="M5 7.5h5M5 10h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg> },
  { id: "settings",    label: "Settings",    icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.4" /><path d="M7.5 1v1.5M7.5 12.5V14M14 7.5h-1.5M2.5 7.5H1M11.78 3.22l-1.06 1.06M4.28 10.72l-1.06 1.06M11.78 11.78l-1.06-1.06M4.28 4.28L3.22 3.22" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg> },
];

/* ── Toast system ── */
type Toast = { id: number; message: string; sub: string; icon: React.ReactNode; color: string };

let toastId = 0;

function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dismiss = (id: number) => setToasts(ts => ts.filter(t => t.id !== id));
  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = ++toastId;
    setToasts(ts => [{ ...t, id }, ...ts].slice(0, 4));
    setTimeout(() => dismiss(id), 5000);
  }, []);
  return { toasts, push, dismiss };
}

function ToastStack({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: number) => void }) {
  return (
    <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 9999, display: "flex", flexDirection: "column", gap: "8px", pointerEvents: "none" }}>
      {toasts.map(t => (
        <div
          key={t.id}
          style={{
            background: T.white, borderRadius: "10px",
            padding: "12px 14px",
            boxShadow: "rgba(0,0,0,0.12) 0px 8px 28px -4px, rgba(0,0,0,0.06) 0px 2px 6px 0px",
            border: `1px solid ${T.powder}`,
            display: "flex", alignItems: "center", gap: "10px",
            minWidth: "260px", maxWidth: "320px",
            pointerEvents: "all",
            animation: "toastIn 0.36s cubic-bezier(0.23, 1, 0.32, 1) both",
          }}
        >
          <div style={{
            width: "32px", height: "32px", borderRadius: "8px",
            background: t.color + "18",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "14px", flexShrink: 0,
          }}>
            {t.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: T.ink, marginBottom: "1px" }}>{t.message}</div>
            <div style={{ fontSize: "12px", color: T.ghost, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.sub}</div>
          </div>
          <button
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss notification"
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: T.ghost, fontSize: "18px", padding: "0",
              minWidth: "44px", minHeight: "44px", width: "44px", height: "44px",
              display: "flex", alignItems: "center", justifyContent: "center",
              lineHeight: 1, flexShrink: 0
            }}
          >×</button>
        </div>
      ))}
    </div>
  );
}

/* ── Keyframes ── */
const KEYFRAMES = `
  @keyframes toastIn {
    from { opacity: 0; transform: translateX(60px) scale(0.95); }
    to   { opacity: 1; transform: translateX(0) scale(1); }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-8px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes barGrow {
    from { transform: scaleY(0); }
    to   { transform: scaleY(1); }
  }
  @keyframes countUp {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes spinSlow {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.5; }
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

/* ── Atoms ── */
function StatusBadge({ status }: { status: Status }) {
  const s = STATUS_MAP[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      background: s.bg, color: s.color,
      borderRadius: "100px", padding: "3px 10px 3px 8px",
      fontSize: "12px", fontWeight: 500, whiteSpace: "nowrap",
    }}>
      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {s.label}
    </span>
  );
}

function ActionBtn({ label, primary, onClick }: { label: string; primary?: boolean; onClick?: () => void }) {
  const [hov, setHov] = useState(false);
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        background: primary ? (hov ? T.soft : T.violet) : (hov ? T.powder : "transparent"),
        color: primary ? T.white : (hov ? T.violet : T.slate),
        border: `1px solid ${primary ? (hov ? T.soft : T.violet) : (hov ? T.washed : T.stone)}`,
        borderRadius: "4px", padding: "5px 12px",
        fontSize: "12px", fontWeight: 400, cursor: "pointer",
        transform: pressed ? "scale(0.97)" : "scale(1)",
        transition: "background-color 150ms ease, color 150ms ease, border-color 150ms ease, transform 150ms cubic-bezier(0.23, 1, 0.32, 1)",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th scope="col" style={{
      padding: "10px 16px", textAlign: right ? "right" : "left",
      fontSize: "11px", fontWeight: 600, color: T.ghost,
      letterSpacing: "0.5px", textTransform: "uppercase",
      borderBottom: `1px solid ${T.powder}`,
      background: T.porcelain, whiteSpace: "nowrap",
    }}>
      {children}
    </th>
  );
}

function Td({ children, right, mono }: { children: React.ReactNode; right?: boolean; mono?: boolean }) {
  return (
    <td style={{
      padding: "12px 16px", textAlign: right ? "right" : "left",
      fontSize: "13px", color: T.ink,
      borderBottom: `1px solid ${T.powder}`,
      fontFamily: mono ? "monospace" : "inherit",
      fontVariantNumeric: "tabular-nums",
    }}>
      {children}
    </td>
  );
}

function Card({ children, style, onMouseEnter, onMouseLeave, onClick }: { children: React.ReactNode; style?: React.CSSProperties; onMouseEnter?: React.MouseEventHandler<HTMLDivElement>; onMouseLeave?: React.MouseEventHandler<HTMLDivElement>; onClick?: React.MouseEventHandler<HTMLDivElement> }) {
  return (
    <div onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={{
      background: T.white, borderRadius: "8px",
      border: `1px solid ${T.powder}`,
      boxShadow: "rgba(23, 23, 23, 0.04) 0px 2px 8px 0px",
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
      <div>
        <h1 style={{ fontSize: "20px", fontWeight: 500, color: T.ink, letterSpacing: "-0.015em", margin: 0 }}>{title}</h1>
        {sub && <p style={{ fontSize: "13px", color: T.ghost, margin: "3px 0 0" }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/* ── Animated metric card ── */
function MetricCard({ label, value, sub, accent, delta, icon }: {
  label: string; value: string; sub: string;
  accent?: boolean; delta?: { val: string; positive: boolean };
  icon: React.ReactNode;
}) {
  const [hov, setHov] = useState(false);
  return (
    <Card
      style={{
        padding: "20px",
        border: accent ? `1px solid ${T.washed}` : `1px solid ${T.powder}`,
        transform: hov ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hov
          ? "rgba(83, 58, 253, 0.08) 0px 8px 24px 0px"
          : "rgba(23, 23, 23, 0.04) 0px 2px 8px 0px",
        transition: "transform 220ms cubic-bezier(0.23, 1, 0.32, 1), box-shadow 220ms ease",
        cursor: "default",
        animation: "fadeUp 0.45s cubic-bezier(0.23, 1, 0.32, 1) both",
      }}
    >
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{ height: "100%" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, color: T.ghost, letterSpacing: "0.5px", textTransform: "uppercase", margin: 0 }}>
            {label}
          </p>
          <div style={{
            width: "30px", height: "30px", borderRadius: "7px",
            background: accent ? T.violetBg : T.porcelain,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: accent ? T.violet : T.ghost,
          }}>
            {icon}
          </div>
        </div>
        <p style={{
          fontSize: "28px", fontWeight: 300, color: T.ink,
          letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 6px",
          fontVariantNumeric: "tabular-nums",
        }}>
          {value}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <p style={{ fontSize: "12px", color: T.ghost, margin: 0 }}>{sub}</p>
          {delta && (
            <span style={{
              fontSize: "11px", fontWeight: 600,
              color: delta.positive ? T.green : T.orange,
              background: delta.positive ? T.greenBg : T.orangeBg,
              borderRadius: "4px", padding: "1px 6px",
            }}>
              {delta.positive ? "↑" : "↓"} {delta.val}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

/* ── Bar chart ── */
function RevenueChart({ orders }: { orders: Order[] }) {
  const data = React.useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    // Get last 6 months
    const last6: { month: string; val: number; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      let m = now.getMonth() - i;
      if (m < 0) m += 12;
      last6.push({ month: months[m], val: 0, count: 0 });
    }
    
    orders.forEach(o => {
      const d = new Date(o.date);
      if (isNaN(d.getTime())) return;
      const mName = months[d.getMonth()];
      const entry = last6.find(x => x.month === mName);
      if (entry) {
        entry.val += o.amount;
        entry.count += 1;
      }
    });
    return last6;
  }, [orders]);

  const max = Math.max(...data.map(d => d.val), 1000);
  const [hovered, setHovered] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 100); }, []);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "120px" }}>
        {data.map((d, i) => {
          const pct = (d.val / max) * 100;
          const isHov = hovered === i;
          return (
            <div
              key={d.month}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", height: "100%", cursor: "default" }}
            >
              {/* Tooltip */}
              <div style={{
                fontSize: "11px", fontWeight: 600, color: T.violet,
                background: T.violetBg, borderRadius: "4px", padding: "2px 7px",
                opacity: isHov ? 1 : 0,
                transform: isHov ? "translateY(0) scale(1)" : "translateY(4px) scale(0.95)",
                transition: "opacity 160ms ease, transform 160ms cubic-bezier(0.23,1,0.32,1)",
                whiteSpace: "nowrap",
              }}>
                ${(d.val / 1000).toFixed(1)}k
              </div>
              <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
                <div style={{
                  width: "100%",
                  background: isHov
                    ? T.violet
                    : `linear-gradient(to top, ${T.violet} 0%, ${T.soft} 100%)`,
                  borderRadius: "4px 4px 0 0",
                  height: mounted ? `${pct}%` : "0%",
                  opacity: isHov ? 1 : 0.7,
                  transition: `height 600ms cubic-bezier(0.23, 1, 0.32, 1) ${i * 60}ms, opacity 160ms ease, background 160ms ease`,
                  transformOrigin: "bottom",
                  minHeight: "4px",
                }} />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
        {data.map(d => (
          <div key={d.month} style={{ flex: 1, textAlign: "center", fontSize: "11px", color: T.ghost }}>{d.month}</div>
        ))}
      </div>
    </div>
  );
}

/* ── Sparkline ── */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const h = 28, w = 80;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * h;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}



/* ── New Order Modal ── */
function NewOrderModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [company, setCompany] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, "orders"), {
        company,
        contact,
        email,
        phone,
        status: "pending",
        amount: 997,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        createdAt: serverTimestamp(),
      });
      setDone(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(6, 27, 49, 0.5)",
        backdropFilter: "blur(5px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
      }}
    >
      <div style={{
        background: T.white, borderRadius: "10px",
        maxWidth: "460px", width: "100%",
        boxShadow: "rgba(0, 0, 0, 0.2) 0px 24px 64px -12px",
        animation: "fadeUp 0.3s cubic-bezier(0.23, 1, 0.32, 1)",
        overflow: "hidden",
      }}>
        <div style={{ padding: "22px 24px 18px", borderBottom: `1px solid ${T.powder}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: "17px", fontWeight: 500, color: T.ink, margin: 0, letterSpacing: "-0.01em" }}>Create new order</h2>
            <p style={{ fontSize: "13px", color: T.ghost, margin: "3px 0 0" }}>Add a client manually to the pipeline</p>
          </div>
          <button onClick={onClose} style={{ width: "30px", height: "30px", borderRadius: "50%", border: "none", background: T.porcelain, cursor: "pointer", fontSize: "16px", color: T.slate, display: "flex", alignItems: "center", justifyContent: "center", transition: "background 150ms ease" }}
            onMouseEnter={e => e.currentTarget.style.background = T.powder}
            onMouseLeave={e => e.currentTarget.style.background = T.porcelain}
          >×</button>
        </div>
        <div style={{ padding: "22px 24px 24px" }}>
          {done ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px", color: T.green }}><Check size={36} strokeWidth={2} /></div>
              <p style={{ fontSize: "16px", fontWeight: 500, color: T.ink, marginBottom: "6px" }}>Order created</p>
              <p style={{ fontSize: "13px", color: T.ghost, marginBottom: "20px" }}>The client will receive a confirmation email.</p>
              <ActionBtn label="Close" onClick={onClose} />
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {[
                { label: "Company name", placeholder: "Acme Corp", type: "text", val: company, set: setCompany, req: true },
                { label: "Contact name", placeholder: "Alex Johnson", type: "text", val: contact, set: setContact, req: true },
                { label: "Email address", placeholder: "alex@acmecorp.com", type: "email", val: email, set: setEmail, req: true },
                { label: "Phone (optional)", placeholder: "+1 555 000 0000", type: "tel", val: phone, set: setPhone, req: false },
              ].map(f => (
                <div key={f.label}>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: T.ghost, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "6px" }}>
                    {f.label}
                  </label>
                  <input
                    type={f.type} placeholder={f.placeholder} required={f.req} value={f.val} onChange={e => f.set(e.target.value)}
                    style={{
                      width: "100%", padding: "9px 12px", boxSizing: "border-box",
                      border: `1.5px solid ${T.stone}`, borderRadius: "5px",
                      fontSize: "13px", color: T.ink, background: T.white,
                      outline: "none", fontFamily: "inherit",
                      transition: "border-color 160ms ease",
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = T.violet}
                    onBlur={e => e.currentTarget.style.borderColor = T.stone}
                  />
                </div>
              ))}
              <button
                type="submit"
                style={{
                  marginTop: "6px", width: "100%", padding: "10px",
                  background: T.violet, color: T.white, border: "none",
                  borderRadius: "5px", fontSize: "14px", fontWeight: 500,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  transition: "background 160ms ease, transform 160ms cubic-bezier(0.23,1,0.32,1)",
                }}
                onMouseEnter={e => e.currentTarget.style.background = T.soft}
                onMouseLeave={e => e.currentTarget.style.background = T.violet}
                onMouseDown={e => e.currentTarget.style.transform = "scale(0.98)"}
                onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
              >
                {loading ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" style={{ animation: "spinSlow 0.8s linear infinite" }}>
                    <circle cx="8" cy="8" r="6" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                    <path d="M8 2 A6 6 0 0 1 14 8" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                ) : null}
                {loading ? "Creating…" : "Create order"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── CSV export ── */
export interface OrderRow {
  id: string;
  company: string;
  contact: string;
  email: string;
  phone?: string;
  status: "pending" | "processing" | "completed";
  amount: number;
  date: string;
}

/* ── CSV export ── */
function exportCSV(orders: Order[]) {
  const headers = ["Order ID", "Company", "Contact", "Email", "Status", "Date", "Amount"];
  const rows = orders.map(o => [o.id, o.company, o.contact, o.email, o.status, o.date, `$${o.amount}`]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "orders.csv"; a.click();
  URL.revokeObjectURL(url);
}

/* ── Order detail drawer ── */
function OrderDrawer({ order, onClose, audits }: { order: Order | null; onClose: () => void; audits: AuditReport[] }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let t: NodeJS.Timeout;
    if (order) {
      t = setTimeout(() => setVisible(true), 10);
    } else {
      t = setTimeout(() => setVisible(false), 0);
    }
    return () => clearTimeout(t);
  }, [order]);

  useEffect(() => {
    if (!order) return;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [order, onClose]);

  if (!order) return null;

  const assessment = audits.find(a => a.orderId === order.id || a.id === order.id);

  const timeline: { label: string; date: string; done: boolean }[] = [
    { label: "Order received",      date: order.date,          done: true },
    { label: "Intake form sent",    date: order.date,          done: order.status !== "pending" },
    { label: "Assessment started",  date: formatDateShort(assessment?.createdAt, "—"), done: !!assessment },
    { label: "Findings call",       date: formatDateShort(assessment?.createdAt, "—"), done: order.status === "completed" },
    { label: "Report delivered",    date: formatDateShort(assessment?.createdAt, "—"), done: !!assessment },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", justifyContent: "flex-end" }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute", inset: 0,
          background: "rgba(6,27,49,0.4)", backdropFilter: "blur(3px)",
          opacity: visible ? 1 : 0, transition: "opacity 280ms ease",
        }}
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`order-drawer-title-${order.id}`}
        style={{
          position: "relative", width: "100%", maxWidth: "480px", height: "100%",
          background: T.white, zIndex: 1,
          boxShadow: "-8px 0 40px rgba(0,0,0,0.12)",
          display: "flex", flexDirection: "column",
          transform: visible ? "translateX(0)" : "translateX(100%)",
          transition: "transform 320ms cubic-bezier(0.23,1,0.32,1)",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.powder}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: "11px", color: T.ghost, fontWeight: 600, letterSpacing: "0.5px", marginBottom: "4px" }}>ORDER #{order.id}</div>
            <h2 id={`order-drawer-title-${order.id}`} style={{ fontSize: "18px", fontWeight: 500, color: T.ink, margin: 0, letterSpacing: "-0.01em" }}>{order.company}</h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <StatusBadge status={order.status} />
            <button
              onClick={onClose}
              aria-label="Close order details"
              style={{
                minWidth: "44px", minHeight: "44px", width: "44px", height: "44px",
                borderRadius: "50%", border: `1px solid ${T.powder}`, background: "transparent",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                color: T.ghost, fontSize: "18px", transition: "background-color 150ms ease, color 150ms ease"
              }}
              onMouseEnter={e => e.currentTarget.style.background = T.porcelain as string}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >×</button>
          </div>
        </div>

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Client info */}
          <Card style={{ padding: "16px" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, color: T.ghost, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "12px" }}>Client</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[
                { label: "Contact", value: order.contact },
                { label: "Email",   value: order.email },
                { label: "Date",    value: order.date },
                { label: "Amount",  value: `$${order.amount}` },
              ].map(row => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "13px", color: T.ghost }}>{row.label}</span>
                  <span style={{ fontSize: "13px", color: T.ink, fontWeight: 500 }}>{row.value}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Timeline */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: T.ghost, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "14px" }}>Progress</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {timeline.map((step, i) => (
                <div key={step.label} style={{ display: "flex", gap: "12px" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{
                      width: "22px", height: "22px", borderRadius: "50%", flexShrink: 0,
                      background: step.done ? T.violet : T.porcelain,
                      border: `2px solid ${step.done ? T.violet : T.stone}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 200ms ease",
                    }}>
                      {step.done && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    {i < timeline.length - 1 && (
                      <div style={{ width: "2px", flex: 1, minHeight: "20px", background: step.done ? T.violet : T.powder, margin: "2px 0", opacity: 0.4 }} />
                    )}
                  </div>
                  <div style={{ paddingBottom: i < timeline.length - 1 ? "16px" : "0" }}>
                    <div style={{ fontSize: "13px", fontWeight: step.done ? 500 : 400, color: step.done ? T.ink : T.ghost }}>{step.label}</div>
                    <div style={{ fontSize: "11px", color: T.ghost, marginTop: "1px" }}>{step.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Assessment result if available */}
          {assessment && (
            <Card style={{ padding: "16px", background: T.porcelain }}>
              <div style={{ fontSize: "11px", fontWeight: 600, color: T.ghost, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "12px" }}>Assessment</div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
                <div>
                  <div style={{ fontSize: "11px", color: T.ghost, marginBottom: "2px" }}>Score</div>
                  <div style={{ fontSize: "15px", fontWeight: 500, color: T.ink }}>{assessment?.overallScore ?? "—"}</div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: T.ghost, marginBottom: "2px" }}>Savings found</div>
                  <div style={{ fontSize: "15px", fontWeight: 600, color: T.green }}>{assessment?.totalSavingsEstimate || "TBD"}</div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: T.ghost, marginBottom: "2px" }}>Findings</div>
                  <div style={{ fontSize: "15px", fontWeight: 500, color: T.ink }}>{assessment?.issues?.length ?? "—"}</div>
                </div>
              </div>
            </Card>
          )}

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, color: T.ghost, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "4px" }}>Actions</div>
            {order.status === "completed" && assessment && (
              <button style={{ width: "100%", padding: "10px", background: T.violet, color: "#fff", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 500, cursor: "pointer", transition: "background 150ms ease" }}
                onMouseEnter={e => e.currentTarget.style.background = T.soft as string}
                onMouseLeave={e => e.currentTarget.style.background = T.violet as string}
              >Download report PDF</button>
            )}
            {(order.status === "processing" || order.status === "paid") && (
              <button style={{ width: "100%", padding: "10px", background: T.violet, color: "#fff", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
                Schedule findings call
              </button>
            )}
            {order.status === "pending" && (
              <button style={{ width: "100%", padding: "10px", background: "transparent", color: T.violet, border: `1.5px solid ${T.washed}`, borderRadius: "6px", fontSize: "13px", cursor: "pointer" }}>
                Send payment reminder
              </button>
            )}
            <button style={{ width: "100%", padding: "10px", background: "transparent", color: T.slate, border: `1.5px solid ${T.stone}`, borderRadius: "6px", fontSize: "13px", cursor: "pointer" }}>
              Send message to client
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════ */
export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [tab, setTab] = useState<Tab>("dashboard");
  const [modalOpen, setModalOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [contentKey, setContentKey] = useState(0);
  const [ordersList, setOrdersList] = useState<Order[]>([]);
  const [auditsList, setAuditsList] = useState<AuditReport[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<AuditIssue | null>(null);
  const [issueDrawerOpen, setIssueDrawerOpen] = useState(false);
  const { dark, toggle: toggleDark } = useDarkMode();
  const { toasts, push, dismiss } = useToasts();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  // Live Firestore subscription for real orders
  useEffect(() => {
    if (!user) return; // Only fetch if logged in
    try {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const unsubscribeOrders = onSnapshot(q, snapshot => {
        const liveOrders = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id.slice(0, 6).toUpperCase(),
            company: data.company || "Unknown Company",
            contact: data.contact || "Customer",
            email: data.email || "",
            status: (data.status as Status) || "paid",
            date: formatDateShort(data.createdAt),
            amount: data.amount || 997,
          };
        });
        setOrdersList(liveOrders);
      }, err => {
        console.warn("Firestore live query fallback to initial orders:", err);
      });

      const auditsQ = query(collection(db, "audits"), orderBy("createdAt", "desc"));
      const unsubscribeAudits = onSnapshot(auditsQ, snapshot => {
        const rawAudits = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditReport));
        setAuditsList(rawAudits);
      }, err => {
        console.warn("Firestore live query fallback to initial audits:", err);
      });

      return () => {
        unsubscribeOrders();
        unsubscribeAudits();
      };
    } catch {
      // Fallback
    }
  }, [user]);

  function switchTab(t: Tab) {
    setTab(t);
    setContentKey(k => k + 1);
  }

  const sparklineData = React.useMemo(() => {
    const now = new Date();
    const last6 = Array(6).fill(0);
    ordersList.forEach(o => {
      const d = new Date(o.date);
      if (isNaN(d.getTime())) return;
      const monthDiff = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
      if (monthDiff >= 0 && monthDiff < 6) {
        last6[5 - monthDiff] += o.amount;
      }
    });
    return last6;
  }, [ordersList]);

  // Derive display lists from raw audits + orders
  const assessmentsList = React.useMemo<Assessment[]>(() => {
    return auditsList.map(audit => {
      const order = ordersList.find(o => o.id === audit.orderId);
      const company = audit.company && audit.company !== "Unknown Company" ? audit.company : (order?.company || "Unknown Company");
      const contact = audit.contact && audit.contact !== "Customer" ? audit.contact : (order?.contact || "Customer");
      return {
        id: audit.id?.slice(0, 6).toUpperCase() || "",
        company,
        contact,
        date: formatDateShort(audit.createdAt),
        score: audit.overallScore || 0,
        savings: audit.totalSavingsEstimate || "TBD",
        status: "completed" as Status,
      };
    });
  }, [auditsList, ordersList]);

  const reportsList = React.useMemo<Report[]>(() => {
    return auditsList.map(audit => {
      const order = ordersList.find(o => o.id === audit.orderId);
      const company = audit.company && audit.company !== "Unknown Company" ? audit.company : (order?.company || "Unknown Company");
      const contact = audit.contact && audit.contact !== "Customer" ? audit.contact : (order?.contact || "Customer");
      return {
        id: audit.id?.slice(0, 6).toUpperCase() || "",
        fullId: audit.id || "",
        company,
        contact,
        generated: formatDateShort(audit.createdAt),
        findings: audit.issues ? audit.issues.length : 0,
        topSaving: audit.totalSavingsEstimate || "TBD",
      };
    });
  }, [auditsList, ordersList]);

  if (authLoading) return <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: T.washed }}><Loader2 className="animate-spin" color={T.violet} /></div>;
  if (!user) return <LoginScreen />;

  const filteredOrders = ordersList.filter(o =>
    o.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalOrders = ordersList.length;
  const completedOrders = ordersList.filter(o => o.status === "completed").length;
  const processingOrders = ordersList.filter(o => o.status === "processing").length;
  const pendingOrders = ordersList.filter(o => o.status === "pending").length;
  const totalRevenue = ordersList.reduce((sum, o) => sum + o.amount, 0);
  const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;

  const formatCurrency = (val: number) => "$" + val.toLocaleString("en-US");

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
        <aside style={{
          width: sidebarCollapsed ? "56px" : "224px",
          background: T.white,
          borderRight: `1px solid ${T.powder}`,
          display: "flex", flexDirection: "column",
          flexShrink: 0,
          transition: "width 260ms cubic-bezier(0.23, 1, 0.32, 1)",
          overflow: "hidden",
          position: "relative",
        }}>
          {/* Logo */}
          <div style={{
            height: "56px", display: "flex", alignItems: "center",
            padding: sidebarCollapsed ? "0 16px" : "0 20px",
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
                <svg width="13" height="12" viewBox="0 0 14 14" fill="none">
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
          <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: "1px", overflowY: "auto" }}>
            {!sidebarCollapsed && (
              <p style={{
                fontSize: "10px", fontWeight: 600, color: T.ghost,
                letterSpacing: "0.06em", padding: "4px 10px 8px",
                margin: 0, textTransform: "uppercase",
              }}>Navigation</p>
            )}
            {NAV.map(item => {
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => switchTab(item.id)}
                  title={sidebarCollapsed ? item.label : undefined}
                  aria-current={active ? "page" : undefined}
                  style={{
                    display: "flex", alignItems: "center",
                    gap: "9px",
                    padding: sidebarCollapsed ? "10px 0" : "9px 10px",
                    borderRadius: "6px", border: "none",
                    cursor: "pointer",
                    justifyContent: sidebarCollapsed ? "center" : "flex-start",
                    background: active ? T.violetBg : "transparent",
                    color: active ? T.violet : T.slate,
                    transition: "background 130ms ease, color 130ms ease",
                    width: "100%", position: "relative",
                    boxShadow: active ? `inset 3px 0 0 ${T.violet}` : "none",
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = T.porcelain; e.currentTarget.style.color = T.ink; } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.slate; } }}
                >
                  <span style={{ flexShrink: 0, display: "flex", opacity: active ? 1 : 0.7 }}>{item.icon}</span>
                  {!sidebarCollapsed && (
                    <span style={{
                      fontSize: "13px", fontWeight: active ? 500 : 400,
                      letterSpacing: "-0.005em", whiteSpace: "nowrap",
                      animation: "slideIn 0.18s ease",
                    }}>
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom: collapse toggle + user */}
          <div style={{ borderTop: `1px solid ${T.powder}`, padding: "12px 8px", display: "flex", flexDirection: "column", gap: "4px" }}>
            {/* Collapse toggle */}
            <button
              onClick={() => setSidebarCollapsed(c => !c)}
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
              title={sidebarCollapsed ? "Expand" : "Collapse"}
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0, transform: sidebarCollapsed ? "rotate(180deg)" : "none", transition: "transform 260ms cubic-bezier(0.23,1,0.32,1)" }}>
                <path d="M5 3L9 7.5 5 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 3v9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              {!sidebarCollapsed && (
                <span style={{ fontSize: "13px", animation: "slideIn 0.18s ease" }}>Collapse</span>
              )}
            </button>

            {/* User */}
            <div style={{
              display: "flex", alignItems: "center", gap: "9px",
              padding: sidebarCollapsed ? "9px 0" : "9px 10px",
              borderRadius: "6px", justifyContent: sidebarCollapsed ? "center" : "flex-start",
            }}>
              <div style={{
                width: "26px", height: "26px", borderRadius: "50%",
                background: `linear-gradient(135deg, #533afd 0%, #8087ff 100%)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "11px", fontWeight: 700, color: "#fff", flexShrink: 0,
              }}>{user?.email ? user.email.charAt(0).toUpperCase() : "A"}</div>
              {!sidebarCollapsed && (
                <div style={{ animation: "slideIn 0.18s ease", overflow: "hidden", minWidth: 0 }}>
                  <p style={{ fontSize: "13px", fontWeight: 500, color: T.ink, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.email || "Admin User"}</p>
                  <p style={{ fontSize: "11px", color: T.ghost, margin: 0 }}>Admin</p>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* ── Main ── */}
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
            {/* Page title */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
              <h1 style={{
                fontSize: "15px", fontWeight: 600, color: T.ink,
                letterSpacing: "-0.02em", margin: 0, lineHeight: 1.2,
              }}>
                {NAV.find(n => n.id === tab)?.label}
              </h1>
              <p style={{ fontSize: "11px", color: T.ghost, margin: 0 }}>
                {tab === "dashboard" && "Overview & key metrics"}
                {tab === "orders" && `${ordersList.length} total orders`}
                {tab === "assessments" && `${assessmentsList.length} assessments`}
                {tab === "reports" && `${reportsList.length} reports generated`}
                {tab === "settings" && "Account & integrations"}
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {/* Search */}
              {(tab === "orders" || tab === "assessments") && (
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ position: "absolute", left: "10px", color: T.ghost, pointerEvents: "none" }}>
                    <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.4" />
                    <path d="M9 9l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                  <input
                    placeholder="Search…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{
                      padding: "7px 12px 7px 30px",
                      border: `1.5px solid ${T.stone}`,
                      borderRadius: "6px", fontSize: "13px",
                      color: T.ink, background: T.porcelain,
                      outline: "none", width: "188px",
                      transition: "border-color 160ms ease, width 220ms ease",
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = T.violet; e.currentTarget.style.width = "224px"; }}
                    onBlur={e => { e.currentTarget.style.borderColor = T.stone; e.currentTarget.style.width = "188px"; }}
                  />
                </div>
              )}

              {/* Divider */}
              <div style={{ width: "1px", height: "20px", background: T.powder, margin: "0 2px" }} />

              {/* Notification bell */}
              <button
                style={{
                  width: "32px", height: "32px", borderRadius: "6px",
                  border: "none", background: "transparent",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  color: T.ghost, position: "relative",
                  transition: "background 130ms ease, color 130ms ease",
                }}
                title="Notifications"
                onMouseEnter={e => { e.currentTarget.style.background = T.porcelain; e.currentTarget.style.color = T.ink; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.ghost; }}
              >
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path d="M7.5 1.5C5.01 1.5 3 3.51 3 6v4l-1.5 1.5h12L12 10V6c0-2.49-2.01-4.5-4.5-4.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                  <path d="M6 12.5a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.3" />
                </svg>
                <span style={{
                  position: "absolute", top: "5px", right: "5px",
                  width: "6px", height: "6px", borderRadius: "50%",
                  background: "#ff6118", border: `1.5px solid ${T.white}`,
                }} />
              </button>

              {/* Dark toggle */}
              <button
                onClick={toggleDark}
                title={dark ? "Light mode" : "Dark mode"}
                style={{
                  width: "32px", height: "32px", borderRadius: "6px",
                  border: "none", background: "transparent",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  color: T.ghost, transition: "background 130ms ease, color 130ms ease",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = T.porcelain; e.currentTarget.style.color = T.ink; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.ghost; }}
              >
                {dark
                  ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.4"/><path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.93 2.93l1.06 1.06M10.01 10.01l1.06 1.06M2.93 11.07l1.06-1.06M10.01 3.99l1.06-1.06" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                  : <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M11.5 8.5A5.5 5.5 0 014.5 1.5a5.5 5.5 0 100 10 5.5 5.5 0 007-3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>
                }
              </button>

              {/* Divider */}
              <div style={{ width: "1px", height: "20px", background: T.powder, margin: "0 2px" }} />

              {/* View site — DESIGN.md outlined button */}
              <Link href="/" style={{
                display: "flex", alignItems: "center", gap: "6px",
                fontSize: "13px", fontWeight: 400, color: T.violet,
                textDecoration: "none",
                padding: "6px 14px", borderRadius: "4px",
                border: `1.5px solid ${T.washed}`,
                background: "transparent",
                transition: "background 130ms ease, border-color 130ms ease",
                whiteSpace: "nowrap",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = T.violetBg; e.currentTarget.style.borderColor = T.violet; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = T.washed; }}
              >
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M1.5 5.5h8M6 2l3.5 3.5L6 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                View site
              </Link>
            </div>
          </header>

          {/* ── Content ── */}
          <main
            key={contentKey}
            style={{
              flex: 1, overflowY: "auto", padding: "28px",
              animation: "fadeUp 0.3s cubic-bezier(0.23, 1, 0.32, 1)",
            }}
          >

            {/* ── DASHBOARD ── */}
            {tab === "dashboard" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

              {/* Metrics grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "12px" }}>
                <MetricCard
                  label="Total Revenue" value={formatCurrency(totalRevenue)}
                  sub={`${assessmentsList.length} assessments`}
                  accent
                  delta={{ val: "24%", positive: true }}
                  icon={<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M10 4.5C10 3.12 8.66 2 7 2S4 3.12 4 4.5 5.34 7 7 7s3 1.12 3 2.5S8.66 12 7 12s-3-1.12-3-2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>}
                />
                <MetricCard
                  label="Total Orders" value={totalOrders.toString()}
                  sub={`${pendingOrders} pending completion`}
                  delta={{ val: "2 this week", positive: true }}
                  icon={<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 3h11M2 7.5h11M2 12h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>}
                />
                <MetricCard
                  label="Completion Rate" value={`${completionRate}%`}
                  sub={`${completedOrders} of ${totalOrders} completed`}
                  delta={{ val: "5%", positive: true }}
                  icon={<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.4" /><path d="M4.5 7l2 2 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                />

              </div>

              {/* Charts row */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>

                {/* Revenue chart */}
                <Card style={{ padding: "22px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <div>
                      <h2 style={{ fontSize: "15px", fontWeight: 500, color: T.ink, margin: 0, letterSpacing: "-0.01em" }}>Revenue trend</h2>
                      <p style={{ fontSize: "12px", color: T.ghost, margin: "2px 0 0" }}>Last 6 months</p>
                    </div>
                    <div style={{ fontSize: "12px", color: T.ghost, background: T.porcelain, borderRadius: "5px", padding: "4px 10px" }}>
                      Monthly
                    </div>
                  </div>
                  <RevenueChart orders={ordersList} />
                </Card>

                {/* Status distribution */}
                <Card style={{ padding: "22px" }}>
                  <h2 style={{ fontSize: "15px", fontWeight: 500, color: T.ink, margin: "0 0 18px", letterSpacing: "-0.01em" }}>Order status</h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {[
                      { label: "Completed",  value: completedOrders, total: Math.max(totalOrders, 1), color: T.green },
                      { label: "Processing", value: processingOrders, total: Math.max(totalOrders, 1), color: T.violet },
                      { label: "Pending",    value: pendingOrders, total: Math.max(totalOrders, 1), color: T.orange },
                    ].map(s => (
                        <div key={s.label}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                            <span style={{ fontSize: "12px", color: T.slate }}>{s.label}</span>
                            <span style={{ fontSize: "12px", fontWeight: 600, color: T.ink, fontVariantNumeric: "tabular-nums" }}>{s.value}</span>
                          </div>
                          <div style={{ height: "5px", background: T.powder, borderRadius: "100px", overflow: "hidden" }}>
                            <div style={{
                              height: "100%", borderRadius: "100px",
                              background: s.color,
                              width: `${(s.value / s.total) * 100}%`,
                              transition: "width 800ms cubic-bezier(0.23, 1, 0.32, 1)",
                            }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: "22px", paddingTop: "16px", borderTop: `1px solid ${T.powder}` }}>
                      <h3 style={{ fontSize: "12px", fontWeight: 600, color: T.ghost, letterSpacing: "0.4px", textTransform: "uppercase", margin: "0 0 12px" }}>Monthly trend</h3>
                      <Sparkline data={sparklineData} color={T.violet} />
                    </div>
                  </Card>
                </div>

                {/* Recent orders preview */}
                <div style={{ marginTop: "12px" }}>
                  <Card style={{ padding: "22px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                      <h2 style={{ fontSize: "15px", fontWeight: 500, color: T.ink, margin: 0, letterSpacing: "-0.01em" }}>Recent orders</h2>
                      <button
                        onClick={() => switchTab("orders")}
                        style={{ fontSize: "12px", color: T.violet, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                      >
                        View all →
                      </button>
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          <Th>Company</Th>
                          <Th>Status</Th>
                          <Th right>Amount</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {ordersList.slice(0, 5).map(o => (
                          <tr key={o.id}
                            style={{ transition: "background 120ms ease", cursor: "default" }}
                            onMouseEnter={e => (e.currentTarget.style.background = T.porcelain)}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                          >
                            <Td>
                              <div>
                                <div style={{ fontSize: "13px", color: T.ink, fontWeight: 500 }}>{o.company}</div>
                                <div style={{ fontSize: "11px", color: T.ghost }}>{o.date}</div>
                              </div>
                            </Td>
                            <Td><StatusBadge status={o.status} /></Td>
                            <Td right><span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>${o.amount}</span></Td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Card>
                </div>
              </div>
            )}

            {/* ── ORDERS ── */}
            {tab === "orders" && (
              <div>
                <SectionHeader
                  title="All orders"
                  sub={`${filteredOrders.length} of ${ordersList.length} orders`}
                  action={
                    <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => exportCSV(filteredOrders)}
                      style={{
                        display: "flex", alignItems: "center", gap: "6px",
                        background: "transparent", color: T.slate,
                        border: `1.5px solid ${T.stone}`, borderRadius: "6px",
                        padding: "9px 14px", fontSize: "13px",
                        cursor: "pointer", transition: "all 150ms ease",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = T.washed as string; e.currentTarget.style.color = T.violet as string; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = T.stone as string; e.currentTarget.style.color = T.slate as string; }}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v7M3 5l3 3 3-3M1 10h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Export CSV
                    </button>
                    <button
                      onClick={() => setModalOpen(true)}
                      style={{
                        display: "flex", alignItems: "center", gap: "7px",
                        background: T.violet, color: T.white,
                        border: "none", borderRadius: "6px",
                        padding: "9px 16px", fontSize: "13px", fontWeight: 500,
                        cursor: "pointer", transition: "background 150ms ease, transform 150ms ease",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = T.soft as string}
                      onMouseLeave={e => e.currentTarget.style.background = T.violet as string}
                      onMouseDown={e => e.currentTarget.style.transform = "scale(0.97)"}
                      onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="white" strokeWidth="1.8" strokeLinecap="round" /></svg>
                      New order
                    </button>
                    </div>
                  }
                />

                <Card>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
                      <thead>
                        <tr>
                          <Th>Order ID</Th>
                          <Th>Company</Th>
                          <Th>Contact</Th>
                          <Th>Status</Th>
                          <Th>Date</Th>
                          <Th right>Amount</Th>
                          <Th>Actions</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map((o, i) => (
                          <tr
                            key={o.id}
                            onClick={() => setSelectedOrder(o)}
                            style={{
                              transition: "background 120ms ease",
                              animation: `fadeUp 0.3s cubic-bezier(0.23, 1, 0.32, 1) ${i * 40}ms both`,
                              cursor: "pointer",
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = T.porcelain as string}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                          >
                            <Td mono><span style={{ color: T.ghost }}>#{o.id}</span></Td>
                            <Td><span style={{ fontWeight: 500 }}>{o.company}</span></Td>
                            <Td>
                              <div>
                                <div style={{ fontSize: "13px", color: T.ink }}>{o.contact}</div>
                                <div style={{ fontSize: "11px", color: T.ghost }}>{o.email}</div>
                              </div>
                            </Td>
                            <Td><StatusBadge status={o.status} /></Td>
                            <Td><span style={{ color: T.ghost }}>{o.date}</span></Td>
                            <Td right><span style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>${o.amount}</span></Td>
                            <Td>
                              <div style={{ display: "flex", gap: "6px", flexWrap: "nowrap" }} onClick={e => e.stopPropagation()}>
                                <ActionBtn label="Open" onClick={() => setSelectedOrder(o)} />
                                {(o.status === "processing" || o.status === "paid") && <ActionBtn label="Schedule call" primary />}
                                {o.status === "pending" && <ActionBtn label="Remind" />}
                              </div>
                            </Td>
                          </tr>
                        ))}
                        {filteredOrders.length === 0 && (
                          <tr>
                            <td colSpan={7} style={{ padding: "48px 16px", textAlign: "center" }}>
                              <p style={{ fontSize: "14px", color: T.ghost, margin: 0 }}>No orders match your search.</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {/* ── ASSESSMENTS ── */}
            {tab === "assessments" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <SectionHeader title="Run UX Audit" sub="Enter a URL to run a real AI-powered audit" />

                {/* Audit runner + results split */}
                <div style={{ display: "grid", gridTemplateColumns: auditReport ? "340px 1fr" : "340px", gap: "20px", alignItems: "start" }}>
                  {/* Left: runner form */}
                  <div style={{ minWidth: 0 }}>
                    <AuditRunner
                      ordersList={ordersList}
                      onAuditComplete={(url, report) => {
                        setAuditReport(report);
                        push({ message: "Audit complete", sub: `${url} — ${report.issues.length} findings`, icon: <Check size={14} />, color: "#81b81a" });
                      }}
                    />
                  </div>

                  {/* Right: results (shown after audit) */}
                  {auditReport && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px", animation: "fadeUp 0.4s cubic-bezier(0.23,1,0.32,1) both", minWidth: 0 }}>
                      {/* Score + category grid */}
                      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "16px", alignItems: "stretch" }}>
                        <div style={{ width: "220px" }}>
                          <AuraScore score={auditReport.overallScore} />
                        </div>
                        <BentoGrid scores={auditReport.categoryScores} />
                      </div>

                      {/* Summary */}
                      <Card style={{ padding: "18px 22px" }}>
                        <p style={{ fontSize: "11px", fontWeight: 700, color: T.ghost, letterSpacing: "0.4px", marginBottom: "8px" }}>SUMMARY</p>
                        <p style={{ fontSize: "14px", color: T.slate, lineHeight: 1.65, margin: 0 }}>{auditReport.summary}</p>
                      </Card>

                      {/* Issues list */}
                      <Card style={{ padding: 0, overflow: "hidden" }}>
                        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.powder}` }}>
                          <p style={{ fontSize: "11px", fontWeight: 700, color: T.ghost, letterSpacing: "0.4px", margin: 0 }}>
                            FINDINGS — {auditReport.issues.length} ISSUES
                          </p>
                        </div>
                        {auditReport.issues.map((issue, i) => {
                          const SEV_DOT: Record<string, string> = {
                            critical: "#e16540", warning: "#d97706", optimized: "#47d096", info: "#50617a",
                          };
                          const SEV_BG: Record<string, string> = {
                            critical: "#ffd7f0", warning: "#fef3c7", optimized: "#b7efb230", info: "#e2ddfd",
                          };
                          return (
                            <div
                              key={issue.id}
                              onClick={() => { setSelectedIssue(issue); setIssueDrawerOpen(true); }}
                              style={{
                                padding: "14px 20px",
                                borderBottom: i < auditReport.issues.length - 1 ? `1px solid ${T.powder}` : "none",
                                display: "flex", alignItems: "center", gap: "12px",
                                cursor: "pointer", transition: "background 120ms ease",
                              }}
                              onMouseEnter={e => (e.currentTarget.style.background = T.porcelain)}
                              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                            >
                              <span style={{
                                padding: "2px 8px", borderRadius: "100px", fontSize: "10px", fontWeight: 700,
                                background: SEV_BG[issue.severity] ?? T.powder, color: T.ink,
                                display: "flex", alignItems: "center", gap: "4px", flexShrink: 0, whiteSpace: "nowrap",
                              }}>
                                <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: SEV_DOT[issue.severity] ?? T.ghost }} />
                                {issue.severity.toUpperCase()}
                              </span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: "13px", fontWeight: 500, color: T.ink, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{issue.title}</p>
                                <p style={{ fontSize: "11px", color: T.ghost, margin: "1px 0 0" }}>{issue.category}</p>
                              </div>
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                                <path d="M5 2.5l4.5 4.5L5 11.5" stroke={T.stone} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          );
                        })}
                      </Card>

                      {/* Reset button */}
                      <button
                        onClick={() => setAuditReport(null)}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: T.ghost, textAlign: "left", padding: 0 }}
                      >
                        ← Run another audit
                      </button>
                    </div>
                  )}
                </div>

                {/* Past assessments table */}
                <div>
                  <SectionHeader title="Past assessments" sub="All completed and in-progress assessment sessions" />
                  <Card>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "650px" }}>
                        <thead>
                          <tr>
                            <Th>Order</Th>
                            <Th>Company</Th>
                            <Th>Contact</Th>
                            <Th>Date</Th>
                            <Th>Score</Th>
                            <Th right>Savings found</Th>
                            <Th>Status</Th>
                            <Th>Actions</Th>
                          </tr>
                        </thead>
                        <tbody>
                          {assessmentsList.map((a, i) => (
                            <tr
                              key={a.id}
                              style={{
                                transition: "background 120ms ease",
                                animation: `fadeUp 0.3s cubic-bezier(0.23, 1, 0.32, 1) ${i * 40}ms both`,
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = T.porcelain}
                              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                            >
                              <Td mono><span style={{ color: T.ghost }}>#{a.id}</span></Td>
                              <Td><span style={{ fontWeight: 500 }}>{a.company}</span></Td>
                              <Td><span style={{ color: T.slate }}>{a.contact}</span></Td>
                              <Td><span style={{ color: T.ghost }}>{a.date}</span></Td>
                              <Td><span style={{ color: T.ink, fontWeight: 500 }}>{a.score}/100</span></Td>
                              <Td right>
                                <span style={{
                                  fontWeight: 600,
                                  color: a.savings === "TBD" ? T.ghost : T.green,
                                  fontVariantNumeric: "tabular-nums",
                                }}>
                                  {a.savings}
                                </span>
                              </Td>
                              <Td><StatusBadge status={a.status} /></Td>
                              <Td><ActionBtn label="View transcript" /></Td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>

                {/* Issue detail drawer */}
                <IssueDrawer
                  issue={selectedIssue}
                  isOpen={issueDrawerOpen}
                  onClose={() => setIssueDrawerOpen(false)}
                />
              </div>
            )}

            {/* ── REPORTS ── */}
            {tab === "reports" && (
              <div>
                <SectionHeader title="Generated reports" sub={`${reportsList.length} reports delivered`} />
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {reportsList.map((r, i) => (
                    <Card
                      key={r.id}
                      style={{
                        padding: "18px 22px",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        flexWrap: "wrap", gap: "16px",
                        animation: `fadeUp 0.3s cubic-bezier(0.23, 1, 0.32, 1) ${i * 50}ms both`,
                        transition: "box-shadow 200ms ease, transform 200ms ease",
                        cursor: "default",
                      }}
                      onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                        e.currentTarget.style.boxShadow = "rgba(83, 58, 253, 0.08) 0px 6px 20px 0px";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }}
                      onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                        e.currentTarget.style.boxShadow = "rgba(23, 23, 23, 0.04) 0px 2px 8px 0px";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <div style={{ width: "38px", height: "38px", borderRadius: "9px", background: T.violetBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M3 2h7.5L13 4.5V14H3V2z" stroke={T.violet} strokeWidth="1.4" strokeLinejoin="round" />
                            <path d="M10 2v3h3" stroke={T.violet} strokeWidth="1.4" strokeLinejoin="round" />
                            <path d="M5.5 8.5h5M5.5 11h3" stroke={T.violet} strokeWidth="1.4" strokeLinecap="round" />
                          </svg>
                        </div>
                        <div>
                          <p style={{ fontSize: "14px", fontWeight: 500, color: T.ink, margin: 0 }}>{r.company}</p>
                          <p style={{ fontSize: "12px", color: T.ghost, margin: "2px 0 0" }}>{r.contact} · Generated {r.generated}</p>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
                        <div style={{ textAlign: "center" }}>
                          <p style={{ fontSize: "11px", color: T.ghost, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.4px" }}>Findings</p>
                          <p style={{ fontSize: "18px", fontWeight: 300, color: T.ink, margin: 0, letterSpacing: "-0.02em" }}>{r.findings}</p>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <p style={{ fontSize: "11px", color: T.ghost, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.4px" }}>Est. Savings</p>
                          <p style={{ fontSize: "18px", fontWeight: 300, color: T.green, margin: 0, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{r.topSaving}</p>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <ActionBtn label="Download PDF" onClick={() => window.open(`/report/${r.fullId}?print=true`, "_blank")} />
                          <ActionBtn label="View" primary onClick={() => window.open(`/report/${r.fullId}`, "_blank")} />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* ── SETTINGS ── */}
            {tab === "settings" && (
              <div style={{ maxWidth: "600px" }}>
                <SectionHeader title="Settings" sub="Manage your business and integration configuration" />
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {[
                    {
                      section: "Business information",
                      desc: "Your public-facing business details",
                      fields: [
                        { label: "Business name",        type: "text",     value: "AI Assessment Services",  placeholder: "" },
                        { label: "Email address",        type: "email",    value: "admin@aiassess.com",      placeholder: "" },
                        { label: "Assessment price ($)", type: "number",   value: "997",                    placeholder: "" },
                      ],
                    },
                    {
                      section: "Integrations",
                      desc: "Connect your third-party services",
                      fields: [
                        { label: "Stripe secret key",    type: "password", value: "", placeholder: "sk_live_…" },
                        { label: "Twilio account SID",   type: "text",     value: "", placeholder: "ACxxxxxxxxxxxxxxxx" },
                        { label: "Anthropic API key",    type: "password", value: "", placeholder: "sk-ant-…" },
                      ],
                    },
                    {
                      section: "Notifications",
                      desc: "Control when you receive alerts",
                      fields: [
                        { label: "Notification email",  type: "email", value: "admin@aiassess.com", placeholder: "" },
                      ],
                    },
                  ].map((group, gi) => (
                    <Card key={group.section} style={{ overflow: "hidden", animation: `fadeUp 0.35s cubic-bezier(0.23, 1, 0.32, 1) ${gi * 80}ms both` }}>
                      <div style={{ padding: "18px 22px 14px", borderBottom: `1px solid ${T.powder}` }}>
                        <h2 style={{ fontSize: "15px", fontWeight: 500, color: T.ink, margin: 0, letterSpacing: "-0.01em" }}>{group.section}</h2>
                        <p style={{ fontSize: "12px", color: T.ghost, margin: "3px 0 0" }}>{group.desc}</p>
                      </div>
                      <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: "14px" }}>
                        {group.fields.map(field => (
                          <div key={field.label}>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: T.ghost, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "7px" }}>
                              {field.label}
                            </label>
                            <input
                              type={field.type}
                              defaultValue={field.value}
                              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}…`}
                              style={{
                                width: "100%", padding: "9px 12px",
                                border: `1.5px solid ${T.stone}`, borderRadius: "5px",
                                fontSize: "13px", color: T.ink, background: T.porcelain,
                                outline: "none", fontFamily: "inherit", boxSizing: "border-box",
                                transition: "border-color 160ms ease, background 160ms ease",
                              }}
                              onFocus={e => { e.currentTarget.style.borderColor = T.violet; e.currentTarget.style.background = T.white; }}
                              onBlur={e => { e.currentTarget.style.borderColor = T.stone; e.currentTarget.style.background = T.porcelain; }}
                            />
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}

                  <div style={{ display: "flex", gap: "10px", paddingBottom: "8px" }}>
                    <button
                      style={{
                        background: T.violet, color: T.white,
                        border: "none", borderRadius: "6px",
                        padding: "10px 20px", fontSize: "13px", fontWeight: 500,
                        cursor: "pointer", transition: "background 150ms ease, transform 150ms ease",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = T.soft}
                      onMouseLeave={e => e.currentTarget.style.background = T.violet}
                      onMouseDown={e => e.currentTarget.style.transform = "scale(0.97)"}
                      onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
                    >
                      Save changes
                    </button>
                    <button
                      style={{
                        background: "transparent", color: T.ghost,
                        border: `1.5px solid ${T.stone}`, borderRadius: "6px",
                        padding: "10px 20px", fontSize: "13px",
                        cursor: "pointer", transition: "all 150ms ease",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = T.slate; e.currentTarget.style.color = T.ink; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = T.stone; e.currentTarget.style.color = T.ghost; }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>

      {/* ── New Order Modal ── */}
      {modalOpen && <NewOrderModal onClose={() => setModalOpen(false)} />}

      {/* ── Order detail drawer ── */}
      <OrderDrawer order={selectedOrder} onClose={() => setSelectedOrder(null)} audits={auditsList} />

      {/* ── Toast stack ── */}
      <ToastStack toasts={toasts} dismiss={dismiss} />
    </>
  );
}
