import OpenAI from "openai";
import { NextRequest } from "next/server";
import type { AuditReport } from "../../../data/mockAuditData";
import { adminDb } from "../../../lib/firebase-admin";

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

const PERSONA_CONTEXT: Record<string, string> = {
  accessibility:
    "You are a senior accessibility engineer auditing for WCAG 2.1 AA compliance. Focus on color contrast ratios (use the screenshot to visually assess), ARIA labels, keyboard navigation, focus management, alt text, screen reader support, and touch target sizing.",
  techy:
    "You are a W3C-standards engineer auditing for spec compliance. Focus on semantic HTML, Core Web Vitals, performance budgets, heading hierarchy, structured data, and technical best practices. Pull real evidence from the rendered HTML.",
  impatient:
    "You are a distracted mobile user with a 3-second attention span. Flag anything causing friction: slow perceived load, confusing navigation, unclear CTAs, missing trust signals, walls of text, or anything that would make you leave immediately.",
  seo:
    "You are a senior SEO strategist auditing for search indexability and organic growth. Focus on meta tags, OpenGraph, title/description length and quality, heading hierarchy, alt text, canonical URLs, structured data, internal linking, and page speed as a ranking factor.",
  conversion:
    "You are a CRO specialist whose only goal is to increase the percentage of visitors who take the desired action. Focus on CTA clarity and placement, social proof, trust signals, friction in forms and flows, value proposition clarity, pricing page structure, and objection handling.",
};

const VIEWPORT_DIMENSIONS: Record<string, { width: number; height: number }> = {
  mobile:  { width: 375, height: 812 },
  desktop: { width: 1440, height: 900 },
  tablet:  { width: 768, height: 1024 },
};

const VIEWPORT_CONTEXT: Record<string, string> = {
  mobile:  "Evaluate for a 375px mobile viewport (iPhone 14/15). Prioritize touch targets, mobile typography, above-the-fold content, and tap-friendly spacing.",
  desktop: "Evaluate for a 1440px desktop viewport. Prioritize layout density, whitespace, hover interactions, and desktop-specific patterns.",
  tablet:  "Evaluate for a 768px tablet viewport (iPad Pro). Consider both touch and pointer interactions and landscape/portrait considerations.",
};

function cleanHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<svg[\s\S]*?<\/svg>/gi, "[SVG]")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 24000);
}

const LOCAL_CHROME =
  process.platform === "darwin"
    ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    : process.platform === "win32"
    ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
    : "/usr/bin/google-chrome-stable";

const MAX_CRAWL_PAGES = 6;

// Pages worth prioritizing when picking which internal links to crawl beyond the homepage
const PRIORITY_PATH_HINTS = [
  "pricing", "plans", "about", "team", "careers", "contact",
  "product", "feature", "service", "how-it-works", "blog",
  "case-stud", "customer", "faq", "demo", "get-started", "signup", "login",
];

function pickCrawlTargets(homepageUrl: string, links: string[]): string[] {
  const home = new URL(homepageUrl);
  const seen = new Set<string>([homepageUrl]);
  const candidates: { url: string; score: number }[] = [];

  for (const raw of links) {
    let abs: URL;
    try {
      abs = new URL(raw, homepageUrl);
    } catch {
      continue;
    }
    if (abs.hostname !== home.hostname) continue;
    abs.hash = "";
    const normalized = abs.toString();
    if (seen.has(normalized)) continue;
    seen.add(normalized);

    const path = abs.pathname.toLowerCase();
    const score = PRIORITY_PATH_HINTS.findIndex((hint) => path.includes(hint));
    candidates.push({ url: normalized, score: score === -1 ? 99 : score });
  }

  candidates.sort((a, b) => a.score - b.score);
  return candidates.slice(0, MAX_CRAWL_PAGES - 1).map((c) => c.url);
}

