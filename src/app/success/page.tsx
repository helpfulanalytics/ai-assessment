import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Order confirmed — AuditAI",
  robots: { index: false },
};

export default function SuccessPage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "var(--c-porcelain)",
        fontFamily: "var(--font-sans)",
      }}
    >
      <div
        style={{
          background: "var(--c-white)",
          borderRadius: "14px",
          padding: "52px 48px",
          maxWidth: "480px",
          width: "100%",
          textAlign: "center",
          boxShadow: "rgba(0,0,0,0.08) 0px 16px 48px -8px",
          border: "1px solid var(--c-powder)",
        }}
      >
        {/* Checkmark */}
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "var(--c-green-bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path
              d="M5 14l6 6L23 8"
              stroke="var(--c-green)"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <p
          style={{
            fontSize: "12px",
            fontWeight: 700,
            color: "var(--c-slate)",
            letterSpacing: "0.5px",
            marginBottom: "10px",
          }}
        >
          ORDER CONFIRMED
        </p>

        <h1
          style={{
            fontSize: "26px",
            fontWeight: 300,
            color: "var(--c-ink)",
            letterSpacing: "-0.025em",
            margin: "0 0 14px",
            lineHeight: 1.25,
          }}
        >
          Your assessment is booked.
        </h1>

        <p
          style={{
            fontSize: "15px",
            color: "var(--c-slate)",
            lineHeight: 1.7,
            margin: "0 0 32px",
          }}
        >
          Check your inbox — you&apos;ll receive a confirmation email shortly with your intake form and next steps. We deliver your full report within{" "}
          <strong style={{ color: "var(--c-ink)" }}>5 business days</strong>.
        </p>

        {/* What happens next */}
        <div
          style={{
            background: "var(--c-porcelain)",
            borderRadius: "10px",
            padding: "20px 22px",
            textAlign: "left",
            marginBottom: "28px",
          }}
        >
          <p
            style={{
              fontSize: "10px",
              fontWeight: 700,
              color: "var(--c-ghost)",
              letterSpacing: "0.5px",
              marginBottom: "14px",
            }}
          >
            WHAT HAPPENS NEXT
          </p>
          {[
            "Check your email for the intake form (30 min to complete)",
            "A senior consultant audits your entire business over 5 days",
            "You receive a full written report + 90-day prioritized roadmap",
            "We schedule a 60-minute findings call to walk through everything",
          ].map((step, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: "10px",
                marginBottom: i < 3 ? "10px" : 0,
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  background: "var(--c-violet-bg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "var(--c-violet)",
                  flexShrink: 0,
                  marginTop: "1px",
                }}
              >
                {i + 1}
              </div>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--c-slate)",
                  lineHeight: 1.55,
                  margin: 0,
                }}
              >
                {step}
              </p>
            </div>
          ))}
        </div>

        {/* Guarantee */}
        <p
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "6px",
            fontSize: "12px",
            color: "var(--c-ghost)",
            marginBottom: "28px",
            lineHeight: 1.55,
          }}
        >
          <ShieldCheck size={14} style={{ flexShrink: 0, marginTop: "1px", color: "var(--c-ink)" }} aria-hidden="true" />
          <span>
            <strong style={{ color: "var(--c-ink)" }}>30-day money-back guarantee</strong> — if you
            don&apos;t identify at least $997 in actionable savings, we refund every dollar.
          </span>
        </p>

        <Link
          href="/"
          style={{
            display: "inline-block",
            fontSize: "14px",
            color: "var(--c-violet)",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          ← Back to home
        </Link>
      </div>
    </main>
  );
}
