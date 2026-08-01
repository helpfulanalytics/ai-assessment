"use client";

import React from "react";
import { Zap, Eye, Compass, FileText, TrendingUp, Search } from "lucide-react";

interface BentoGridProps {
  scores: {
    Performance: number;
    Accessibility: number;
    Heuristics: number;
    Copy: number;
    Conversion?: number;
    SEO?: number;
  };
}

const cards = [
  {
    key: "Performance" as const,
    title: "Performance",
    icon: Zap,
    desc: "Resource loads & paint execution",
    accent: "#fbc768",
    accentBg: "#fbc76820",
  },
  {
    key: "Accessibility" as const,
    title: "Accessibility",
    icon: Eye,
    desc: "Contrast, ARIA, visual legibility",
    accent: "#e16540",
    accentBg: "#e1654018",
  },
  {
    key: "Heuristics" as const,
    title: "UX Heuristics",
    icon: Compass,
    desc: "Usability laws & touch sizing",
    accent: "#328efa",
    accentBg: "#328efa18",
  },
  {
    key: "Copy" as const,
    title: "UX Copy",
    icon: FileText,
    desc: "Clarity, alignment, microcopy",
    accent: "#47d096",
    accentBg: "#47d09618",
  },
  {
    key: "Conversion" as const,
    title: "Conversion",
    icon: TrendingUp,
    desc: "CTAs, friction & funnel leaks",
    accent: "#a855f7",
    accentBg: "#a855f718",
  },
  {
    key: "SEO" as const,
    title: "SEO",
    icon: Search,
    desc: "Indexability & meta structure",
    accent: "#14b8a6",
    accentBg: "#14b8a618",
  },
];

const RING_RADIUS = 18;
const RING_CIRC = 2 * Math.PI * RING_RADIUS;

function MiniRing({ score, color }: { score: number; color: string }) {
  const offset = RING_CIRC - (score / 100) * RING_CIRC;
  return (
    <div className="relative flex items-center justify-center" style={{ width: 44, height: 44, flexShrink: 0 }}>
      <svg width="44" height="44" className="-rotate-90" aria-hidden="true">
        <circle cx="22" cy="22" r={RING_RADIUS} stroke="var(--c-powder)" strokeWidth="4" fill="transparent" />
        <circle
          cx="22" cy="22" r={RING_RADIUS}
          stroke={color} strokeWidth="4" fill="transparent"
          strokeDasharray={RING_CIRC}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <span
        className="absolute font-bold tabular-nums"
        style={{ fontSize: "12px", color: "var(--c-ink)" }}
      >
        {score}
      </span>
    </div>
  );
}

export default function BentoGrid({ scores }: BentoGridProps) {
  const getScoreLabel = (val: number) => {
    if (val >= 90) return "Excellent";
    if (val >= 70) return "Good";
    if (val >= 50) return "Fair";
    return "Needs Work";
  };

  const visibleCards = cards.filter(c => scores[c.key] !== undefined);

  return (
    <div
      className="grid gap-2.5"
      style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}
    >
      {visibleCards.map((card) => {
        const Icon = card.icon;
        const score = scores[card.key] ?? 0;
        return (
          <div
            key={card.key}
            className="flex items-center gap-3 rounded-2xl transition-shadow"
            style={{
              padding: "12px 14px",
              background: "var(--c-white)",
              border: "1px solid var(--c-powder)",
            }}
          >
            <MiniRing score={score} color={card.accent} />

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="p-1 rounded-md" style={{ background: card.accentBg, flexShrink: 0 }}>
                  <Icon size={11} style={{ color: card.accent }} />
                </div>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--c-ink)", letterSpacing: "-0.01em" }}>
                  {card.title}
                </span>
                <span
                  style={{
                    fontSize: "10px", fontWeight: 600, color: card.accent,
                    background: card.accentBg, borderRadius: "100px", padding: "1px 7px", marginLeft: "auto",
                  }}
                >
                  {getScoreLabel(score)}
                </span>
              </div>
              <p style={{ fontSize: "11px", color: "var(--c-slate)", margin: 0, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {card.desc}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
