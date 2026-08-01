"use client";

import React, { useEffect, useState } from "react";

interface AuraScoreProps {
  score: number;
  bare?: boolean;
}

export default function AuraScore({ score, bare = false }: AuraScoreProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const duration = 1200;
    const startTime = performance.now();
    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.floor(ease * score));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [score]);

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  const getPillStyle = (val: number) => {
    if (val >= 90) return { bg: "#b7efb2", text: "#111111", label: "Optimized" };
    if (val >= 70) return { bg: "#fbc768", text: "#111111", label: "Needs Polishing" };
    return { bg: "#ffd7f0", text: "#111111", label: "Action Required" };
  };

  const pill = getPillStyle(score);

  return (
    <div className={`flex flex-col items-center justify-center text-center h-full ${bare ? "" : "card-elevated p-8"}`}>
      <p
        className="text-muted-ash mb-5 font-medium"
        style={{ fontSize: "12px", letterSpacing: "0.3px", color: "var(--c-slate)" }}
      >
        Overall Aura Score
      </p>

      <div className="relative flex items-center justify-center w-48 h-48 mb-5">
        <svg className="w-full h-full -rotate-90" role="img" aria-label={`Aura score: ${animatedScore} out of 100`}>
          <circle
            cx="96" cy="96" r={radius}
            stroke="var(--c-stone)" strokeWidth="10" fill="transparent" opacity="0.3"
          />
          <circle
            cx="96" cy="96" r={radius}
            stroke="url(#scoreGrad)" strokeWidth="10" fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.1s ease-out" }}
          />
          <defs>
            <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#328efa" />
              <stop offset="50%" stopColor="#47d096" />
              <stop offset="100%" stopColor="#fbc768" />
            </linearGradient>
          </defs>
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-black tabular-nums"
            style={{ fontSize: "48px", lineHeight: 1, letterSpacing: "-2.24px", color: "var(--c-ink)" }}
          >
            {animatedScore}
          </span>
          <span style={{ fontSize: "12px", color: "var(--c-slate)", letterSpacing: "0.3px" }}>
            out of 100
          </span>
        </div>
      </div>

      <span
        className="px-3 py-1 rounded-xl text-xs font-medium"
        style={{ background: pill.bg, color: pill.text, fontSize: "12px", letterSpacing: "0.3px" }}
      >
        {pill.label}
      </span>
    </div>
  );
}
