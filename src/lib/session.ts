import { adminDb } from "./firebase-admin";
import { DISCOVERY_TOPICS } from "./discovery-script";

/**
 * A discovery session is the whole product in one document: the conversation,
 * where the client is in it, and whether they've paid.
 *
 * The session id is the bearer token. It comes from Firestore's auto-id (a 20-char
 * random string), it is never listed anywhere, and it is what the resume link in
 * the client's email contains. That is deliberately the only auth in v1 — the spec
 * asks for no user accounts, and a report is neither sensitive enough nor valuable
 * enough to a third party to justify a login wall in front of it.
 */

export type SessionStatus =
  /** Collecting answers. */
  | "chat"
  /** Blocked on payment — either before the chat (upfront) or after it (report). */
  | "awaiting_payment"
  /** Paid, report not generated yet. */
  | "paid"
  /** Report generated; reportId is set. */
  | "complete";

/** Where the paywall sits. Snapshotted per session so flipping the env var never strands anyone mid-flow. */
export type PaywallPosition = "upfront" | "report";

export interface SessionMessage {
  role: "assistant" | "user";
  content: string;
  /** Which scripted topic this message belongs to. Absent on the opening message. */
  topicId?: string;
}

export interface DiscoverySession {
  id: string;
  email: string;
  company: string;
  contact: string;
  status: SessionStatus;
  paywall: PaywallPosition;
  /** Index into DISCOVERY_TOPICS. Equal to length once every topic is covered. */
  topicIndex: number;
  /** Follow-ups asked on the current topic. Resets on advance. */
  probeCount: number;
  messages: SessionMessage[];
  reportId?: string;
  stripeSessionId?: string;
  createdAt: string;
  updatedAt: string;
}

export function paywallPosition(): PaywallPosition {
  return process.env.PAYWALL_POSITION === "upfront" ? "upfront" : "report";
}

export const ASSESSMENT_PRICE_USD = 297;

const sessions = () => adminDb.collection("sessions");

export async function createSession(input: {
  email: string;
  company: string;
  contact: string;
  /** Upfront sessions start blocked; report-paywall sessions start chatting. */
  status: SessionStatus;
  paywall: PaywallPosition;
}): Promise<DiscoverySession> {
  const ref = sessions().doc();
  const now = new Date().toISOString();

  const session: DiscoverySession = {
    id: ref.id,
    email: input.email,
    company: input.company,
    contact: input.contact,
    status: input.status,
    paywall: input.paywall,
    topicIndex: 0,
    probeCount: 0,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };

  await ref.set(session);
  return session;
}

export async function getSession(id: string): Promise<DiscoverySession | null> {
  if (!id || typeof id !== "string") return null;
  const doc = await sessions().doc(id).get();
  return doc.exists ? (doc.data() as DiscoverySession) : null;
}

export async function updateSession(
  id: string,
  patch: Partial<Omit<DiscoverySession, "id" | "createdAt">>
): Promise<void> {
  await sessions().doc(id).set({ ...patch, updatedAt: new Date().toISOString() }, { merge: true });
}

/** Finds the session a Stripe checkout belongs to. Used by the webhook, which only knows the Stripe id. */
export async function findSessionByStripeId(stripeSessionId: string): Promise<DiscoverySession | null> {
  const snap = await sessions().where("stripeSessionId", "==", stripeSessionId).limit(1).get();
  return snap.empty ? null : (snap.docs[0].data() as DiscoverySession);
}

/** True once every scripted topic has been covered. */
export function isChatComplete(session: DiscoverySession): boolean {
  return session.topicIndex >= DISCOVERY_TOPICS.length;
}

/**
 * Whether this session is entitled to a generated report.
 *
 * Upfront sessions paid before they could type a word, so reaching the end of the
 * chat is enough. Report-paywall sessions must have cleared checkout.
 */
export function isEntitledToReport(session: DiscoverySession): boolean {
  if (!isChatComplete(session)) return false;
  return session.paywall === "upfront"
    ? session.status !== "awaiting_payment"
    : session.status === "paid" || session.status === "complete";
}

/** 0–1, for the chat progress bar. */
export function progressOf(session: DiscoverySession): number {
  return Math.min(session.topicIndex / DISCOVERY_TOPICS.length, 1);
}
