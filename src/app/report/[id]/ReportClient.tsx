"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Share2, Check, ArrowLeft, ExternalLink,
  TrendingUp, Zap, AlertTriangle, Info,
  ChevronRight, Map, Lightbulb,
  Sparkles, Users, Cog, Globe, FlaskConical, Compass as CompassIcon,
} from "lucide-react";
import AuraScore from "../../../components/AuraScore";
import BentoGrid from "../../../components/BentoGrid";
import IssueDrawer from "../../../components/IssueDrawer";
import type { AuditReport, AuditIssue, RoadmapPhase, GrowthOpportunity } from "../../../data/mockAuditData";

const SEVERITY_ORDER = { critical: 0, warning: 1, optimized: 2, info: 3 };

const SEV_STYLE: Record<string, { bg: string; color: string; dot: string; icon: React.ReactNode }> = {
  critical:  { bg: "#fff1f2", color: "#dc2626", dot: "#ef4444", icon: <AlertTriangle size={11} /> },
  warning:   { bg: "#fffbeb", color: "#b45309", dot: "#f59e0b", icon: <AlertTriangle size={11} /> },
  optimized: { bg: "#f0fdf4", color: "#16a34a", dot: "#22c55e", icon: <Check size={11} /> },
  info:      { bg: "var(--c-violet-bg)", color: "var(--c-violet)", dot: "var(--c-violet)", icon: <Info size={11} /> },
};

const EFFORT_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  low:    { label: "Quick fix", color: "#16a34a", bg: "#f0fdf4" },
  medium: { label: "Medium effort", color: "#b45309", bg: "#fffbeb" },
  high:   { label: "High effort", color: "#7c3aed", bg: "#f5f3ff" },
};

const ROADMAP_COLORS = ["#533afd", "#0ea5e9", "#10b981", "#f59e0b"];

interface Props {
  report: AuditReport & { persona?: string; viewport?: string; createdAt?: string };
  id: string;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: "11px", fontWeight: 700, color: "var(--c-slate)",
      letterSpacing: "0.5px", textTransform: "uppercase",
      margin: "0 0 14px",
    }}>
      {children}
    </p>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "var(--c-white)",
      border: "1px solid var(--c-powder)",
      borderRadius: "14px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      ...style,
    }}>
      {children}
    </div>
  );
}

function IssueRow({ issue, onClick }: { issue: AuditIssue; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  const sev = SEV_STYLE[issue.severity] ?? SEV_STYLE.info;
  const eff = issue.effort ? EFFORT_LABEL[issue.effort] : null;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: "100%", background: hov ? "var(--c-porcelain)" : "var(--c-white)",
        border: `1px solid ${hov ? "var(--c-washed)" : "var(--c-powder)"}`,
        borderRadius: "10px", padding: "14px 16px",
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        gap: "14px", cursor: "pointer", textAlign: "left",
        boxShadow: hov ? "0 2px 12px rgba(83,58,253,0.08)" : "0 1px 3px rgba(0,0,0,0.03)",
        transition: "all 150ms ease",
      }}
      aria-label={`View details for: ${issue.title}`}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", minWidth: 0, flex: 1 }}>
        {/* Priority number */}
        {issue.priority !== undefined && (
          <div style={{
            width: "22px", height: "22px", borderRadius: "6px",
            background: issue.priority <= 2 ? "#fff1f2" : "var(--c-porcelain)",
            color: issue.priority <= 2 ? "#dc2626" : "var(--c-ghost)",
            fontSize: "11px", fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, marginTop: "1px",
          }}>
            {issue.priority}
          </div>
        )}

        <div style={{ minWidth: 0, flex: 1 }}>
          {/* Title row */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "4px",
              fontSize: "10px", fontWeight: 700, padding: "2px 7px",
              borderRadius: "100px", background: sev.bg, color: sev.color,
              whiteSpace: "nowrap",
            }}>
              {sev.icon}
              {issue.severity.toUpperCase()}
            </span>
            <span style={{ fontSize: "10px", fontWeight: 500, color: "var(--c-ghost)", background: "var(--c-porcelain)", borderRadius: "100px", padding: "2px 7px", whiteSpace: "nowrap" }}>
              {issue.category}
            </span>
          </div>

          <p style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: 600, color: "var(--c-ink)", lineHeight: 1.35, letterSpacing: "-0.01em" }}>
            {issue.title}
          </p>
          <p style={{ margin: 0, fontSize: "12px", color: "var(--c-ghost)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {issue.description}
          </p>

          {/* Chips row */}
          <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
            {issue.saving && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: "4px",
                fontSize: "11px", fontWeight: 600,
                color: "#16a34a", background: "#f0fdf4",
                borderRadius: "100px", padding: "2px 8px",
              }}>
                <TrendingUp size={10} />
                {issue.saving}
              </span>
            )}
            {eff && (
              <span style={{
                fontSize: "11px", fontWeight: 500,
                color: eff.color, background: eff.bg,
                borderRadius: "100px", padding: "2px 8px",
              }}>
                {eff.label}
              </span>
            )}
          </div>
        </div>
      </div>

      <ChevronRight size={14} style={{ color: hov ? "var(--c-violet)" : "var(--c-stone)", flexShrink: 0, marginTop: "4px", transition: "color 150ms" }} />
    </button>
  );
}

