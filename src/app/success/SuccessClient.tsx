"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Check } from "lucide-react";

/** Stripe redirects faster than webhooks land, so give the webhook a fair window before giving up. */
const POLL_INTERVAL_MS = 2000;
const MAX_WAIT_MS = 40_000;

export default function SuccessClient({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const startedAt = Date.now();

    async function poll() {
      if (cancelled) return;

      try {
        const res = await fetch("/api/discovery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const data = await res.json();

        // The webhook has landed once the session is no longer blocked on payment.
        if (res.ok && data.status !== "awaiting_payment") {
          router.replace(`/discovery?s=${sessionId}`);
          return;
        }
      } catch {
        // Network blip — the retry below covers it.
      }

      if (Date.now() - startedAt > MAX_WAIT_MS) {
        setTimedOut(true);
        return;
      }
      setTimeout(poll, POLL_INTERVAL_MS);
    }

    poll();
    return () => { cancelled = true; };
  }, [sessionId, router]);

  return (
    <main style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", background: "var(--c-porcelain)", fontFamily: "var(--font-sans)" }}>
      <div style={{ maxWidth: "420px", textAlign: "center" }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--c-green-bg)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <Check size={22} style={{ color: "var(--c-green)" }} />
        </div>

        <h1 style={{ fontSize: "26px", fontWeight: 300, color: "var(--c-ink)", letterSpacing: "-0.025em", margin: "0 0 12px", lineHeight: 1.2 }}>
          Payment confirmed
        </h1>

        {timedOut ? (
          <>
            <p style={{ fontSize: "15px", color: "var(--c-slate)", lineHeight: 1.7, margin: "0 0 24px" }}>
              Your payment went through, but confirmation is taking longer than usual to reach us. We&apos;ve emailed your link — or you can pick up where you left off directly.
            </p>
            <Link
              href={`/discovery?s=${sessionId}`}
              style={{ display: "inline-block", padding: "12px 24px", background: "var(--c-violet)", color: "#fff", borderRadius: "10px", fontSize: "15px", fontWeight: 600, textDecoration: "none" }}
            >
              Continue
            </Link>
          </>
        ) : (
          <p style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "9px", fontSize: "15px", color: "var(--c-slate)", lineHeight: 1.7, margin: 0 }}>
            <Loader2 size={15} style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} />
            Setting things up — one moment.
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </p>
        )}
      </div>
    </main>
  );
}