async function crawlSite(
  targetUrl: string,
  viewport: string
): Promise<{ screenshot: string; renderedHtml: string; pages: { url: string; html: string }[] }> {
  const { width, height } = VIEWPORT_DIMENSIONS[viewport] ?? VIEWPORT_DIMENSIONS.mobile;

  const puppeteer = await import("puppeteer-core");

  let executablePath: string;
  let args: string[];

  if (process.env.NODE_ENV === "production") {
    const chromium = await import("@sparticuz/chromium");
    executablePath = await chromium.default.executablePath();
    args = chromium.default.args;
  } else {
    executablePath = LOCAL_CHROME;
    args = ["--no-sandbox", "--disable-setuid-sandbox"];
  }

  const browser = await puppeteer.default.launch({
    args,
    defaultViewport: { width, height },
    executablePath,
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    );
    await page.goto(targetUrl, { waitUntil: "networkidle2", timeout: 20_000 });

    const screenshot = await page.screenshot({ encoding: "base64", type: "jpeg", quality: 85 });
    const renderedHtml = await page.evaluate(() => document.documentElement.outerHTML);
    const links = await page.evaluate(() =>
      Array.from(document.querySelectorAll("a[href]")).map((a) => (a as HTMLAnchorElement).href)
    );

    const pages: { url: string; html: string }[] = [{ url: targetUrl, html: renderedHtml }];

    const crawlTargets = pickCrawlTargets(targetUrl, links);
    for (const link of crawlTargets) {
      try {
        await page.goto(link, { waitUntil: "networkidle2", timeout: 15_000 });
        const html = await page.evaluate(() => document.documentElement.outerHTML);
        pages.push({ url: link, html });
      } catch (err) {
        console.warn(`Crawl skip (failed to load ${link}):`, err);
      }
    }

    return { screenshot: screenshot as string, renderedHtml, pages };
  } finally {
    await browser.close();
  }
}

