import { adminDb } from "../../../lib/firebase-admin";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReportClient from "./ReportClient";
import type { AuditReport } from "../../../data/mockAuditData";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const doc = await adminDb.collection("audits").doc(id).get();
  if (!doc.exists) return { title: "Report not found — AuditAI" };
  const data = doc.data() as AuditReport;
  return {
    title: `Audit Report: ${data.targetUrl} — AuditAI`,
    description: data.summary,
  };
}

export default async function ReportPage({ params }: Props) {
  const { id } = await params;
  const doc = await adminDb.collection("audits").doc(id).get();
  if (!doc.exists) notFound();

  const report = doc.data() as AuditReport & { persona?: string; viewport?: string; createdAt?: string };
  return <ReportClient report={report} id={id} />;
}
