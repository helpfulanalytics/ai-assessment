"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Share2, Check, ArrowLeft, Clock,
  ShieldCheck, AlertTriangle, Grid3x3, CalendarDays,
  ExternalLink, Wrench, Zap,
} from "lucide-react";
import type { AssessmentReport, ToolRecommendation } from "../../../data/mockAssessmentData";

interface Props {
  report: AssessmentReport;
  id: string;
}

const EFFORT_ORDER = ["low", "medium", "high"] as const;
const IMPACT_ORDER = ["high", "medium", "low"] as const;

const EFFORT_LABEL: Record<string, string> = {
  low: "Low effort",
  medium: "Medium effort",
  high: "High effort",
};

const IMPACT_STYLE: Record<string, { color: string; bg: string }> = {
  high:   { color: "#16a34a", bg: "#f0fdf4" },
  medium: { color: "#b45309", bg: "#fffbeb" },
  low:    { color: "var(--c-ghost)", bg: "var(--c-porcelain)" },
};

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

/** 3x3 effort (x) vs impact (y) grid. Top-left = high impact / low effort = the sweet spot. */
function EffortImpactMatrix({ tools }: { tools: ToolRecommendation[] }) {
  return (
    <Card style={{ padding: "20px 24px 24px" }}>
      <div style={{ display: "flex", gap: "10px" }}>
        {/* Y axis label */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          writingMode: "vertical-rl", transform: "rotate(180deg)",
          fontSize: "10px", fontWeight: 700, color: "var(--c-ghost)",
          letterSpacing: "0.4px", textTransform: "uppercase",
          paddingBottom: "22px",
        }}>
          Impact →
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "grid", gridTemplateColumns: "auto repeat(3, 1fr)", gap: "6px" }}>
            {IMPACT_ORDER.map((impact) => (
              <React.Fragment key={impact}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "flex-end",
                  fontSize: "10px", fontWeight: 700, color: IMPACT_STYLE[impact].color,
                  textTransform: "uppercase", letterSpacing: "0.3px",
                  paddingRight: "6px", minWidth: "48px",
                }}>
                  {impact}
                </div>

                {EFFORT_ORDER.map((effort) => {
                  const cell = tools.filter(t => t.impact === impact && t.effort === effort);
                  const sweetSpot = impact === "high" && effort === "low";
                  return (
                    <div
                      key={effort}
                      style={{
                        minHeight: "78px",
                        borderRadius: "10px",
                        border: `1px ${sweetSpot ? "solid" : "dashed"} ${sweetSpot ? "#bbf7d0" : "var(--c-powder)"}`,
                        background: sweetSpot ? "#f0fdf4" : "var(--c-porcelain)",
                        padding: "8px",
                        display: "flex", flexDirection: "column", gap: "5px",
                      }}
                    >
                      {cell.map(t => (
                        <span
                          key={t.id}
                          style={{
                            fontSize: "11px", fontWeight: 600,
                            color: "var(--c-ink)", background: "var(--c-white)",
                            border: "1px solid var(--c-powder)",
                            borderRadius: "6px", padding: "4px 7px",
                            lineHeight: 1.3,
                          }}
                        >
                          {t.name}
                          <span style={{ display: "block", fontSize: "10px", fontWeight: 500, color: "var(--c-ghost)", marginTop: "1px" }}>
                            {t.estimatedTimeSavedHrsPerWeek} hrs/wk
                          </span>
                        </span>
                      ))}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}

            {/* X axis labels */}
            <div />
            {EFFORT_ORDER.map(effort => (
              <div key={effort} style={{
                textAlign: "center", fontSize: "10px", fontWeight: 700,
                color: "var(--c-ghost)", textTransform: "uppercase",
                letterSpacing: "0.3px", paddingTop: "6px",
              }}>
                {effort}
              </div>
            ))}
          </div>

          <p style={{
            textAlign: "center", fontSize: "10px", fontWeight: 700,
            color: "var(--c-ghost)", letterSpacing: "0.4px",
            textTransform: "uppercase", margin: "8px 0 0",
          }}>
            Effort to implement →
          </p>

          <p style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
            fontSize: "11px", color: "var(--c-ghost)", margin: "12px 0 0", lineHeight: 1.5,
          }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "3px", background: "#f0fdf4", border: "1px solid #bbf7d0", flexShrink: 0 }} />
            Most return for least work — start here when anything lands in this square.
          </p>
        </div>
      </div>
    </Card>
  );
}

