import type { Metadata } from "next";
import "./globals.css";
import PageTransition from "../components/PageTransition";

const SITE_URL = "https://erasefriction.com";

export const metadata: Metadata = {
  title: "AssessAI — Find the $10K+ Your Business Is Leaking in 5 Days",
  description:
    "Businesses doing $500K–$10M bleed $8,000–$20,000/year through duplicate tools, underpriced services, and manual work. We audit everything and hand you a fix-it plan in 5 days. 30-day guarantee.",
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "AssessAI — Find the $10K+ Your Business Is Leaking in 5 Days",
    description:
      "A senior consultant audits your entire business — tools, pricing, processes, and team — and delivers a prioritized roadmap in 5 days. Average savings found: $10,400.",
    url: SITE_URL,
    siteName: "AssessAI",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AssessAI — Find the $10K+ Your Business Is Leaking in 5 Days",
    description:
      "214+ businesses audited. $10,400 average savings found. Delivered in 5 days with a 30-day money-back guarantee.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
