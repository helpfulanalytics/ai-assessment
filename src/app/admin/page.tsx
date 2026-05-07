"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useDarkMode } from "../../hooks/useDarkMode";

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

/* ── Types ── */
type Tab    = "dashboard" | "orders" | "assessments" | "reports" | "settings";
type Status = "completed" | "processing" | "paid" | "pending";

/* ── Data ── */
const ORDERS: { id: string; company: string; contact: string; email: string; status: Status; date: string; amount: number }[] = [
  { id: "A1B2C3", company: "Acme Inc",         contact: "Sarah Kim",     email: "contact@acme.com",       status: "completed",  date: "Apr 15, 2024", amount: 997 },
  { id: "D4E5F6", company: "Tech Startup Co",  contact: "Marcus Dela",   email: "info@techstartup.com",   status: "completed",  date: "Apr 14, 2024", amount: 997 },
  { id: "G7H8I9", company: "Design Studios",   contact: "Priya Mehta",   email: "hello@designstudios.com",status: "processing", date: "Apr 13, 2024", amount: 997 },
  { id: "J0K1L2", company: "Marketing Agency", contact: "Tom Nguyen",    email: "support@marketing.com",  status: "paid",       date: "Apr 12, 2024", amount: 997 },
  { id: "M3N4O5", company: "Consulting Group", contact: "Elena Brooks",  email: "contact@consulting.com", status: "pending",    date: "Apr 11, 2024", amount: 997 },
  { id: "P6Q7R8", company: "FinTech Labs",      contact: "James Carter",  email: "james@fintechlabs.io",   status: "completed",  date: "Apr 10, 2024", amount: 997 },
  { id: "S9T0U1", company: "GrowthHQ",          contact: "Nadia Okafor",  email: "nadia@growthhq.co",      status: "completed",  date: "Apr 09, 2024", amount: 997 },
];

const ASSESSMENTS = [
  { id: "A1B2C3", company: "Acme Inc",        contact: "Sarah Kim",    date: "Apr 15, 2024", duration: "42 min", savings: "$14,200", status: "completed" as Status },
  { id: "D4E5F6", company: "Tech Startup Co", contact: "Marcus Dela",  date: "Apr 14, 2024", duration: "38 min", savings: "$9,800",  status: "completed" as Status },
  { id: "G7H8I9", company: "Design Studios",  contact: "Priya Mehta",  date: "Apr 13, 2024", duration: "45 min", savings: "TBD",     status: "processing" as Status },
  { id: "P6Q7R8", company: "FinTech Labs",     contact: "James Carter", date: "Apr 10, 2024", duration: "51 min", savings: "$22,100", status: "completed" as Status },
  { id: "S9T0U1", company: "GrowthHQ",         contact: "Nadia Okafor", date: "Apr 09, 2024", duration: "36 min", savings: "$7,650",  status: "completed" as Status },
];

const REPORTS = [
  { id: "A1B2C3", company: "Acme Inc",        contact: "Sarah Kim",    generated: "Apr 15, 2024", findings: 4, topSaving: "$14,200" },
  { id: "D4E5F6", company: "Tech Startup Co", contact: "Marcus Dela",  generated: "Apr 14, 2024", findings: 5, topSaving: "$9,800"  },
  { id: "P6Q7R8", company: "FinTech Labs",     contact: "James Carter", generated: "Apr 10, 2024", findings: 7, topSaving: "$22,100" },
  { id: "S9T0U1", company: "GrowthHQ",         contact: "Nadia Okafor", generated: "Apr 09, 2024", findings: 3, topSaving: "$7,650"  },
];

const REVENUE_DATA = [
  { month: "Jan", val: 2985, orders: 3 },
  { month: "Feb", val: 3992, orders: 4 },
  { month: "Mar", val: 5010, orders: 5 },
  { month: "Apr", val: 4968, orders: 5 },
  { month: "May", val: 3980, orders: 4 },
  { month: "Jun", val: 6951, orders: 7 },
];

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
type Toast = { id: number; message: string; sub: string; icon: string; color: string };