function RoadmapCard({ phase, index }: { phase: RoadmapPhase; index: number }) {
  const [open, setOpen] = useState(index === 0);
  const color = ROADMAP_COLORS[index % ROADMAP_COLORS.length];
  const effortStyle = EFFORT_LABEL[phase.effort] ?? EFFORT_LABEL.medium;

  return (
    <div style={{
      border: `1px solid var(--c-powder)`,
      borderRadius: "12px",
      background: "var(--c-white)",
      overflow: "hidden",
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: "14px",
          padding: "16px 18px",
          background: "none", border: "none", cursor: "pointer", textAlign: "left",
          borderBottom: open ? "1px solid var(--c-powder)" : "none",
          transition: "background 150ms",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "var(--c-porcelain)"}
        onMouseLeave={e => e.currentTarget.style.background = "none"}
      >
        {/* Phase pill */}
        <div style={{
          flexShrink: 0, padding: "4px 10px", borderRadius: "100px",
          background: color + "18", color: color,
          fontSize: "11px", fontWeight: 700, whiteSpace: "nowrap",
        }}>
          {phase.phase}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "var(--c-ink)", letterSpacing: "-0.01em" }}>
            {phase.title}
          </p>
          <p style={{ margin: "2px 0 0", fontSize: "11px", color: "var(--c-ghost)" }}>
            {phase.tasks.length} tasks · {phase.estimatedSaving} projected
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          <span style={{ fontSize: "11px", fontWeight: 600, color: effortStyle.color, background: effortStyle.bg, borderRadius: "100px", padding: "2px 8px" }}>
            {effortStyle.label}
          </span>
          <ChevronRight size={14} style={{ color: "var(--c-stone)", transform: open ? "rotate(90deg)" : "none", transition: "transform 200ms ease" }} />
        </div>
      </button>

      {open && (
        <div style={{ padding: "16px 18px 18px" }}>
          <p style={{ fontSize: "13px", color: "var(--c-slate)", lineHeight: 1.65, margin: "0 0 14px" }}>
            {phase.description}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {phase.tasks.map((task, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <div style={{
                  width: "18px", height: "18px", borderRadius: "50%",
                  background: color + "18", color: color,
                  fontSize: "10px", fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, marginTop: "1px",
                }}>
                  {i + 1}
                </div>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--c-ink)", lineHeight: 1.5 }}>{task}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid var(--c-powder)", display: "flex", alignItems: "center", gap: "6px" }}>
            <TrendingUp size={12} style={{ color: "#16a34a" }} />
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#16a34a" }}>
              {phase.estimatedSaving} projected by end of this phase
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

const GROWTH_TYPE_STYLE: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  feature: { label: "Build", color: "#328efa", bg: "#328efa15", icon: <Sparkles size={11} /> },
  hire:    { label: "Hire", color: "#a855f7", bg: "#a855f715", icon: <Users size={11} /> },
  process: { label: "Fix Process", color: "#fbc768", bg: "#fbc76822", icon: <Cog size={11} /> },
  market:  { label: "New Market", color: "#14b8a6", bg: "#14b8a615", icon: <Globe size={11} /> },
};

const CONFIDENCE_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  high:   { label: "High confidence", color: "#16a34a", bg: "#f0fdf4" },
  medium: { label: "Medium confidence", color: "#b45309", bg: "#fffbeb" },
  low:    { label: "Low confidence — validate first", color: "var(--c-ghost)", bg: "var(--c-porcelain)" },
};

function GrowthCard({ opp }: { opp: GrowthOpportunity }) {
  const type = GROWTH_TYPE_STYLE[opp.type] ?? GROWTH_TYPE_STYLE.feature;
  const conf = CONFIDENCE_STYLE[opp.confidence] ?? CONFIDENCE_STYLE.medium;

  return (
    <div style={{ border: "1px solid var(--c-powder)", borderRadius: "12px", background: "var(--c-white)", padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "10px", fontWeight: 700, color: type.color, background: type.bg, borderRadius: "100px", padding: "3px 9px", letterSpacing: "0.3px" }}>
          {type.icon} {type.label.toUpperCase()}
        </span>
        <span style={{ fontSize: "10px", fontWeight: 600, color: conf.color, background: conf.bg, borderRadius: "100px", padding: "3px 9px" }}>
          {conf.label}
        </span>
      </div>

      <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--c-ink)", letterSpacing: "-0.01em", margin: "0 0 8px" }}>
        {opp.title}
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div>
          <p style={{ fontSize: "10px", fontWeight: 700, color: "var(--c-ghost)", letterSpacing: "0.3px", textTransform: "uppercase", margin: "0 0 4px" }}>What we saw</p>
          <p style={{ fontSize: "13px", color: "var(--c-slate)", lineHeight: 1.6, margin: 0 }}>{opp.observation}</p>
        </div>
        <div>
          <p style={{ fontSize: "10px", fontWeight: 700, color: "var(--c-ghost)", letterSpacing: "0.3px", textTransform: "uppercase", margin: "0 0 4px" }}>What to consider</p>
          <p style={{ fontSize: "13px", color: "var(--c-ink)", lineHeight: 1.6, margin: 0 }}>{opp.recommendation}</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "2px" }}>
          <div style={{ padding: "10px 12px", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
            <p style={{ fontSize: "10px", fontWeight: 700, color: "#16a34a", letterSpacing: "0.3px", textTransform: "uppercase", margin: "0 0 3px", display: "flex", alignItems: "center", gap: "4px" }}>
              <TrendingUp size={10} /> Potential impact
            </p>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "#15803d", margin: 0, lineHeight: 1.5 }}>{opp.potentialImpact}</p>
          </div>
          <div style={{ padding: "10px 12px", background: "var(--c-violet-bg)", borderRadius: "8px", border: "1px solid var(--c-washed)" }}>
            <p style={{ fontSize: "10px", fontWeight: 700, color: "var(--c-violet)", letterSpacing: "0.3px", textTransform: "uppercase", margin: "0 0 3px", display: "flex", alignItems: "center", gap: "4px" }}>
              <FlaskConical size={10} /> Validate before investing
            </p>
            <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--c-ink)", margin: 0, lineHeight: 1.5 }}>{opp.validationStep}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReportClient({ report, id }: Props) {
  const [selectedIssue, setSelectedIssue] = useState<AuditIssue | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("print") === "true") {
        setTimeout(() => window.print(), 500);
      }
    }
  }, []);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/report/${id}`
    : `/report/${id}`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sortedIssues = [...report.issues].sort(
    (a, b) => {
      const sevDiff = (SEVERITY_ORDER[a.severity] ?? 4) - (SEVERITY_ORDER[b.severity] ?? 4);
      if (sevDiff !== 0) return sevDiff;
      return (a.priority ?? 99) - (b.priority ?? 99);
    }
  );

  const categories = ["all", ...Array.from(new Set(sortedIssues.map(i => i.category)))];
  const filtered = activeFilter === "all" ? sortedIssues : sortedIssues.filter(i => i.category === activeFilter);

  const criticalCount = sortedIssues.filter(i => i.severity === "critical").length;
  const warningCount  = sortedIssues.filter(i => i.severity === "warning").length;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--c-porcelain)", fontFamily: "var(--font-sans)" }}>

      {/* ── Sticky header ── */}
      <header style={{
        background: "var(--c-white)",
        borderBottom: "1px solid var(--c-powder)",
        padding: "0 24px",
        height: "52px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 40,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "5px", color: "var(--c-slate)", fontSize: "13px", textDecoration: "none" }}>
            <ArrowLeft size={13} /> New audit
          </Link>
          <div style={{ width: "1px", height: "16px", background: "var(--c-powder)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <div style={{ background: "var(--c-violet)", borderRadius: "5px", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontSize: "10px", fontWeight: 700 }}>▲</span>
            </div>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--c-ink)", letterSpacing: "-0.01em" }}>AuditAI</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <a
            href={report.targetUrl.startsWith("http") ? report.targetUrl : `https://${report.targetUrl}`}
            target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "var(--c-slate)", textDecoration: "none", padding: "5px 10px", borderRadius: "7px", border: "1px solid var(--c-powder)", background: "var(--c-porcelain)" }}
          >
            <ExternalLink size={11} />
            {report.targetUrl}
          </a>
          <button
            onClick={handleCopyLink}
            style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", fontWeight: 500, color: copied ? "var(--c-green)" : "var(--c-white)", background: copied ? "var(--c-green-bg)" : "var(--c-ink)", border: "none", borderRadius: "7px", padding: "7px 12px", cursor: "pointer", transition: "all 200ms" }}
          >
            {copied ? <Check size={12} /> : <Share2 size={12} />}
            {copied ? "Copied!" : "Share"}
          </button>
        </div>
      </header>

      <main style={{ maxWidth: "960px", margin: "0 auto", padding: "36px 24px 100px" }}>

        {/* ── Page meta ── */}
        <div style={{ marginBottom: "6px" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--c-slate)", letterSpacing: "0.5px", margin: 0 }}>
            AUDIT REPORT · {report.date}
            {report.persona && ` · ${report.persona.toUpperCase()} PERSONA`}
            {report.viewport && ` · ${report.viewport.toUpperCase()}`}
          </p>
        </div>
        <h1 style={{ fontSize: "clamp(22px, 4vw, 34px)", fontWeight: 300, color: "var(--c-ink)", letterSpacing: "-0.03em", margin: "0 0 8px", lineHeight: 1.15 }}>
          {report.targetUrl}
        </h1>
        <p style={{ fontSize: "14px", color: "var(--c-slate)", lineHeight: 1.7, margin: "0 0 28px", maxWidth: "680px" }}>
          {report.summary}
        </p>

        {/* ── Savings banner ── */}
        {report.totalSavingsEstimate && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: "16px",
            background: "linear-gradient(135deg, #533afd08 0%, #533afd14 100%)",
            border: "1px solid var(--c-washed)",
            borderRadius: "14px", padding: "20px 24px",
            marginBottom: "28px",
          }}>
            <div>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--c-violet)", letterSpacing: "0.5px", margin: "0 0 4px" }}>TOTAL IDENTIFIED OPPORTUNITY</p>
              <p style={{ fontSize: "32px", fontWeight: 300, color: "var(--c-ink)", letterSpacing: "-0.04em", margin: 0, fontVariantNumeric: "tabular-nums" }}>
                {report.totalSavingsEstimate}
              </p>
            </div>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "22px", fontWeight: 300, color: "#dc2626", margin: 0, fontVariantNumeric: "tabular-nums" }}>{criticalCount}</p>
                <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--c-ghost)", margin: 0, textTransform: "uppercase", letterSpacing: "0.4px" }}>Critical</p>
              </div>
              <div style={{ width: "1px", background: "var(--c-powder)" }} />
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "22px", fontWeight: 300, color: "#b45309", margin: 0, fontVariantNumeric: "tabular-nums" }}>{warningCount}</p>
                <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--c-ghost)", margin: 0, textTransform: "uppercase", letterSpacing: "0.4px" }}>Warnings</p>
              </div>
              <div style={{ width: "1px", background: "var(--c-powder)" }} />
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "22px", fontWeight: 300, color: "var(--c-ink)", margin: 0, fontVariantNumeric: "tabular-nums" }}>{report.issues.length}</p>
                <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--c-ghost)", margin: 0, textTransform: "uppercase", letterSpacing: "0.4px" }}>Total findings</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Score + category breakdown ── */}
        <Card style={{ padding: "24px", marginBottom: "28px" }}>
          <div className="flex flex-col md:flex-row" style={{ gap: "28px" }}>
            <div
              className="flex flex-col items-center"
              style={{
                flexShrink: 0,
                paddingRight: "28px",
                borderRight: "1px solid var(--c-powder)",
              }}
            >
              <AuraScore score={report.overallScore} bare />
            </div>
            <div className="flex-1 min-w-0">
              <p
                style={{ fontSize: "11px", fontWeight: 700, color: "var(--c-ghost)", letterSpacing: "0.4px", textTransform: "uppercase", margin: "0 0 12px" }}
              >
                Score Breakdown by Category
              </p>
              <BentoGrid scores={report.categoryScores} />
            </div>
          </div>
        </Card>

        {/* ── Executive summary ── */}
        {report.executiveSummary && (
          <div style={{ marginBottom: "28px" }}>
            <SectionLabel>Executive Summary</SectionLabel>
            <Card style={{ padding: "24px 28px" }}>
              {report.executiveSummary.split("\n\n").filter(Boolean).map((para, i) => (
                <p key={i} style={{ fontSize: "14px", color: "var(--c-slate)", lineHeight: 1.75, margin: i === 0 ? 0 : "16px 0 0", letterSpacing: "0.1px" }}>
                  {para}
                </p>
              ))}
            </Card>
          </div>
        )}

        {/* ── Quick wins ── */}
        {report.quickWins && report.quickWins.length > 0 && (
          <div style={{ marginBottom: "28px" }}>
            <SectionLabel>Quick Wins — Do These First</SectionLabel>
            <Card style={{ overflow: "hidden" }}>
              {report.quickWins.map((win, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: "12px",
                  padding: "14px 20px",
                  borderBottom: i < report.quickWins!.length - 1 ? "1px solid var(--c-powder)" : "none",
                  background: i === 0 ? "#f0fdf4" : "transparent",
                }}>
                  <div style={{
                    width: "22px", height: "22px", borderRadius: "50%",
                    background: i === 0 ? "#22c55e" : "var(--c-porcelain)",
                    color: i === 0 ? "#fff" : "var(--c-ghost)",
                    fontSize: "11px", fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: "13px", color: i === 0 ? "#0f2e1c" : "var(--c-ink)", lineHeight: 1.55 }}>
                      {win}
                    </p>
                  </div>
                  {i === 0 && (
                    <span style={{ fontSize: "10px", fontWeight: 700, color: "#16a34a", background: "#dcfce7", borderRadius: "100px", padding: "2px 7px", flexShrink: 0, whiteSpace: "nowrap" }}>
                      #1 PRIORITY
                    </span>
                  )}
                </div>
              ))}
            </Card>
          </div>
        )}

        {/* ── Findings ── */}
        <div style={{ marginBottom: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
            <SectionLabel>Findings ({report.issues.length})</SectionLabel>
            {/* Category filter */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  style={{
                    fontSize: "11px", fontWeight: 500,
                    padding: "4px 10px", borderRadius: "100px",
                    border: `1px solid ${activeFilter === cat ? "var(--c-violet)" : "var(--c-powder)"}`,
                    background: activeFilter === cat ? "var(--c-violet-bg)" : "var(--c-white)",
                    color: activeFilter === cat ? "var(--c-violet)" : "var(--c-ghost)",
                    cursor: "pointer", transition: "all 150ms ease",
                    textTransform: "capitalize",
                  }}
                >
                  {cat === "all" ? `All (${report.issues.length})` : cat}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {filtered.map(issue => (
              <IssueRow key={issue.id} issue={issue} onClick={() => setSelectedIssue(issue)} />
            ))}
          </div>
        </div>

        {/* ── 90-day roadmap ── */}
        {report.roadmap && report.roadmap.length > 0 && (
          <div style={{ marginBottom: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <Map size={14} style={{ color: "var(--c-violet)" }} />
              <SectionLabel>90-Day Action Roadmap</SectionLabel>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {report.roadmap.map((phase, i) => (
                <RoadmapCard key={i} phase={phase} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* ── Business growth analysis ── */}
        {(report.businessSummary || (report.growthOpportunities && report.growthOpportunities.length > 0)) && (
          <div style={{ marginBottom: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <CompassIcon size={14} style={{ color: "var(--c-violet)" }} />
              <SectionLabel>Beyond the Website — Growing the Business</SectionLabel>
            </div>

            {report.businessSummary && (
              <Card style={{ padding: "20px 24px", marginBottom: "14px" }}>
                <p style={{ fontSize: "10px", fontWeight: 700, color: "var(--c-ghost)", letterSpacing: "0.4px", textTransform: "uppercase", margin: "0 0 10px" }}>
                  What this business looks like from the outside
                </p>
                {report.businessSummary.split("\n\n").filter(Boolean).map((para, i) => (
                  <p key={i} style={{ fontSize: "14px", color: "var(--c-slate)", lineHeight: 1.75, margin: i === 0 ? 0 : "12px 0 0" }}>
                    {para}
                  </p>
                ))}
                {report.pagesCrawled && report.pagesCrawled.length > 1 && (
                  <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid var(--c-powder)", display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--c-ghost)" }}>Pages crawled for this analysis:</span>
                    {report.pagesCrawled.map((p, i) => (
                      <span key={i} style={{ fontSize: "11px", color: "var(--c-slate)", background: "var(--c-porcelain)", border: "1px solid var(--c-powder)", borderRadius: "100px", padding: "2px 9px", fontFamily: "monospace" }}>
                        {(() => { try { return new URL(p).pathname || "/"; } catch { return p; } })()}
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {report.growthOpportunities && report.growthOpportunities.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {report.growthOpportunities.map((opp) => (
                  <GrowthCard key={opp.id} opp={opp} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── What's working well (optimized items) ── */}
        {sortedIssues.some(i => i.severity === "optimized") && (
          <div style={{ marginBottom: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <Lightbulb size={14} style={{ color: "#16a34a" }} />
              <SectionLabel>What&apos;s Already Working Well</SectionLabel>
            </div>
            <Card style={{ padding: "6px 12px" }}>
              {sortedIssues.filter(i => i.severity === "optimized").map((issue, idx, arr) => (
                <button
                  key={issue.id}
                  onClick={() => setSelectedIssue(issue)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: "10px",
                    padding: "10px 8px",
                    borderBottom: idx < arr.length - 1 ? "1px solid var(--c-powder)" : "none",
                    background: "none", border: "none", cursor: "pointer", textAlign: "left",
                  }}
                >
                  <Check size={13} style={{ color: "#22c55e", flexShrink: 0 }} />
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--c-ink)", fontWeight: 500 }}>{issue.title}</p>
                  <span style={{ fontSize: "11px", color: "var(--c-ghost)", marginLeft: "auto", flexShrink: 0 }}>{issue.category}</span>
                </button>
              ))}
            </Card>
          </div>
        )}

        {/* ── Footer CTA ── */}
        <div style={{ borderTop: "1px solid var(--c-powder)", paddingTop: "28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--c-ink)", margin: "0 0 4px" }}>Want a fresh audit?</p>
            <p style={{ fontSize: "13px", color: "var(--c-ghost)", margin: 0 }}>Run another URL to compare or track progress over time.</p>
          </div>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "9px 18px", background: "var(--c-ink)", color: "var(--c-white)", borderRadius: "8px", fontSize: "13px", fontWeight: 500, textDecoration: "none", transition: "opacity 150ms ease" }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            <Zap size={13} />
            Run new audit
          </Link>
        </div>

      </main>

      <IssueDrawer
        issue={selectedIssue}
        isOpen={!!selectedIssue}
        onClose={() => setSelectedIssue(null)}
      />
    </div>
  );
}
