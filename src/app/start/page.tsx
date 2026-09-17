import type { Metadata } from "next";
import StartClient from "./StartClient";

export const metadata: Metadata = {
  title: "Start your assessment — AssessAI",
  robots: { index: false, follow: true },
};

export default function StartPage() {
  return <StartClient />;
}