export async function POST(req: NextRequest) {
  const { url, persona = "accessibility", viewport = "mobile", email, orderId, company, contact } = await req.json();

  if (!url) {
    return Response.json({ error: "url is required" }, { status: 400 });
  }

  const targetUrl = url.startsWith("http") ? url : `https://${url}`;
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  let cleanedHtml: string;
  let screenshotBase64: string | null = null;
  let crawledPages: { url: string; html: string }[] = [];

  try {
    const { screenshot, renderedHtml, pages } = await crawlSite(targetUrl, viewport);
    screenshotBase64 = screenshot;
    cleanedHtml = cleanHtml(renderedHtml);
    crawledPages = pages;
  } catch (err) {
    console.warn("Puppeteer capture failed, falling back to fetch:", err);
    try {
      const res = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          Accept: "text/html,application/xhtml+xml",
        },
        signal: AbortSignal.timeout(10_000),
      });
      const html = await res.text();
      cleanedHtml = cleanHtml(html);
      crawledPages = [{ url: targetUrl, html }];
    } catch {
      return Response.json(
        { error: `Could not fetch ${targetUrl}. Check the URL and try again.` },
        { status: 422 }
      );
    }
  }

  // Build a per-page summary for every crawled URL beyond the homepage (smaller slice each, to manage token budget)
  const siteSummary = crawledPages
    .map((p, i) => {
      const slice = i === 0 ? cleanedHtml : cleanHtml(p.html).slice(0, 6000);
      return `--- PAGE ${i + 1}: ${p.url} ---\n${slice}`;
    })
    .join("\n\n");

  const pagesCrawledList = crawledPages.map((p) => p.url);

  const systemPrompt = `You are two experts in one: (1) a world-class UX, conversion, and web quality auditor with 15+ years of experience who produces forensic, dollar-quantified audit reports that clients pay $997 for, AND (2) a sharp startup operator/growth advisor who has helped dozens of founders figure out what to build, hire for, or fix operationally to grow revenue. ${PERSONA_CONTEXT[persona] ?? PERSONA_CONTEXT.accessibility}

${VIEWPORT_CONTEXT[viewport] ?? VIEWPORT_CONTEXT.mobile}

${screenshotBase64 ? "You have a rendered screenshot of the homepage AND the crawled HTML of multiple pages across the site (see SITE CONTENT below — each page is marked with its URL). Use the screenshot to catch visual issues (contrast, layout, CTA visibility, whitespace, typography hierarchy, trust signals, social proof gaps) on the homepage, and the multi-page HTML to understand the business as a whole — its offering, pricing model, target customer, content depth, and operational signals." : "You have the crawled HTML of multiple pages across the site."}

Your job has TWO parts:

PART 1 — Website audit: produce a COMPREHENSIVE, DETAILED audit of UX/technical/conversion issues, not a generic checklist. Every finding must reference what you actually see, with specific dollar-impact estimates grounded in industry benchmarks.

PART 2 — Business growth analysis: by reading across ALL the crawled pages (not just the homepage), form a picture of what this business actually does, who it serves, and what it appears to be missing — then produce grounded "growth opportunity" hypotheses covering THREE angles a CEO/founder cares about: (a) features/products worth building, (b) roles worth hiring for or processes worth fixing operationally, (c) markets/positioning worth pursuing. These must be evidence-grounded hypotheses, not generic startup advice — cite the specific page/section/copy that led you to the observation, rate your confidence honestly, and give a concrete way to validate the hypothesis cheaply before committing real resources.

This report must justify its $997 price tag.

You MUST respond with ONLY valid JSON — no prose, no markdown fences, no explanation outside the JSON. The JSON must exactly match this TypeScript interface:

{
  "targetUrl": string,
  "overallScore": number (0–100, reflect actual observed quality honestly),
  "date": string,
  "summary": string (3–4 sentences: what the site is, the 2–3 biggest issues found, and the headline savings/opportunity number),
  "executiveSummary": string (3–4 full paragraphs covering: (1) overall quality assessment with specific observations, (2) the most impactful technical/UX findings with evidence from the page, (3) conversion and business impact analysis with dollar estimates grounded in industry data, (4) recommended priority order and expected combined ROI. Be specific — reference actual elements, colors, copy, and page sections you observe.),
  "totalSavingsEstimate": string (total estimated annual value of all findings combined, e.g. "$8,400–$14,200/yr"),
  "quickWins": string[] (exactly 5 items: the 5 highest-ROI actions achievable in under 1 week each, with estimated time and benefit),
  "businessSummary": string (2–3 paragraphs: what this business appears to be, who it serves, how it makes money, and — based on everything you read across the crawled pages — where its single biggest growth lever appears to sit. Be specific and reference actual pages/sections/copy you saw.),
  "growthOpportunities": Array<{
    "id": string (e.g. "growth-1"),
    "type": "feature" | "hire" | "process" | "market",
    "title": string (specific, ≤12 words),
    "observation": string (1–2 sentences: the SPECIFIC thing you saw across the crawled pages that grounds this — name the page/section/copy),
    "recommendation": string (1–2 sentences: what the founder/CEO should consider doing about it),
    "potentialImpact": string (concrete estimate of upside — revenue, time saved, CAC reduction — grounded in plausible industry comparisons, e.g. "Could add $20-40K/yr" or "Frees up ~10 hrs/week of founder time"),
    "confidence": "low" | "medium" | "high" (how grounded vs. speculative this hypothesis is — be honest, most should be medium or low since you only have the website to go on),
    "validationStep": string (a concrete, cheap way to test this hypothesis before investing real resources — e.g. an A/B test, a single landing page, an instrumentation check)
  }> (exactly 5 items, covering at least 2 of the 4 "type" values, ideally a mix of feature/hire/process/market),
  "categoryScores": {
    "Performance": number (0–100),
    "Accessibility": number (0–100),
    "Heuristics": number (0–100),
    "Copy": number (0–100),
    "Conversion": number (0–100),
    "SEO": number (0–100)
  },
  "issues": Array<{
    "id": string (e.g. "issue-1"),
    "category": "Performance" | "Accessibility" | "Heuristics" | "Copy" | "Conversion" | "SEO" | "Trust" | "TechStack",
    "title": string (specific, ≤12 words — name the actual element/issue),
    "description": string (2–3 sentences: what you observed, where exactly, what the technical problem is),
    "severity": "critical" | "warning" | "optimized" | "info",
    "law": string (relevant spec, heuristic, or benchmark — e.g. "WCAG 2.1 AA 1.4.3", "Nielsen Heuristic #1", "Core Web Vitals CLS < 0.1", "Cialdini Social Proof"),
    "impact": string (2 sentences: specific user/business consequence + estimated quantified impact using industry benchmarks),
    "recommendation": string (2–3 sentences: concrete actionable steps with implementation specifics),
    "saving": string (estimated annual dollar saving or conversion impact, e.g. "$3,600/yr", "Est. 8–12% conversion lift", "~$2,100/yr in recovered organic traffic"),
    "effort": "low" | "medium" | "high",
    "priority": number (1 = fix this week, ascending),
    "codeBefore": string (actual code from the rendered HTML showing the problem — use real selectors/classes/attributes you see),
    "codeAfter": string (specific improved code with the fix applied),
    "location": string (CSS selector, component name, URL path, or element description)
  }>,
  "roadmap": Array<{
    "phase": "Week 1–2" | "Week 3–4" | "Month 2" | "Month 3",
    "title": string (theme for this phase),
    "description": string (what gets fixed and why in this phase),
    "tasks": string[] (4–6 specific actionable tasks for this phase),
    "estimatedSaving": string (cumulative saving unlocked by end of this phase),
    "effort": "low" | "medium" | "high"
  }>
}

STRICT RULES:
- Return 12–18 issues total, distributed across at least 5 of the 8 categories
- At least 2 issues must be "critical" severity
- At least 2 issues must address Conversion or Trust
- At least 1 issue must address SEO
- Every issue MUST have a "saving" value — never omit it
- Scores must honestly reflect what you observe — low scores for poor quality, high for genuinely good
- codeBefore must be real code from the actual page HTML or a faithful representation of the pattern you see, not placeholder code
- codeAfter must be a working improvement of codeBefore
- The roadmap must have exactly 4 phases covering the full 90-day arc
- Do NOT invent issues that don't exist — every finding must be grounded in what you actually see
- executiveSummary must read like it was written by a senior consultant, not generated — reference specific page elements, colors, copy, and visual patterns you observe in the screenshot
- growthOpportunities must be exactly 5 items, each grounded in a SPECIFIC observation from the crawled pages (name the page/URL/section) — never generic "hire a marketer" type advice with no evidence behind it
- Be honest about confidence: you only have the public website to go on, not their internal metrics — most growthOpportunities should be "low" or "medium" confidence, and each MUST include a cheap validationStep before the founder commits real resources
- businessSummary must demonstrate you read multiple pages, not just the homepage — reference at least 2 distinct crawled pages by what's on them`;

  const userContent: OpenAI.ChatCompletionContentPart[] = [];

  if (screenshotBase64) {
    userContent.push({
      type: "image_url",
      image_url: { url: `data:image/jpeg;base64,${screenshotBase64}`, detail: "high" },
    });
  }

  userContent.push({
    type: "text",
    text: `Audit this site thoroughly, starting at: ${targetUrl}\n\nThe following ${crawledPages.length} pages were crawled and are provided below (homepage first, then internal pages):\n\n${siteSummary}\n\nProduce: (1) a comprehensive website audit with 12–18 findings and a full 90-day roadmap — every finding must have a dollar-quantified saving estimate, and (2) a business growth analysis (businessSummary + exactly 5 growthOpportunities) grounded in what you read across ALL the crawled pages, not just the homepage.`,
  });

  let reportJson: AuditReport;
  try {
    const message = await client.chat.completions.create({
      model: "google/gemini-2.5-flash",
      max_tokens: 16384,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      response_format: { type: "json_object" } as any,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
    });

    const choice = message.choices[0];
    const raw = choice?.message?.content ?? "";
    if (choice?.finish_reason === "length") {
      console.warn(`Audit response truncated by max_tokens (raw length ${raw.length}).`);
    }

    // Strip markdown fences if the model added them despite json_object mode
    let jsonStr = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    // Find the outermost JSON object in case there's leading/trailing prose
    const firstBrace = jsonStr.indexOf("{");
    const lastBrace  = jsonStr.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      jsonStr = jsonStr.slice(firstBrace, lastBrace + 1);
    }

    // Attempt parse; if it fails try a lightweight repair pass
    let parsed: AuditReport;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      // Repair: replace unescaped control characters inside JSON strings
      const repaired = jsonStr
        .replace(/[ -]/g, (c) => {
          const hex = c.charCodeAt(0).toString(16).padStart(4, "0");
          return `\\u${hex}`;
        });
      try {
        parsed = JSON.parse(repaired);
      } catch (repairErr) {
        console.error(
          `Audit JSON parse failed (raw length=${raw.length}, finish_reason=${choice?.finish_reason}).`,
          "head:", jsonStr.slice(0, 300),
          "tail:", jsonStr.slice(-300)
        );
        throw repairErr;
      }
    }

    reportJson = parsed;
    reportJson.date = today;
    reportJson.targetUrl = url;
    reportJson.pagesCrawled = pagesCrawledList;
  } catch (err) {
    console.error("Audit analysis error:", err);
    return Response.json(
      { error: "Audit analysis failed. Please try again." },
      { status: 500 }
    );
  }

  const docRef = orderId ? adminDb.collection("audits").doc(orderId) : adminDb.collection("audits").doc();
  await docRef.set({
    ...reportJson,
    id: docRef.id,
    orderId: orderId || null,
    company: company || "Unknown Company",
    contact: contact || "Customer",
    email: email ?? null,
    persona,
    viewport,
    createdAt: new Date().toISOString(),
  });

  return Response.json({ ...reportJson, id: docRef.id });
}
