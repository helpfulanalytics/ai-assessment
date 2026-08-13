import type { Metadata } from "next";
import DiscoveryClient, { type InitialState } from "./DiscoveryClient";
import { getSession, paywallPosition, progressOf, isChatComplete } from "../../lib/session";

export const metadata: Metadata = {
  title: "Your discovery interview — AssessAI",
  robots: { index: false, follow: false },
};

interface Props {
  searchParams: Promise<{ s?: string }>;
}

/**
 * Server shell. Resolving the paywall position here keeps it a single server-side
 * env var — the client is told which flow it is in rather than reading (and being
 * able to disagree with) a NEXT_PUBLIC_ copy of the same setting.
 */
export default async function DiscoveryPage({ searchParams }: Props) {
  const { s } = await searchParams;
  const paywall = paywallPosition();

  let initial: InitialState = { kind: "gate", paywall };

  if (s) {
    const session = await getSession(s);
    if (session) {
      initial = {
        kind: "session",
        paywall: session.paywall,
        sessionId: session.id,
        status: session.status,
        company: session.company,
        reportId: session.reportId ?? null,
        chatComplete: isChatComplete(session),
        closingComplete: !!session.closingComplete,
        progress: progressOf(session),
        messages: session.messages.map((m) => ({
          role: m.role,
          content: m.content,
          ...(m.suggestions?.length ? { suggestions: m.suggestions } : {}),
        })),
      };
    }
  }

  return <DiscoveryClient initial={initial} />;
}