function ToolCard({ tool, painTitle }: { tool: ToolRecommendation; painTitle?: string }) {
  const impact = IMPACT_STYLE[tool.impact] ?? IMPACT_STYLE.medium;

  return (
    <div style={{ border: "1px solid var(--c-powder)", borderRadius: "12px", background: "var(--c-white)", padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "5px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--c-ink)", letterSpacing: "-0.01em", margin: 0 }}>
              {tool.name}
            </h3>
            <span style={{ fontSize: "10px", fontWeight: 500, color: "var(--c-ghost)", background: "var(--c-porcelain)", borderRadius: "100px", padding: "2px 8px" }}>
              {tool.category}
            </span>
          </div>
          <p style={{ fontSize: "13px", color: "var(--c-slate)", lineHeight: 1.6, margin: 0 }}>
            {tool.whatItDoes}
          </p>
        </div>

        <div style={{
          flexShrink: 0, textAlign: "right",
          background: "#f0fdf4", border: "1px solid #bbf7d0",
          borderRadius: "10px", padding: "8px 12px",
        }}>
          <p style={{ fontSize: "20px", fontWeight: 300, color: "#15803d", margin: 0, fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>
            {tool.estimatedTimeSavedHrsPerWeek}
          </p>
          <p style={{ fontSize: "10px", fontWeight: 700, color: "#16a34a", margin: 0, textTransform: "uppercase", letterSpacing: "0.3px" }}>
            hrs/week
          </p>
        </div>
      </div>

      {painTitle && (
        <div style={{ marginTop: "12px", padding: "9px 12px", background: "var(--c-porcelain)", borderRadius: "8px", border: "1px solid var(--c-powder)" }}>
          <p style={{ fontSize: "10px", fontWeight: 700, color: "var(--c-ghost)", letterSpacing: "0.3px", textTransform: "uppercase", margin: "0 0 3px" }}>
            Solves
          </p>
          <p style={{ fontSize: "13px", color: "var(--c-ink)", margin: 0, lineHeight: 1.5 }}>{painTitle}</p>
        </div>
      )}

      <div style={{ display: "flex", gap: "6px", marginTop: "12px", flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: "11px", fontWeight: 600, color: impact.color, background: impact.bg, borderRadius: "100px", padding: "3px 9px" }}>
          {tool.impact.charAt(0).toUpperCase() + tool.impact.slice(1)} impact
        </span>
        <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--c-slate)", background: "var(--c-porcelain)", borderRadius: "100px", padding: "3px 9px" }}>
          {EFFORT_LABEL[tool.effort] ?? tool.effort}
        </span>
        <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--c-slate)", background: "var(--c-porcelain)", borderRadius: "100px", padding: "3px 9px" }}>
          {tool.monthlyCost}
        </span>
        {tool.link && (
          <a
            href={tool.link}
            target="_blank" rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 500, color: "var(--c-violet)", textDecoration: "none", marginLeft: "auto" }}
          >
            Visit site <ExternalLink size={10} />
          </a>
        )}
      </div>
    </div>
  );
}

/** Phase 4 booking link. Unset in dev, so the CTA simply doesn't render. */
const reviewCallUrl = process.env.NEXT_PUBLIC_REVIEW_CALL_URL;

