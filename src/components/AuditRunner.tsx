"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, Cpu, Globe, FileImage, AlertCircle } from "lucide-react";
import type { AuditReport } from "../data/mockAuditData";

export interface OrderListItem {
  id: string;
  company: string;
  contact: string;
}

interface AuditRunnerProps {
  ordersList?: OrderListItem[];
  onAuditComplete: (url: string, report: AuditReport) => void;
}

const PROGRESS_STEPS = [
  { text: "Connecting to server and caching assets...",          pct: 12 },
  { text: "Scanning DOM elements & CSS layout trees...",         pct: 28 },
  { text: "Computing text & background contrast ratios (WCAG 2.1)...", pct: 46 },
  { text: "Mapping click targets & mobile touch buffers...",     pct: 62 },
  { text: "Analyzing UX copywriting with NLP readability formulas...", pct: 78 },
  { text: "Generating custom code-diff patches...",              pct: 92 },
  { text: "Finalizing report...",                                pct: 97 },
];

export default function AuditRunner({ ordersList, onAuditComplete }: AuditRunnerProps) {
  const router = useRouter();
  const [url, setUrl] = useState("unboringsurveys.app");
  const [orderId, setOrderId] = useState("");
  const [persona, setPersona] = useState("accessibility");
  const [viewport, setViewport] = useState("mobile");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [progressVal, setProgressVal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const stepIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "var(--c-white)",
    border: "1px solid rgba(17,17,17,0.08)",
    borderRadius: "12px",
    padding: "10px 14px",
    fontSize: "14px",
    color: "var(--c-ink)",
    fontFamily: "inherit",
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    padding: "8px 12px",
    fontSize: "13px",
    cursor: "pointer",
    appearance: "none" as const,
  };

  // Cycles through progress steps at a ~1s interval while the fetch is in-flight
  const startProgressAnimation = () => {
    let stepIndex = 0;
    setProgressText(PROGRESS_STEPS[0].text);
    setProgressVal(PROGRESS_STEPS[0].pct);

    stepIntervalRef.current = setInterval(() => {
      stepIndex = Math.min(stepIndex + 1, PROGRESS_STEPS.length - 1);
      setProgressText(PROGRESS_STEPS[stepIndex].text);
      setProgressVal(PROGRESS_STEPS[stepIndex].pct);
    }, 1100);
  };

  const stopProgressAnimation = () => {
    if (stepIntervalRef.current) {
      clearInterval(stepIntervalRef.current);
      stepIntervalRef.current = null;
    }
  };

  const handleStartAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setError(null);
    setIsAnalyzing(true);
    startProgressAnimation();

    try {
      const selectedOrder = ordersList?.find(o => o.id === orderId);
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          url, 
          persona, 
          viewport,
          orderId: orderId || undefined,
          company: selectedOrder?.company,
          contact: selectedOrder?.contact
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Audit failed. Please try again.");
      }

      stopProgressAnimation();
      setProgressVal(100);
      setProgressText("Complete!");

      await new Promise(r => setTimeout(r, 400));

      setIsAnalyzing(false);

      // If the API returned an id, navigate to the persistent report page
      if (data.id) {
        router.push(`/report/${data.id}`);
      } else {
        onAuditComplete(url, data as AuditReport);
      }
    } catch (err: unknown) {
      stopProgressAnimation();
      setIsAnalyzing(false);
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  // Clean up interval on unmount
  useEffect(() => () => stopProgressAnimation(), []);

  return (
    <div className="card-elevated p-6 h-full flex flex-col">
      {isAnalyzing ? (
        <div className="flex flex-col items-center justify-center py-10 h-full text-center gap-4">
          <div className="relative">
            <Loader2 size={44} className="animate-spin" style={{ color: "#328efa" }} />
            <Cpu size={18} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ color: "var(--c-ink)" }} />
          </div>

          <div>
            <p className="font-bold" style={{ fontSize: "16px", color: "var(--c-ink)", letterSpacing: "-0.2px" }}>
              Auditing Interface
            </p>
            <p className="font-mono mt-1" style={{ fontSize: "12px", color: "var(--c-slate)", letterSpacing: "0.3px" }}>
              {url}
            </p>
          </div>

          <div className="w-full max-w-xs">
            <div
              role="progressbar"
              aria-valuenow={Math.round(progressVal)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Audit progress"
              className="w-full h-1.5 rounded-full overflow-hidden mb-3"
              style={{ background: "rgba(17,17,17,0.06)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progressVal}%`, background: "#328efa" }}
              />
            </div>
            <p style={{ fontSize: "12px", color: "var(--c-slate)", letterSpacing: "0.25px" }}>
              {progressText}
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleStartAudit} className="flex flex-col justify-between h-full gap-5">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Search size={14} style={{ color: "var(--c-slate)" }} />
              <h2 style={{ fontSize: "12px", fontWeight: 600, color: "var(--c-slate)", letterSpacing: "0.3px" }}>
                CONFIGURE NEW AUDIT
              </h2>
            </div>

            <div className="relative">
              <Globe size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--c-slate)" }} />
              <label htmlFor="audit-url" className="sr-only">Target URL</label>
              <input
                id="audit-url"
                type="text"
                placeholder="Enter target URL (e.g., example.com)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                style={{ ...inputStyle, paddingLeft: "36px" }}
              />
            </div>

            <div className="flex flex-col gap-1.5 mt-1">
              <label htmlFor="audit-order" style={{ fontSize: "10px", fontWeight: 700, color: "var(--c-slate)", letterSpacing: "0.3px" }}>
                LINK TO ORDER (OPTIONAL)
              </label>
              <select id="audit-order" value={orderId} onChange={(e) => setOrderId(e.target.value)} style={selectStyle}>
                <option value="">No order (Standalone Audit)</option>
                {ordersList?.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.company} ({o.contact})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-1">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="audit-persona" style={{ fontSize: "10px", fontWeight: 700, color: "var(--c-slate)", letterSpacing: "0.3px" }}>
                  AUDITOR PERSONA
                </label>
                <select id="audit-persona" value={persona} onChange={(e) => setPersona(e.target.value)} style={selectStyle}>
                  <option value="accessibility">Elderly (Accessibility-First)</option>
                  <option value="techy">Developer (W3C/WCAG Standards)</option>
                  <option value="impatient">Distracted User (Impatient/Mobile)</option>
                  <option value="seo">SEO Crawler (Search Indexing)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="audit-viewport" style={{ fontSize: "10px", fontWeight: 700, color: "var(--c-slate)", letterSpacing: "0.3px" }}>
                  VIEWPORT TARGET
                </label>
                <select id="audit-viewport" value={viewport} onChange={(e) => setViewport(e.target.value)} style={selectStyle}>
                  <option value="mobile">Mobile (iPhone 14/15)</option>
                  <option value="desktop">Desktop (1440px)</option>
                  <option value="tablet">Tablet (iPad Pro)</option>
                </select>
              </div>
            </div>

            <div
              className="flex flex-col items-center justify-center text-center p-4 rounded-xl"
              style={{ border: "1px dashed rgba(17,17,17,0.12)", background: "var(--c-porcelain)" }}
            >
              <FileImage size={20} style={{ color: "var(--c-slate)", marginBottom: "6px" }} />
              <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--c-ink)" }}>
                Drag & drop visual mockup
              </span>
              <span style={{ fontSize: "10px", color: "var(--c-slate)", marginTop: "2px" }}>
                Supports PNG, JPG, WebP up to 10MB
              </span>
            </div>

            {error && (
              <div
                className="flex items-start gap-2 p-3 rounded-xl"
                style={{ background: "var(--c-orange-bg)", border: "1px solid var(--c-orange)" }}
              >
                <AlertCircle size={14} style={{ color: "var(--c-orange)", flexShrink: 0, marginTop: "1px" }} />
                <p style={{ fontSize: "12px", color: "var(--c-ink)", lineHeight: 1.5, margin: 0 }}>{error}</p>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 cursor-pointer transition-all hover:opacity-90 active:scale-[0.98]"
            style={{
              background: "var(--c-ink)",
              color: "var(--c-white)",
              fontWeight: 500,
              fontSize: "14px",
              padding: "12px 16px",
              borderRadius: "8px",
              border: "none",
              letterSpacing: "0.25px",
            }}
          >
            <Cpu size={15} />
            Analyze & Build Report
          </button>
        </form>
      )}
    </div>
  );
}
