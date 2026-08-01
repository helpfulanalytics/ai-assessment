export interface AuditIssue {
  id: string;
  category: 'Performance' | 'Accessibility' | 'Heuristics' | 'Copy' | 'Conversion' | 'SEO' | 'Trust' | 'TechStack';
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'optimized' | 'info';
  law: string;
  impact: string;
  recommendation: string;
  codeBefore: string;
  codeAfter: string;
  location: string;
  saving?: string;       // e.g. "$4,800/yr" or "Est. 12% conversion lift"
  effort?: 'low' | 'medium' | 'high';
  priority?: number;     // 1 = fix immediately
}

export interface RoadmapPhase {
  phase: string;         // e.g. "Week 1–2"
  title: string;
  description: string;
  tasks: string[];
  estimatedSaving: string;
  effort: 'low' | 'medium' | 'high';
}

export interface GrowthOpportunity {
  id: string;
  type: 'feature' | 'hire' | 'process' | 'market';
  title: string;
  observation: string;     // what was seen across the crawled pages that grounds this hypothesis
  recommendation: string;  // what the CEO/founder should consider doing
  potentialImpact: string; // e.g. "Could unlock $15-30K/yr in new bookings" or "Removes ~10hrs/wk of manual ops"
  confidence: 'low' | 'medium' | 'high'; // how grounded vs. speculative this hypothesis is
  validationStep: string;  // a concrete way to test the hypothesis before committing resources
}

export interface AuditReport {
  id?: string;
  createdAt?: string;
  orderId?: string;
  company?: string;
  contact?: string;
  targetUrl: string;
  overallScore: number;
  date: string;
  summary: string;
  executiveSummary?: string;
  totalSavingsEstimate?: string;
  quickWins?: string[];
  pagesCrawled?: string[];
  categoryScores: {
    Performance: number;
    Accessibility: number;
    Heuristics: number;
    Copy: number;
    Conversion: number;
    SEO: number;
  };
  issues: AuditIssue[];
  roadmap?: RoadmapPhase[];
  growthOpportunities?: GrowthOpportunity[];
  businessSummary?: string; // 2-3 paragraph narrative on what the business appears to be, who it serves, and where the biggest growth lever sits
}