let toastId = 0;
const LIVE_EVENTS: Omit<Toast, "id">[] = [
  { message: "New order received",     sub: "Scale Commerce — $997",            icon: "💳", color: "#533afd" },
  { message: "Assessment completed",   sub: "FinTech Labs — $22,100 identified", icon: "✓",  color: "#81b81a" },
  { message: "Report downloaded",      sub: "Acme Inc — Sarah Kim",             icon: "📄", color: "#50617a" },
  { message: "Findings call booked",   sub: "Design Studios — Apr 18, 2pm",     icon: "📞", color: "#ff6118" },
  { message: "Payment confirmed",      sub: "GrowthHQ — $997",                  icon: "💳", color: "#533afd" },
  { message: "Assessment started",     sub: "Marketing Agency intake received",  icon: "⚡", color: "#8087ff" },
];

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
            style={{ background: "none", border: "none", cursor: "pointer", color: T.ghost, fontSize: "16px", padding: "0 0 0 4px", lineHeight: 1, flexShrink: 0 }}
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
        transition: "all 150ms cubic-bezier(0.23, 1, 0.32, 1)",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th style={{
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
function RevenueChart() {
  const max = Math.max(...REVENUE_DATA.map(d => d.val));
  const [hovered, setHovered] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 100); }, []);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "120px" }}>
        {REVENUE_DATA.map((d, i) => {
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
        {REVENUE_DATA.map(d => (
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

/* ── Activity feed ── */
function ActivityItem({ icon, text, time, color }: { icon: string; text: string; time: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px 0", borderBottom: `1px solid ${T.powder}` }}>
      <div style={{
        width: "28px", height: "28px", borderRadius: "7px",
        background: color + "20", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "13px",
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: "13px", color: T.ink, margin: 0, lineHeight: 1.4 }}>{text}</p>
        <p style={{ fontSize: "11px", color: T.ghost, margin: "2px 0 0" }}>{time}</p>
      </div>
    </div>
  );
}

/* ── New Order Modal ── */
function NewOrderModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); setDone(true); }, 1500);
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
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>✓</div>
              <p style={{ fontSize: "16px", fontWeight: 500, color: T.ink, marginBottom: "6px" }}>Order created</p>
              <p style={{ fontSize: "13px", color: T.ghost, marginBottom: "20px" }}>The client will receive a confirmation email.</p>
              <ActionBtn label="Close" onClick={onClose} />
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {[
                { label: "Company name", placeholder: "Acme Corp", type: "text" },
                { label: "Contact name", placeholder: "Alex Johnson", type: "text" },
                { label: "Email address", placeholder: "alex@acmecorp.com", type: "email" },
                { label: "Phone (optional)", placeholder: "+1 555 000 0000", type: "tel" },
              ].map(f => (
                <div key={f.label}>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: T.ghost, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "6px" }}>
                    {f.label}
                  </label>
                  <input
                    type={f.type} placeholder={f.placeholder}
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
function exportCSV(orders: typeof ORDERS) {
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
type OrderRow = typeof ORDERS[number];

function OrderDrawer({ order, onClose }: { order: OrderRow | null; onClose: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (order) { setTimeout(() => setVisible(true), 10); }
    else { setVisible(false); }
  }, [order]);

  useEffect(() => {
    if (order) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [order]);

  if (!order) return null;

  const statusMap = STATUS_MAP[order.status];
  const assessment = ASSESSMENTS.find(a => a.id === order.id);
  const report = REPORTS.find(r => r.id === order.id);

  const timeline: { label: string; date: string; done: boolean }[] = [
    { label: "Order received",      date: order.date,          done: true },
    { label: "Intake form sent",    date: order.date,          done: order.status !== "pending" },
    { label: "Assessment started",  date: assessment?.date ?? "—", done: !!assessment },
    { label: "Findings call",       date: assessment?.date ?? "—", done: order.status === "completed" },
    { label: "Report delivered",    date: report?.generated ?? "—", done: !!report },
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
      <div style={{
        position: "relative", width: "100%", maxWidth: "480px", height: "100%",
        background: T.white, zIndex: 1,
        boxShadow: "-8px 0 40px rgba(0,0,0,0.12)",
        display: "flex", flexDirection: "column",
        transform: visible ? "translateX(0)" : "translateX(100%)",
        transition: "transform 320ms cubic-bezier(0.23,1,0.32,1)",
        overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.powder}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: "11px", color: T.ghost, fontWeight: 600, letterSpacing: "0.5px", marginBottom: "4px" }}>ORDER #{order.id}</div>
            <h2 style={{ fontSize: "18px", fontWeight: 500, color: T.ink, margin: 0, letterSpacing: "-0.01em" }}>{order.company}</h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <StatusBadge status={order.status} />
            <button onClick={onClose} style={{ width: "30px", height: "30px", borderRadius: "50%", border: `1px solid ${T.powder}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: T.ghost, fontSize: "16px", transition: "background 150ms ease" }}
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
                  <div style={{ fontSize: "11px", color: T.ghost, marginBottom: "2px" }}>Duration</div>
                  <div style={{ fontSize: "15px", fontWeight: 500, color: T.ink }}>{assessment.duration}</div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: T.ghost, marginBottom: "2px" }}>Savings found</div>
                  <div style={{ fontSize: "15px", fontWeight: 600, color: T.green }}>{assessment.savings}</div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: T.ghost, marginBottom: "2px" }}>Findings</div>
                  <div style={{ fontSize: "15px", fontWeight: 500, color: T.ink }}>{report?.findings ?? "—"}</div>
                </div>
              </div>
            </Card>
          )}

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, color: T.ghost, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "4px" }}>Actions</div>
            {order.status === "completed" && report && (
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
  const [tab, setTab] = useState<Tab>("dashboard");
  const [modalOpen, setModalOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [contentKey, setContentKey] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<typeof ORDERS[number] | null>(null);
  const { dark, toggle: toggleDark } = useDarkMode();
  const { toasts, push, dismiss } = useToasts();
  const eventIdx = useRef(0);

  // Simulate live events every 12s
  useEffect(() => {
    const t = setInterval(() => {
      push(LIVE_EVENTS[eventIdx.current % LIVE_EVENTS.length]);
      eventIdx.current++;
    }, 12000);
    // Fire first one after 3s so it's noticeable on load
    const first = setTimeout(() => push(LIVE_EVENTS[0]), 3000);
    return () => { clearInterval(t); clearTimeout(first); };
  }, [push]);

  function switchTab(t: Tab) {
    setTab(t);
    setContentKey(k => k + 1);
  }

  const filteredOrders = ORDERS.filter(o =>
    o.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                <span style={{
                  fontSize: "15px", fontWeight: 600, color: T.ink,
                  letterSpacing: "-0.02em", whiteSpace: "nowrap",
                  animation: "slideIn 0.18s ease",
                }}>AuditAI</span>
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
              }}>J</div>
              {!sidebarCollapsed && (
                <div style={{ animation: "slideIn 0.18s ease", overflow: "hidden", minWidth: 0 }}>
                  <p style={{ fontSize: "13px", fontWeight: 500, color: T.ink, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>John Doe</p>
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
                {tab === "orders" && `${ORDERS.length} total orders`}
                {tab === "assessments" && `${ASSESSMENTS.length} assessments`}
                {tab === "reports" && `${REPORTS.length} reports generated`}
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
                onClick={() => { push(LIVE_EVENTS[eventIdx.current % LIVE_EVENTS.length]); eventIdx.current++; }}
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
              <a href="/" style={{
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
              </a>
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
                    label="Total Revenue" value="$14,955"
                    sub="15 assessments"
                    accent
                    delta={{ val: "24%", positive: true }}
                    icon={<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M10 4.5C10 3.12 8.66 2 7 2S4 3.12 4 4.5 5.34 7 7 7s3 1.12 3 2.5S8.66 12 7 12s-3-1.12-3-2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>}
                  />
                  <MetricCard
                    label="Total Orders" value="18"
                    sub="3 pending completion"
                    delta={{ val: "2 this week", positive: true }}
                    icon={<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 3h10M2 7h10M2 11h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>}
                  />
                  <MetricCard
                    label="Completion Rate" value="83%"
                    sub="15 of 18 completed"
                    delta={{ val: "5%", positive: true }}
                    icon={<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.4" /><path d="M4.5 7l2 2 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  />
                  <MetricCard
                    label="Avg. Savings Found" value="$10,400"
                    sub="per completed audit"
                    delta={{ val: "$1,200", positive: true }}
                    icon={<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 10l3-4 3 2 4-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>}
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
                    <RevenueChart />
                  </Card>

                  {/* Status distribution */}
                  <Card style={{ padding: "22px" }}>
                    <h2 style={{ fontSize: "15px", fontWeight: 500, color: T.ink, margin: "0 0 18px", letterSpacing: "-0.01em" }}>Order status</h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {[
                        { label: "Completed",  value: 15, total: 18, color: T.green },
                        { label: "Processing", value: 2,  total: 18, color: T.violet },
                        { label: "Pending",    value: 1,  total: 18, color: T.orange },
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
                      <Sparkline data={[2985, 3992, 5010, 4968, 3980, 6951]} color={T.violet} />
                    </div>
                  </Card>
                </div>

                {/* Recent activity + recent orders */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "12px" }}>

                  {/* Activity feed */}
                  <Card style={{ padding: "22px" }}>
                    <h2 style={{ fontSize: "15px", fontWeight: 500, color: T.ink, margin: "0 0 4px", letterSpacing: "-0.01em" }}>Recent activity</h2>
                    <p style={{ fontSize: "12px", color: T.ghost, margin: "0 0 12px" }}>Last 24 hours</p>
                    <div>
                      {[
                        { icon: "✓", text: "Assessment completed for Acme Inc — $14,200 in savings identified", time: "2 hours ago", color: T.green },
                        { icon: "💳", text: "New order received from GrowthHQ — $997", time: "5 hours ago", color: T.violet },
                        { icon: "📋", text: "Report generated for Tech Startup Co", time: "Yesterday", color: T.slate },
                        { icon: "📞", text: "Findings call scheduled with Design Studios", time: "Yesterday", color: T.orange },
                        { icon: "⚡", text: "FinTech Labs assessment started", time: "2 days ago", color: T.soft },
                      ].map((a, i) => <ActivityItem key={i} {...a} />)}
                    </div>
                  </Card>

                  {/* Recent orders preview */}
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
                        {ORDERS.slice(0, 5).map(o => (
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
                  sub={`${filteredOrders.length} of ${ORDERS.length} orders`}
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
              <div>
                <SectionHeader title="Assessments" sub="All completed and in-progress assessment sessions" />
                <Card>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "650px" }}>
                      <thead>
                        <tr>
                          <Th>Order</Th>
                          <Th>Company</Th>
                          <Th>Contact</Th>
                          <Th>Call date</Th>
                          <Th>Duration</Th>
                          <Th right>Savings found</Th>
                          <Th>Status</Th>
                          <Th>Actions</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {ASSESSMENTS.map((a, i) => (
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
                            <Td><span style={{ color: T.ghost }}>{a.duration}</span></Td>
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
            )}

            {/* ── REPORTS ── */}
            {tab === "reports" && (
              <div>
                <SectionHeader title="Generated reports" sub={`${REPORTS.length} reports delivered`} />
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {REPORTS.map((r, i) => (
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
                          <p style={{ fontSize: "11px", color: T.ghost, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.4px" }}>Top saving</p>
                          <p style={{ fontSize: "18px", fontWeight: 300, color: T.green, margin: 0, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{r.topSaving}</p>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <ActionBtn label="Download PDF" />
                          <ActionBtn label="View" primary />
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
      <OrderDrawer order={selectedOrder} onClose={() => setSelectedOrder(null)} />

      {/* ── Toast stack ── */}
      <ToastStack toasts={toasts} dismiss={dismiss} />
    </>
  );
}