export default function AssessmentClient({ report, id }: Props) {
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("print") === "true") {
        setTimeout(() => window.print(), 500);
      }
    }
  }, []);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/assessment/${id}`
    : `/assessment/${id}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const painById = new Map(report.painPoints.map(p => [p.id, p]));
  const toolById = new Map(report.toolRecommendations.map(t => [t.id, t]));
  const totalHoursLost = report.painPoints.reduce((sum, p) => sum + (p.hoursPerWeekLost || 0), 0);

  const sortedPlan = [...report.quickStartPlan].sort((a, b) => a.day - b.day);

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
            <ArrowLeft size={13} /> Home
          </Link>
          <div style={{ width: "1px", height: "16px", background: "var(--c-powder)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <div style={{ background: "var(--c-violet)", borderRadius: "5px", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontSize: "10px", fontWeight: 700 }}>▲</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--c-ink)", letterSpacing: "-0.01em", lineHeight: 1.2 }}>AssessAI</span>
              <span style={{ fontSize: "9px", fontWeight: 400, color: "var(--c-slate)", lineHeight: 1, marginTop: "2px" }}>powered by EraseFriction</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleCopyLink}
          style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", fontWeight: 500, color: copied ? "var(--c-green)" : "var(--c-white)", background: copied ? "var(--c-green-bg)" : "var(--c-ink)", border: "none", borderRadius: "7px", padding: "7px 12px", cursor: "pointer", transition: "all 200ms" }}
        >
          {copied ? <Check size={12} /> : <Share2 size={12} />}
          {copied ? "Copied!" : "Share"}
        </button>
      </header>

      <main style={{ maxWidth: "960px", margin: "0 auto", padding: "36px 24px 100px" }}>

        {/* ── Page meta ── */}
        <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--c-slate)", letterSpacing: "0.5px", margin: "0 0 6px" }}>
          AI OPPORTUNITY ASSESSMENT · {report.date}
          {report.intakeSource && ` · FROM ${report.intakeSource === "transcript" ? "INTERVIEW TRANSCRIPT" : "QUESTIONNAIRE"}`}
        </p>
        <h1 style={{ fontSize: "clamp(22px, 4vw, 34px)", fontWeight: 300, color: "var(--c-ink)", letterSpacing: "-0.03em", margin: "0 0 8px", lineHeight: 1.15 }}>
          {report.company ?? "Your business"}
        </h1>
        {report.contact && (
          <p style={{ fontSize: "14px", color: "var(--c-slate)", margin: "0 0 28px" }}>
            Prepared for {report.contact}
          </p>
        )}

        {/* ── Hours saved banner ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: "16px",
          background: "linear-gradient(135deg, #533afd08 0%, #533afd14 100%)",
          border: "1px solid var(--c-washed)",
          borderRadius: "14px", padding: "20px 24px",
          marginBottom: "28px",
        }}>
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--c-violet)", letterSpacing: "0.5px", margin: "0 0 4px" }}>
              ESTIMATED TIME RECOVERED
            </p>
            <p style={{ fontSize: "32px", fontWeight: 300, color: "var(--c-ink)", letterSpacing: "-0.04em", margin: 0, fontVariantNumeric: "tabular-nums" }}>
              {report.totalEstimatedHoursSavedPerWeek} hrs<span style={{ fontSize: "18px", color: "var(--c-slate)" }}>/week</span>
            </p>
          </div>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "22px", fontWeight: 300, color: "var(--c-ink)", margin: 0, fontVariantNumeric: "tabular-nums" }}>{report.painPoints.length}</p>
              <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--c-ghost)", margin: 0, textTransform: "uppercase", letterSpacing: "0.4px" }}>Bottlenecks</p>
            </div>
            <div style={{ width: "1px", background: "var(--c-powder)", alignSelf: "stretch" }} />
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "22px", fontWeight: 300, color: "var(--c-ink)", margin: 0, fontVariantNumeric: "tabular-nums" }}>{report.toolRecommendations.length}</p>
              <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--c-ghost)", margin: 0, textTransform: "uppercase", letterSpacing: "0.4px" }}>Tools</p>
            </div>
            <div style={{ width: "1px", background: "var(--c-powder)", alignSelf: "stretch" }} />
            <div style={{
              display: "flex", alignItems: "center", gap: "7px",
              background: report.guaranteeMet ? "#f0fdf4" : "#fffbeb",
              border: `1px solid ${report.guaranteeMet ? "#bbf7d0" : "#fde68a"}`,
              borderRadius: "10px", padding: "9px 13px",
            }}>
              {report.guaranteeMet
                ? <ShieldCheck size={15} style={{ color: "#16a34a", flexShrink: 0 }} />
                : <AlertTriangle size={15} style={{ color: "#b45309", flexShrink: 0 }} />}
              <span style={{ fontSize: "12px", fontWeight: 600, color: report.guaranteeMet ? "#15803d" : "#92400e", lineHeight: 1.35 }}>
                {report.guaranteeMet
                  ? "5+ hrs/week guarantee met"
                  : "Below the 5 hr/week guarantee"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Guarantee disclosure — shown when we did not clear the 5 hr bar ── */}
        {!report.guaranteeMet && (
          <div style={{
            display: "flex", alignItems: "flex-start", gap: "12px",
            background: "#fffbeb", border: "1px solid #fde68a",
            borderRadius: "14px", padding: "18px 22px", marginBottom: "28px",
          }}>
            <AlertTriangle size={17} style={{ color: "#b45309", flexShrink: 0, marginTop: "2px" }} />
            <div>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "#92400e", margin: "0 0 5px" }}>
                This assessment did not reach 5 hours per week — your fee is refundable.
              </p>
              <p style={{ fontSize: "13px", color: "#92400e", margin: 0, lineHeight: 1.65 }}>
                We promise to find at least 5 hours of weekly savings or refund the assessment in full.
                We found {report.totalEstimatedHoursSavedPerWeek} hrs/week here. The recommendations below
                still stand and are yours to keep — but the guarantee applies, so reply to this report to
                claim your refund.
              </p>
            </div>
          </div>
        )}

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

        {/* ── Pain points ── */}
        {report.painPoints.length > 0 && (
          <div style={{ marginBottom: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <Clock size={14} style={{ color: "var(--c-violet)" }} />
              <SectionLabel>Where the time is going ({totalHoursLost} hrs/week)</SectionLabel>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {report.painPoints.map((pain, i) => (
                <Card key={pain.id} style={{ padding: "16px 20px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <div style={{
                      width: "22px", height: "22px", borderRadius: "6px",
                      background: "var(--c-violet-bg)", color: "var(--c-violet)",
                      fontSize: "11px", fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, marginTop: "1px",
                    }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 600, color: "var(--c-ink)", letterSpacing: "-0.01em" }}>
                        {pain.title}
                      </p>
                      <p style={{ margin: "0 0 8px", fontSize: "13px", color: "var(--c-slate)", lineHeight: 1.6 }}>
                        {pain.description}
                      </p>
                      <p style={{ margin: 0, fontSize: "12px", color: "var(--c-ghost)", lineHeight: 1.5 }}>
                        <span style={{ fontWeight: 600 }}>Today: </span>{pain.currentProcess}
                      </p>
                    </div>
                    <span style={{
                      flexShrink: 0, fontSize: "12px", fontWeight: 600,
                      color: "#b45309", background: "#fffbeb",
                      border: "1px solid #fde68a",
                      borderRadius: "100px", padding: "3px 10px",
                      whiteSpace: "nowrap",
                    }}>
                      {pain.hoursPerWeekLost} hrs/wk
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ── Effort vs Impact matrix ── */}
        {report.toolRecommendations.length > 0 && (
          <div style={{ marginBottom: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <Grid3x3 size={14} style={{ color: "var(--c-violet)" }} />
              <SectionLabel>Effort vs. Impact — what to do first</SectionLabel>
            </div>
            <EffortImpactMatrix tools={report.toolRecommendations} />
          </div>
        )}

        {/* ── Tool recommendations ── */}
        {report.toolRecommendations.length > 0 && (
          <div style={{ marginBottom: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <Wrench size={14} style={{ color: "var(--c-violet)" }} />
              <SectionLabel>Recommended tools ({report.toolRecommendations.length})</SectionLabel>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {report.toolRecommendations.map(tool => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  painTitle={painById.get(tool.painPointAddressed)?.title}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── 4-day quick start plan ── */}
        {sortedPlan.length > 0 && (
          <div style={{ marginBottom: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <CalendarDays size={14} style={{ color: "var(--c-violet)" }} />
              <SectionLabel>Your 4-day quick start plan</SectionLabel>
            </div>
            <Card style={{ overflow: "hidden" }}>
              {sortedPlan.map((task, i) => {
                const tool = task.toolId ? toolById.get(task.toolId) : undefined;
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "flex-start", gap: "14px",
                    padding: "16px 20px",
                    borderBottom: i < sortedPlan.length - 1 ? "1px solid var(--c-powder)" : "none",
                    background: i === 0 ? "#f0fdf4" : "transparent",
                  }}>
                    <div style={{
                      flexShrink: 0, padding: "4px 10px", borderRadius: "100px",
                      background: i === 0 ? "#22c55e" : "var(--c-violet-bg)",
                      color: i === 0 ? "#fff" : "var(--c-violet)",
                      fontSize: "11px", fontWeight: 700, whiteSpace: "nowrap",
                    }}>
                      Day {task.day}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 600, color: "var(--c-ink)", letterSpacing: "-0.01em" }}>
                        {task.title}
                      </p>
                      <p style={{ margin: 0, fontSize: "13px", color: "var(--c-slate)", lineHeight: 1.6 }}>
                        {task.description}
                      </p>
                      {tool && (
                        <span style={{ display: "inline-block", marginTop: "8px", fontSize: "11px", fontWeight: 500, color: "var(--c-slate)", background: "var(--c-porcelain)", border: "1px solid var(--c-powder)", borderRadius: "100px", padding: "2px 9px" }}>
                          {tool.name}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </Card>
          </div>
        )}

        {/* ── Phase 4: the review call ── */}
        {reviewCallUrl && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: "16px",
            background: "linear-gradient(135deg, #533afd08 0%, #533afd14 100%)",
            border: "1px solid var(--c-washed)",
            borderRadius: "14px", padding: "22px 24px", marginBottom: "28px",
          }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--c-ink)", margin: "0 0 4px", letterSpacing: "-0.01em" }}>
                Walk through this report together
              </p>
              <p style={{ fontSize: "13px", color: "var(--c-slate)", margin: 0, lineHeight: 1.6, maxWidth: "440px" }}>
                Book a 30-minute call and we&apos;ll go through every recommendation, answer questions,
                and help you pick where to start.
              </p>
            </div>
            <a
              href={reviewCallUrl}
              target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "11px 20px", background: "var(--c-violet)", color: "#fff", borderRadius: "9px", fontSize: "14px", fontWeight: 600, textDecoration: "none", flexShrink: 0 }}
            >
              <CalendarDays size={15} />
              Book your review call
            </a>
          </div>
        )}

        {/* ── Footer CTA ── */}
        <div style={{ borderTop: "1px solid var(--c-powder)", paddingTop: "28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--c-ink)", margin: "0 0 4px" }}>Know someone else who&apos;d want this?</p>
            <p style={{ fontSize: "13px", color: "var(--c-ghost)", margin: 0 }}>The interview takes 15 minutes and the report lands the same day.</p>
          </div>
          <Link href="/discovery" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "9px 18px", background: "var(--c-ink)", color: "var(--c-white)", borderRadius: "8px", fontSize: "13px", fontWeight: 500, textDecoration: "none" }}>
            <Zap size={13} />
            Start an assessment
          </Link>
        </div>

      </main>
    </div>
  );
}
