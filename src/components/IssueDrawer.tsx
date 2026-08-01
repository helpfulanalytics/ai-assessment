"use client";

import React, { useEffect } from "react";
import { X, Copy, Check, Terminal, ExternalLink, TrendingUp, Zap, Clock } from "lucide-react";
import { AuditIssue } from "../data/mockAuditData";

interface IssueDrawerProps {
  issue: AuditIssue | null;
  isOpen: boolean;
  onClose: () => void;
}

const SEV_STYLE: Record<string, { bg: string; color: string; bar: string }> = {
  critical:  { bg: "#fff1f2", color: "#dc2626", bar: "#ef4444" },
  warning:   { bg: "#fffbeb", color: "#b45309", bar: "#f59e0b" },
  optimized: { bg: "#f0fdf4", color: "#16a34a", bar: "#22c55e" },
  info:      { bg: "var(--c-violet-bg)", color: "var(--c-violet)", bar: "var(--c-violet)" },
};

const EFFORT_LABEL: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  low:    { label: "Quick fix — low effort", color: "#16a34a", bg: "#f0fdf4", icon: <Zap size={11} /> },
  medium: { label: "Medium effort", color: "#b45309", bg: "#fffbeb", icon: <Clock size={11} /> },
  high:   { label: "High effort — plan ahead", color: "#7c3aed", bg: "#f5f3ff", icon: <Clock size={11} /> },
};