export const initialAuditReport: AuditReport = {
  targetUrl: "unboringsurveys.app",
  overallScore: 78,
  date: "May 6, 2026",
  summary: "The survey experience is highly visual and engaging, but suffers from accessibility barriers (low text-contrast) and minor performance bottlenecks due to unoptimized assets. Aligning interactive tap targets to mobile guidelines will significantly erase friction.",
  executiveSummary: "UnboringSurveys presents a strong visual identity with a modern, game-like interface, but several foundational issues are limiting both user accessibility and conversion performance. The most critical concern is contrast failures across primary CTAs — 3 button instances fall below WCAG 2.1 AA's 4.5:1 threshold, directly excluding users with low vision. On the performance side, unoptimized SVG rendering and missing skeleton loaders create perceptible lag during score transitions. From a conversion standpoint, ambiguous modal microcopy and the absence of social proof near the primary CTA are costing estimated 8–15% in trial-to-signup conversion. SEO indexability is partially blocked by missing OpenGraph tags and no structured data markup, reducing organic discoverability by an estimated 20–35%. Addressing the 5 critical findings alone is projected to recover $6,200–$9,800 in annual revenue opportunity.",
  totalSavingsEstimate: "$6,200–$9,800/yr",
  quickWins: [
    "Fix primary button contrast (#00F0FF text to #0b0f19) — 30-minute fix, unblocks WCAG compliance",
    "Add <meta property='og:image'> and title tags — 1-hour fix, restores social sharing previews",
    "Replace 'Cancel'/'Submit' modal labels with 'Keep Surveying'/'Exit & Abandon' — 15 minutes, reduces accidental abandonment",
    "Set min-height on score containers to prevent CLS jumps — 20 minutes, improves Core Web Vitals score",
    "Add a single testimonial or logo strip above the primary CTA — 2 hours, typically lifts conversion 7–12%"
  ],
  categoryScores: {
    Performance: 82,
    Accessibility: 64,
    Heuristics: 88,
    Copy: 78,
    Conversion: 71,
    SEO: 59,
  },
  issues: [
    {
      id: "issue-1",
      category: "Accessibility",
      title: "Insufficient contrast ratio on interactive primary buttons",
      description: "The contrast between the white text and the neon-cyan button background (#00F0FF) is 2.1:1, failing the WCAG 2.1 AA requirement of at least 4.5:1 for normal text.",
      severity: "critical",
      law: "WCAG 2.1 AA 1.4.3 Contrast Minimum",
      impact: "Users with low vision or viewing the portal under bright sunlight cannot distinguish or read the text inside primary interactive elements.",
      recommendation: "Darken the text to a high-contrast deep slate (#0B0F19) or deepen the button color to deep sapphire to preserve readability while maintaining branding.",
      saving: "$1,200/yr (WCAG compliance risk mitigation)",
      effort: "low",
      priority: 1,
      codeBefore: `<button className="bg-[#00F0FF] text-white py-3 px-6 rounded-full font-bold">
  Complete Survey
</button>`,
      codeAfter: `<button className="bg-[#00F0FF] text-[#0b0f19] py-3 px-6 rounded-full font-bold transition-all hover:brightness-110 active:scale-98">
  Complete Survey
</button>`,
      location: "components/games/DartThrow.tsx:L42"
    },
    {
      id: "issue-2",
      category: "Heuristics",
      title: "Interactive targets too small for touch inputs",
      description: "Several click targets on mobile viewports measure 28×28px. The recommended minimum is 44×44px (Apple HIG) or 48×48dp (Android MD).",
      severity: "critical",
      law: "Fitts's Law / Apple HIG Touch Target Guidelines",
      impact: "Users on mobile devices suffer high frustration rates and accidental misclicks when interacting with dashboard sliders.",
      recommendation: "Expand the padding of the clickable area using a larger tap target container or increase padding inside utility class specifications.",
      saving: "Est. 6–9% mobile engagement lift",
      effort: "low",
      priority: 2,
      codeBefore: `<button className="w-7 h-7 flex items-center justify-center rounded-md border border-zinc-700">
  <ChevronRight size={14} />
</button>`,
      codeAfter: `<button className="w-11 h-11 flex items-center justify-center rounded-md border border-zinc-700 transition-colors hover:bg-zinc-800 md:w-9 md:h-9">
  <ChevronRight size={16} />
</button>`,
      location: "components/adventures/PizzaBuilder.tsx:L122"
    },
    {
      id: "issue-3",
      category: "Performance",
      title: "Unoptimized SVG illustration triggers layout repaint",
      description: "The custom dartboard visual triggers heavy layout re-paint operations during radial hit calculations because vectors contain inline XML and redundant path coordinates.",
      severity: "warning",
      law: "Core Web Vitals — Interaction to Next Paint (INP)",
      impact: "Triggers a micro-stutter (~80ms layout delay) during fast user interactions, diminishing the perceived premium fluidity.",
      recommendation: "Simplify SVG structures, use hardware-accelerated transforms (transform-gpu), and apply will-change to isolate drawing operations.",
      saving: "Est. 15–20% INP improvement",
      effort: "medium",
      priority: 5,
      codeBefore: `<svg className="w-full h-full" style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.5))" }}>
  <path d="..." />
</svg>`,
      codeAfter: `<svg className="w-full h-full transform-gpu will-change-transform filter drop-shadow-xl">
  <path d="..." />
</svg>`,
      location: "components/games/DartThrow.tsx:L14"
    },
    {
      id: "issue-4",
      category: "Copy",
      title: "Ambiguous microcopy on final submission modal",
      description: "The cancel button reads 'Cancel' while the submit button reads 'Submit'. However, the modal title is 'Are you sure you want to exit?' — creating cognitive dissonance.",
      severity: "warning",
      law: "Nielsen's Heuristic #10 — Help and Documentation",
      impact: "Users are unsure if 'Submit' exits without saving or saves and exits. Creates accidental data abandonment estimated at 4–7% of sessions.",
      recommendation: "Change labels to match explicit user actions: 'Exit & Abandon' (destructive rose) and 'Keep Surveying' (neutral/safe).",
      saving: "Est. $1,800/yr recovered from abandonment",
      effort: "low",
      priority: 3,
      codeBefore: `<div className="flex gap-4">
  <button>Cancel</button>
  <button>Submit</button>
</div>`,
      codeAfter: `<div className="flex gap-4">
  <button className="text-zinc-400 hover:text-white px-4 py-2 font-medium">Keep Surveying</button>
  <button className="bg-neon-rose text-white font-bold px-6 py-2 rounded-lg hover:brightness-110">Exit & Abandon</button>
</div>`,
      location: "components/adventures/PizzaBuilder.tsx:L280"
    },
    {
      id: "issue-5",
      category: "SEO",
      title: "Missing OpenGraph and Twitter meta tags",
      description: "No og:title, og:description, og:image, or twitter:card tags are present, meaning social shares render as plain-text links with no preview.",
      severity: "critical",
      law: "OpenGraph Protocol / Twitter Card Spec",
      impact: "Every social share of this product appears as a plain URL with no image or description — reducing click-through rate by an estimated 40–60% vs. a properly tagged page.",
      recommendation: "Add og:title, og:description, og:image (1200×630px), and twitter:card=summary_large_image to the <head>. Use Next.js metadata API for dynamic generation.",
      saving: "Est. $2,400/yr in organic traffic recovery",
      effort: "low",
      priority: 2,
      codeBefore: `<head>
  <title>UnboringSurveys</title>
</head>`,
      codeAfter: `<head>
  <title>UnboringSurveys — Make surveys people actually want to take</title>
  <meta property="og:title" content="UnboringSurveys" />
  <meta property="og:description" content="Game-like surveys with 3x completion rates." />
  <meta property="og:image" content="https://unboringsurveys.app/og-image.png" />
  <meta name="twitter:card" content="summary_large_image" />
</head>`,
      location: "app/layout.tsx or _document.tsx"
    },
    {
      id: "issue-6",
      category: "Conversion",
      title: "No social proof near primary CTA",
      description: "The main 'Get Started' CTA has no adjacent testimonial, user count, or trust signal — a pattern proven to reduce conversion anxiety.",
      severity: "warning",
      law: "Cialdini's Principle of Social Proof / CRO Best Practices",
      impact: "Absence of social proof near the CTA is correlated with 8–15% lower conversion rates in SaaS trial signups (industry benchmark data).",
      recommendation: "Add a compact trust row directly below the CTA: 3 avatar thumbnails + 'Joined by 2,400+ teams' or a single 5-star quote from a named customer.",
      saving: "Est. $3,200/yr conversion lift",
      effort: "low",
      priority: 3,
      codeBefore: `<button className="cta-primary">Get Started Free</button>`,
      codeAfter: `<div className="flex flex-col items-center gap-2">
  <button className="cta-primary">Get Started Free</button>
  <p className="text-sm text-zinc-400">
    Joined by <strong className="text-white">2,400+ teams</strong> · No credit card required
  </p>
</div>`,
      location: "components/landing/HeroSection.tsx"
    },
  ],
  businessSummary: "UnboringSurveys is a B2B SaaS product selling game-like survey tools to teams that want higher completion rates than traditional forms. Across the pages crawled (home, pricing, /games, /about), the strongest signal is a product-led growth motion with no visible sales-assist path — pricing is self-serve only and there's no 'talk to sales' or demo-booking option for larger teams. The biggest growth lever appears to be capturing mid-market interest that the current self-serve-only structure is silently turning away.",
  growthOpportunities: [
    {
      id: "growth-1",
      type: "feature",
      title: "No team/enterprise tier or sales-assist path",
      observation: "The /pricing page lists only two self-serve plans (Starter, Pro) with no 'Contact Sales' or custom-quote option, and no mention of SSO, seats, or admin controls anywhere on the site.",
      recommendation: "Add a third 'Team/Enterprise' tier with a 'Talk to us' CTA that routes to a booked call. Even a placeholder page capturing intent (name, company size, use case) validates demand before building enterprise features.",
      potentialImpact: "Mid-market deals in this category typically run 5-10x self-serve ARPU — capturing even 2-3 deals/quarter could add $20-40K/yr",
      confidence: "medium",
      validationStep: "Add the 'Contact Sales' link this week and watch for clicks/submissions over 30 days before investing in actual enterprise features",
    },
    {
      id: "growth-2",
      type: "process",
      title: "Manual onboarding implied by 'Book a walkthrough' CTA",
      observation: "The /get-started flow ends in a Calendly link rather than an in-product setup wizard, suggesting every new account currently requires a human-led onboarding call.",
      recommendation: "Instrument how many signups actually book a call vs. abandon. If volume is climbing, a self-serve interactive setup wizard (or a part-time onboarding specialist hire) would remove the bottleneck before it caps growth.",
      potentialImpact: "Removing a manual step from onboarding commonly lifts activation 15-25%; alternatively, a single part-time hire could 3x the number of accounts the team can onboard per month",
      confidence: "low",
      validationStep: "Pull last 90 days of Calendly booking vs. signup volume — if the gap is wide, that's your answer on build-vs-hire",
    },
    {
      id: "growth-3",
      type: "market",
      title: "No localized or vertical-specific landing pages",
      observation: "All marketing copy is generic 'for teams' — there are no industry-specific pages (e.g. 'for HR', 'for researchers', 'for educators') despite the product clearly supporting varied survey use cases shown in the /games gallery.",
      recommendation: "Stand up 2-3 vertical landing pages targeting the use cases already visible in the product (HR pulse surveys, classroom feedback, market research) — this is largely a copy + routing exercise, not new engineering.",
      potentialImpact: "Vertical pages typically convert 2-3x better on paid search than generic pages — could meaningfully lower customer acquisition cost",
      confidence: "medium",
      validationStep: "Launch one vertical page as an A/B test against the generic landing page using existing ad spend before committing to all three",
    },
  ],
};
