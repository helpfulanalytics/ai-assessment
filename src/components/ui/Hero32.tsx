"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { ArrowRight } from "lucide-react";

export interface Hero32NavItem {
  label: string;
  href: string;
}

export interface Hero32Props {
  logoText?: string;
  navItems?: Hero32NavItem[];
  loginText?: string;
  loginHref?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  primaryActionText?: string;
  primaryActionHref?: string;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
  reassurance?: ReactNode;
  backgroundImage?: string;
}

/* The reference ships navItems as a string[] with every href set to "#". Ours
   carries real hrefs, because these are the page's own section anchors. */
const navItemsDefault: Hero32NavItem[] = [
  { label: "How it works", href: "#how-it-works" },
  { label: "What you get", href: "#what-you-get" },
  { label: "Pricing", href: "#pricing" },
  { label: "Questions", href: "#questions" },
];

// Nav: single element, drops in from top with blur.
const navVariants: Variants = {
  hidden: { opacity: 0, y: -24, filter: "blur(8px)", scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    scale: 1,
    transition: { type: "spring", damping: 24, stiffness: 120, duration: 0.6 },
  },
};

// Title: rises up with a heavier mass — slow, majestic settling.
const titleVariants: Variants = {
  hidden: { opacity: 0, y: 36, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", damping: 28, stiffness: 80, mass: 1.4, delay: 0.35 },
  },
};

// Subtitle: lighter, quicker.
const subtitleVariants: Variants = {
  hidden: { opacity: 0, y: 18, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", damping: 22, stiffness: 110, delay: 0.65 },
  },
};

// CTA group: scale up from slightly small + fade.
const ctaVariants: Variants = {
  hidden: { opacity: 0, scale: 0.92, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", damping: 20, stiffness: 140, delay: 0.85 },
  },
};

/**
 * The site mark. Drawn on currentColor rather than a fixed fill so one copy
 * works on the light nav pill and on a dark ground without a second asset.
 */
function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 256 256"
      role="img"
      aria-label="AssessAI"
      className={`size-7 shrink-0 ${className}`}
      fill="currentColor"
    >
      <path d="M 100 136 C 111.046 136 120 144.954 120 156 L 120 256 L 100 256 C 44.772 256 0 211.228 0 156 L 0 136 Z M 256 256 L 136 256 L 136 156 C 136 144.954 144.954 136 156 136 L 256 136 Z M 120 100 C 120 111.046 111.046 120 100 120 L 0 120 L 0 100 C 0 44.772 44.772 0 100 0 L 120 0 Z M 156 0 C 211.228 0 256 44.772 256 100 L 256 120 L 156 120 C 144.954 120 136 111.046 136 100 L 136 0 Z" />
    </svg>
  );
}

/**
 * Internal routes go through next/link; in-page anchors stay plain anchors.
 * Wrapping every href in Link would prefetch "#pricing" as a route.
 */
function isRoute(href: string) {
  return href.startsWith("/");
}

function Action({
  href,
  className,
  children,
  ariaLabel,
}: {
  href: string;
  className: string;
  children: ReactNode;
  ariaLabel?: string;
}) {
  return isRoute(href) ? (
    <Link href={href} aria-label={ariaLabel} className={className}>
      {children}
    </Link>
  ) : (
    <a href={href} aria-label={ariaLabel} className={className}>
      {children}
    </a>
  );
}