export default function IssueDrawer({ issue, isOpen, onClose }: IssueDrawerProps) {
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !issue) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(issue.codeAfter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sev = SEV_STYLE[issue.severity] ?? SEV_STYLE.info;
  const eff = issue.effort ? EFFORT_LABEL[issue.effort] : null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={`Issue: ${issue.title}`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{ background: "rgba(17,17,17,0.45)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-2xl h-full flex flex-col z-10 overflow-y-auto"
        style={{
          background: "var(--c-white)",
          borderLeft: "1px solid rgba(17,17,17,0.08)",
          boxShadow: "rgba(17,17,17,0.12) 0px 26px 60px -6px",
        }}
      >
        {/* Severity accent bar */}
        <div style={{ position: "absolute", top: 0, left: 0, width: "3px", height: "100%", background: sev.bar }} aria-hidden="true" />

        {/* Header */}
        <div style={{ padding: "20px 24px 18px 28px", borderBottom: "1px solid var(--c-powder)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "10px", fontWeight: 700, padding: "3px 9px", borderRadius: "100px", background: sev.bg, color: sev.color, letterSpacing: "0.3px" }}>
                {(issue.severity ?? "info").toUpperCase()}
              </span>
              <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--c-ghost)", background: "var(--c-porcelain)", borderRadius: "100px", padding: "3px 9px" }}>
                {issue.category}
              </span>
              {issue.priority !== undefined && (
                <span style={{ fontSize: "10px", fontWeight: 700, color: issue.priority <= 2 ? "#dc2626" : "var(--c-ghost)", background: issue.priority <= 2 ? "#fff1f2" : "var(--c-porcelain)", borderRadius: "100px", padding: "3px 9px" }}>
                  PRIORITY #{issue.priority}
                </span>
              )}
            </div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--c-ink)", lineHeight: 1.25, letterSpacing: "-0.02em", margin: 0 }}>
              {issue.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ padding: "8px", borderRadius: "8px", border: "1px solid var(--c-powder)", background: "transparent", cursor: "pointer", color: "var(--c-slate)", flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--c-porcelain)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "20px 24px 32px 28px", display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Key metrics row */}
          {(issue.saving || issue.effort || issue.law) && (
            <div style={{ display: "grid", gridTemplateColumns: issue.saving && issue.effort ? "1fr 1fr" : "1fr", gap: "8px" }}>
              {issue.saving && (
                <div style={{ padding: "12px 14px", background: "#f0fdf4", borderRadius: "10px", border: "1px solid #bbf7d0" }}>
                  <p style={{ fontSize: "10px", fontWeight: 700, color: "#16a34a", letterSpacing: "0.4px", textTransform: "uppercase", margin: "0 0 4px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <TrendingUp size={10} /> Estimated Impact
                  </p>
                  <p style={{ fontSize: "16px", fontWeight: 700, color: "#15803d", margin: 0, fontVariantNumeric: "tabular-nums" }}>{issue.saving}</p>
                </div>
              )}
              {eff && (
                <div style={{ padding: "12px 14px", background: eff.bg, borderRadius: "10px", border: `1px solid ${eff.color}30` }}>
                  <p style={{ fontSize: "10px", fontWeight: 700, color: eff.color, letterSpacing: "0.4px", textTransform: "uppercase", margin: "0 0 4px", display: "flex", alignItems: "center", gap: "4px" }}>
                    {eff.icon} Effort Level
                  </p>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: eff.color, margin: 0 }}>{eff.label}</p>
                </div>
              )}
            </div>
          )}

          {/* Meta grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", padding: "14px 16px", borderRadius: "10px", background: "var(--c-porcelain)", border: "1px solid var(--c-powder)" }}>
            <div>
              <p style={{ fontSize: "10px", fontWeight: 700, color: "var(--c-ghost)", letterSpacing: "0.3px", textTransform: "uppercase", margin: "0 0 4px" }}>Location</p>
              <p style={{ fontSize: "12px", fontFamily: "monospace", color: "var(--c-ink)", margin: 0, display: "flex", alignItems: "center", gap: "5px", wordBreak: "break-all" }}>
                <Terminal size={11} style={{ color: "#328efa", flexShrink: 0 }} />
                {issue.location}
              </p>
            </div>
            <div>
              <p style={{ fontSize: "10px", fontWeight: 700, color: "var(--c-ghost)", letterSpacing: "0.3px", textTransform: "uppercase", margin: "0 0 4px" }}>Standard / Spec</p>
              <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--c-ink)", margin: 0, display: "flex", alignItems: "center", gap: "5px" }}>
                <ExternalLink size={11} style={{ color: "var(--c-slate)", flexShrink: 0 }} />
                {issue.law}
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <p style={{ fontSize: "10px", fontWeight: 700, color: "var(--c-ghost)", letterSpacing: "0.3px", textTransform: "uppercase", margin: "0 0 8px" }}>Issue Detail</p>
            <p style={{ fontSize: "14px", color: "var(--c-ink)", lineHeight: 1.7, margin: 0 }}>{issue.description}</p>
          </div>

          {/* Impact */}
          <div>
            <p style={{ fontSize: "10px", fontWeight: 700, color: "var(--c-ghost)", letterSpacing: "0.3px", textTransform: "uppercase", margin: "0 0 8px" }}>Business & UX Impact</p>
            <div style={{ padding: "14px 16px", background: "var(--c-orange-bg)", borderLeft: "3px solid #e16540", borderRadius: "0 8px 8px 0" }}>
              <p style={{ fontSize: "13px", color: "var(--c-ink)", lineHeight: 1.65, margin: 0 }}>{issue.impact}</p>
            </div>
          </div>

          {/* Recommendation */}
          <div>
            <p style={{ fontSize: "10px", fontWeight: 700, color: "var(--c-ghost)", letterSpacing: "0.3px", textTransform: "uppercase", margin: "0 0 8px" }}>Actionable Fix</p>
            <p style={{ fontSize: "14px", color: "var(--c-ink)", lineHeight: 1.7, margin: "0 0 16px" }}>{issue.recommendation}</p>

            {/* Code diff */}
            {(issue.codeBefore || issue.codeAfter) && (
              <div style={{ borderRadius: "10px", overflow: "hidden", border: "1px solid var(--c-powder)" }}>
                <div style={{ padding: "10px 14px", background: "var(--c-porcelain)", borderBottom: "1px solid var(--c-powder)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--c-slate)", letterSpacing: "0.3px" }}>CODE FIX</span>
                  <button
                    onClick={handleCopy}
                    aria-label={copied ? "Code copied" : "Copy fix code"}
                    style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "var(--c-ink)", background: "none", border: "none", cursor: "pointer" }}
                  >
                    {copied ? <Check size={12} style={{ color: "#47d096" }} /> : <Copy size={12} />}
                    {copied ? "Copied!" : "Copy fix"}
                  </button>
                </div>

                <div style={{ fontFamily: "monospace", fontSize: "12px", lineHeight: 1.6 }}>
                  {issue.codeBefore && (
                    <div style={{ padding: "12px 16px", background: "#fff5f5", borderBottom: "1px solid rgba(17,17,17,0.05)" }}>
                      <div style={{ display: "inline-block", marginBottom: "8px", padding: "1px 6px", borderRadius: "4px", background: "#ffd7f0", color: "#111", fontSize: "10px", fontWeight: 700 }}>
                        BEFORE
                      </div>
                      <pre style={{ margin: 0, whiteSpace: "pre-wrap", overflowX: "auto", color: "var(--c-slate)" }}>
                        <code>{issue.codeBefore}</code>
                      </pre>
                    </div>
                  )}
                  {issue.codeAfter && (
                    <div style={{ padding: "12px 16px", background: "#f5fff8" }}>
                      <div style={{ display: "inline-block", marginBottom: "8px", padding: "1px 6px", borderRadius: "4px", background: "#b7efb2", color: "#111", fontSize: "10px", fontWeight: 700 }}>
                        AFTER
                      </div>
                      <pre style={{ margin: 0, whiteSpace: "pre-wrap", overflowX: "auto", color: "var(--c-ink)" }}>
                        <code>{issue.codeAfter}</code>
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
