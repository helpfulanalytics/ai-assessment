import type { Metadata } from "next";
import "./globals.css";
import PageTransition from "../components/PageTransition";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Agentation } from "agentation";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const SITE_URL = "https://erasefriction.com";

const TITLE = "AssessAI — Find where your business is wasting time";
const DESCRIPTION =
  "A 15-minute interview about how your business actually runs, then a written assessment of every bottleneck, the off-the-shelf tools that fix each one, and a four-day plan to start. $297, delivered the same hour.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "AssessAI",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: "15-minute interview. Written assessment of where your time is going, and the tools that fix it. $297, or free if it can't find you 5 hours a week.",
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
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body>
        <PageTransition>{children}</PageTransition>
        {process.env.NODE_ENV === "development" && <Agentation />}
      </body>
    </html>
  );
}
