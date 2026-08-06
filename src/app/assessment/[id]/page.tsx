import { adminDb } from "../../../lib/firebase-admin";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AssessmentClient from "./AssessmentClient";
import type { AssessmentReport } from "../../../data/mockAssessmentData";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const doc = await adminDb.collection("assessments").doc(id).get();
  if (!doc.exists) return { title: "Assessment not found — AssessAI" };
  const data = doc.data() as AssessmentReport;

  const title = `AI Opportunity Assessment: ${data.company ?? "Your business"} — AssessAI`;
  const description = `${data.totalEstimatedHoursSavedPerWeek} hours per week recoverable across ${data.painPoints?.length ?? 0} bottlenecks.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function AssessmentPage({ params }: Props) {
  const { id } = await params;
  const doc = await adminDb.collection("assessments").doc(id).get();
  if (!doc.exists) notFound();

  const report = doc.data() as AssessmentReport;
  return <AssessmentClient report={report} id={id} />;
}
