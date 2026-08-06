import type { Metadata } from "next";
import Link from "next/link";
import SuccessClient from "./SuccessClient";

export const metadata: Metadata = {
  title: "Payment confirmed — AssessAI",
  robots: { index: false, follow: false },
};

interface Props {
  searchParams: Promise<{ s?: string }>;
}

/**
 * The return trip from Stripe. Payment is confirmed by the webhook, not by
 * arriving here, so this page's only job is to wait for that to land and then
 * hand off to /discovery — which knows what to do next in either paywall mode.
 */
export default async function SuccessPage({ searchParams }: Props) {
  const { s } = await searchParams;

  if (!s) {
    return (
      <main style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", background: "var(--c-porcelain)", fontFamily: "var(--font-sans)" }}>
        <div style={{ maxWidth: "420px", textAlign: "center" }}>
          <h1 style={{ fontSize: "26px", fontWeight: 300, color: "var(--c-ink)", letterSpacing: "-0.025em", margin: "0 0 12px" }}>
            Payment confirmed
          </h1>
          <p style={{ fontSize: "15px", color: "var(--c-slate)", lineHeight: 1.7, margin: "0 0 24px" }}>
            Check your email — we&apos;ve sent your link. If it hasn&apos;t arrived in a few minutes, reply to your receipt and we&apos;ll sort it out.
          </p>
          <Link href="/" style={{ fontSize: "14px", fontWeight: 500, color: "var(--c-violet)", textDecoration: "none" }}>
            Back to home
          </Link>
        </div>
      </main>
    );
  }

  return <SuccessClient sessionId={s} />;
}