export function Hero32({
  logoText = "AssessAI",
  navItems = navItemsDefault,
  loginText = "Start — $297",
  loginHref = "/start",
  title = (
    <>
      You know your business <br />
      is wasting time. <br />
      <span className="italic">This tells you where.</span>
    </>
  ),
  subtitle = (
    <>
      A 15-minute interview about how your business actually runs.{" "}
      <br className="hidden md:block" />
      Then a written assessment of every bottleneck, and the tools that fix each one.
    </>
  ),
  primaryActionText = "Start your assessment",
  primaryActionHref = "/start",
  secondaryActionLabel = "See what's in the report",
  secondaryActionHref = "#what-you-get",
  reassurance = "No card to start \u00b7 About 15 minutes \u00b7 $297 only if you want the report",
  backgroundImage = "https://assets.watermelon.sh/hero-32-bg.avif",
}: Hero32Props) {
  /* Framer's transforms don't obey the global prefers-reduced-motion block in
     globals.css (that only zeroes CSS transitions), so opt out here instead. */
  const reduceMotion = useReducedMotion();
  const from = reduceMotion ? "visible" : "hidden";

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-[var(--c-violet)] font-sans antialiased selection:bg-white/20">
      <div className="pointer-events-none absolute inset-0 z-0 select-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src={backgroundImage}
          alt=""
          aria-hidden="true"
        />
        {/* Legibility scrim: the headline is longer than the reference's and
            sits over the brightest part of the sky, where white alone fails. */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,20,32,0.72)_0%,rgba(12,20,32,0.52)_38%,rgba(12,20,32,0.44)_70%,rgba(12,20,32,0.62)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(120%_85%_at_50%_38%,rgba(12,20,32,0.30)_0%,transparent_60%)]" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col pt-6">
        {/* Nav — single spring drop. Fixed rather than sticky so it follows the
            whole page: a sticky element only pins within its own scroll
            container, so inside this <section> it unpinned at the hero's edge.
            The wrapper owns the positioning and motion.nav owns its transform —
            a Tailwind -translate-x-1/2 here would be overwritten by the spring. */}
        <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
          <motion.nav
            variants={navVariants}
            initial={from}
            animate="visible"
            className="pointer-events-auto flex w-full max-w-3xl items-center justify-between gap-4 rounded-full bg-[var(--c-white)]/95 py-1.5 pr-1.5 pl-4 shadow-[0_1px_2px_rgba(16,24,40,0.06),0_8px_24px_rgba(16,24,40,0.10)] ring-1 ring-black/5 backdrop-blur-md sm:w-fit sm:gap-8"
          >
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 rounded-full text-[15px] font-semibold tracking-tight text-[var(--c-ink)]"
          >
            <LogoMark className="text-[var(--c-violet)]" />
            {logoText}
          </Link>
          <div className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="rounded-full px-3 py-2 text-[13.5px] font-medium text-[var(--c-slate)] transition-colors hover:bg-[var(--c-canvas)] hover:text-[var(--c-ink)]"
              >
                {item.label}
              </a>
            ))}
          </div>
          <Action
            href={loginHref}
            className="inline-flex min-h-10 shrink-0 items-center rounded-full bg-[var(--c-violet)] px-5 text-[13.5px] font-semibold text-white shadow-[0_1px_2px_rgba(16,24,40,0.10)] transition-colors hover:bg-[var(--c-violet-deep)]"
          >
              {loginText}
            </Action>
          </motion.nav>
        </div>

        {/* Hero Main Content — each element independently animated */}
        <div className="flex flex-1 items-center justify-center px-6 pt-10 pb-24">
          <div className="flex max-w-4xl flex-col items-center text-center 2xl:max-w-5xl">
            <motion.h1
              variants={titleVariants}
              initial={from}
              animate="visible"
              className="font-serif text-5xl leading-[1.02] font-normal tracking-tight text-white md:text-7xl md:leading-[0.98] lg:text-[5.5rem] lg:leading-[0.95] 2xl:text-[7rem]"
              style={{ textWrap: "balance" }}
            >
              {title}
            </motion.h1>

            <motion.p
              variants={subtitleVariants}
              initial={from}
              animate="visible"
              className="mt-5 max-w-2xl text-[15px] leading-relaxed font-normal text-white/85 md:text-[17px]"
              style={{ textWrap: "pretty" }}
            >
              {subtitle}
            </motion.p>

            <motion.div
              variants={ctaVariants}
              initial={from}
              animate="visible"
              className="mt-8 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-4"
            >
              <Action
                href={primaryActionHref}
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--c-violet)] px-7 text-[15px] font-semibold text-white shadow-[0_1px_2px_rgba(16,24,40,0.12),0_8px_24px_rgba(13,148,136,0.35)] transition-colors hover:bg-[var(--c-violet-deep)]"
              >
                {primaryActionText}
              </Action>
              <Action
                href={secondaryActionHref}
                ariaLabel={secondaryActionLabel}
                className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-6 text-[15px] font-medium text-white backdrop-blur-md transition-colors hover:border-white/50 hover:bg-white/20"
              >
                {secondaryActionLabel}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Action>
              </motion.div>

            <motion.p
              variants={ctaVariants}
              initial={from}
              animate="visible"
              className="mt-5 text-[13px] text-white/70"
            >
              {reassurance}
            </motion.p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero32;
