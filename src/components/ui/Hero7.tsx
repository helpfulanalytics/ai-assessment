"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { ArrowDown, ArrowRight, Menu, X } from "lucide-react";

export interface Hero7NavItem {
  label: string;
  href: string;
  active?: boolean;
}

export interface Hero7Props {
  logo?: ReactNode;
  logoText?: string;
  navItems?: Hero7NavItem[];
  signupText?: string;
  signupHref?: string;
  title?: string;
  titleAccent?: string;
  description?: string;
  primaryCtaText?: string;
  primaryCtaHref?: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
  scrollText?: string;
  scrollHref?: string;
  backgroundImage?: string;
}

const navItemsDefault: Hero7NavItem[] = [
  { label: "How it works", href: "#how-it-works", active: true },
  { label: "What you get", href: "#what-you-get" },
  { label: "Pricing", href: "#pricing" },
  { label: "Questions", href: "#questions" },
];

const navVariants: Variants = {
  hidden: { opacity: 0, y: -22, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", duration: 0.65, bounce: 0, delay: 0.2 },
  },
};

const copyContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { delayChildren: 0.12, staggerChildren: 0.25 },
  },
};

const copyItem: Variants = {
  hidden: { opacity: 0, x: -34, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { type: "spring", duration: 0.72, bounce: 0, delay: 0.7 },
  },
};

const imageVariants: Variants = {
  hidden: { opacity: 0, y: 86, scale: 1.04, filter: "blur(12px)" },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { type: "spring", duration: 1.5, bounce: 0 },
  },
};

/** The site mark, matching the one used in the app header and on reports. */
function LogoMark() {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--c-violet)]">
      <span className="text-[13px] font-bold leading-none text-white">▲</span>
    </span>
  );
}

/**
 * Internal routes go through next/link; in-page anchors and external links stay
 * plain anchors. Wrapping every href in Link would prefetch "#pricing" as a route.
 */
function isRoute(href: string) {
  return href.startsWith("/");
}

/** Hoisted: creating this inside Cta would rebuild the component on every render. */
const MotionLink = motion.create(Link);

function Cta({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  return isRoute(href) ? (
    <MotionLink href={href} whileTap={{ scale: 0.96 }} className={className}>
      {children}
    </MotionLink>
  ) : (
    <motion.a href={href} whileTap={{ scale: 0.96 }} className={className}>
      {children}
    </motion.a>
  );
}

export function Hero7({
  logo,
  logoText = "AssessAI",
  navItems = navItemsDefault,
  signupText = "Start — $297",
  signupHref = "/discovery",
  title = "You know your business is wasting time.",
  titleAccent = "This tells you where.",
  description = "A 15-minute interview about how your business actually runs. Then a written assessment of every bottleneck it found, the tools that fix each one, and a four-day plan to start.",
  primaryCtaText = "Start your assessment",
  primaryCtaHref = "/discovery",
  secondaryCtaText = "See what's in the report",
  secondaryCtaHref = "#what-you-get",
  scrollText = "Scroll to see how it works",
  scrollHref = "#how-it-works",
  backgroundImage = "https://assets.watermelon.sh/hero-7-bg.avif",
}: Hero7Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <section className="relative isolate flex min-h-screen w-full overflow-hidden bg-[var(--c-porcelain)] font-sans text-[var(--c-ink)] antialiased">
      <div className="absolute inset-0 bg-[var(--c-porcelain)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_31%_22%,rgba(255,255,255,0.55),transparent_34%),linear-gradient(180deg,rgba(237,233,255,0.96)_0%,rgba(248,250,253,0.86)_42%,rgba(255,255,255,0.42)_100%)]" />

      <motion.div
        variants={imageVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.35 }}
        className="absolute inset-0"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={backgroundImage}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover opacity-60 outline outline-1 outline-black/10"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--c-canvas)]/60 via-[var(--c-porcelain)]/30 to-[var(--c-violet-bg)]/40" />
      </motion.div>

      <div className="relative z-10 flex min-h-[720px] w-full flex-col px-7 py-4 sm:min-h-screen sm:px-10 lg:px-12">
        <motion.header
          variants={navVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.8 }}
          className="flex items-center justify-between"
        >
          <Link href="/" className="flex min-h-10 items-center gap-2">
            {logo ?? <LogoMark />}
            <span className="flex flex-col leading-none">
              <span className="text-2xl font-normal tracking-tight text-[var(--c-ink)]">{logoText}</span>
              <span className="mt-1 text-[10px] text-[var(--c-slate)]">powered by EraseFriction</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-2 rounded-full md:flex">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={
                  item.active
                    ? "inline-flex min-h-10 items-center rounded-full bg-[var(--c-violet-bg)] px-6 text-base font-medium text-[var(--c-ink)] shadow-[0_1px_0_0.5px_rgba(255,255,255,0.15)_inset,0_8px_18px_rgba(13,148,136,0.1)] transition-[background-color,transform] duration-200 active:scale-[0.96]"
                    : "inline-flex min-h-8 items-center px-2 text-base font-medium text-[var(--c-slate)] transition-colors duration-200 hover:text-[var(--c-violet)]"
                }
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-5 md:flex">
            <Cta
              href={signupHref}
              className="inline-flex min-h-10 items-center rounded-[10px] bg-[var(--c-violet-bg)] px-6 text-base font-medium text-[var(--c-ink)] shadow-[0_1px_0_0.5px_rgba(255,255,255,0.7)_inset,0_10px_24px_rgba(13,148,136,0.08)] transition-[background-color,transform,box-shadow] duration-200 hover:bg-white"
            >
              {signupText}
            </Cta>
          </div>

          <button
            type="button"
            aria-label="Open navigation menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(true)}
            className="flex min-h-10 min-w-10 items-center justify-center rounded-[10px] bg-white text-[var(--c-ink)] shadow-[0_8px_18px_rgba(13,148,136,0.08)] transition-transform duration-200 active:scale-[0.96] md:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>
        </motion.header>

        <AnimatePresence initial={false}>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -12, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
              transition={{ type: "spring", duration: 0.3, bounce: 0 }}
              className="fixed inset-x-4 top-4 z-50 rounded-2xl bg-white/92 p-4 shadow-2xl shadow-[var(--c-violet)]/10 outline-1 outline-black/10 backdrop-blur-xl md:hidden"
            >
              <div className="flex items-center justify-between pl-3">
                <Link href="/" className="flex items-center gap-2 text-[var(--c-ink)]">
                  {logo ?? <LogoMark />}
                  <span className="text-2xl font-normal">{logoText}</span>
                </Link>
                <button
                  type="button"
                  aria-label="Close navigation menu"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex min-h-10 min-w-10 items-center justify-center rounded-[10px] text-[var(--c-ink)] transition-[background-color,transform] duration-200 hover:bg-[var(--c-violet-bg)] active:scale-[0.96]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="mt-6 grid gap-1">
                {navItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl px-3 py-3 text-base font-medium text-[var(--c-ink)] transition-colors duration-200 hover:bg-[var(--c-violet-bg)]"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>

              <Cta
                href={signupHref}
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[var(--c-violet)] px-5 text-sm font-semibold text-white transition-[background-color,transform] duration-200 hover:opacity-90"
              >
                {signupText}
              </Cta>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative flex flex-1 items-start pt-16 sm:pt-24 lg:pt-28">
          <motion.div
            variants={copyContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.42 }}
          >
            <motion.h1
              variants={copyItem}
              className="w-full max-w-7xl text-[clamp(3.3rem,8vw,5.15rem)] leading-[0.96] font-normal text-[var(--c-ink)]"
            >
              <span className="block tracking-tight">{title}</span>
              <span className="mt-1 block font-serif text-[0.88em] leading-[0.95] font-normal italic text-[var(--c-violet)]">
                {titleAccent}
              </span>
            </motion.h1>

            <motion.p
              variants={copyItem}
              className="mt-6 w-full max-w-xl text-base leading-[1.55] font-medium text-pretty text-[var(--c-slate)]"
            >
              {description}
            </motion.p>

            <motion.div variants={copyItem} className="mt-6 flex flex-wrap items-center gap-6">
              <Cta
                href={primaryCtaHref}
                className="inline-flex min-h-12 items-center justify-center rounded-[10px] bg-gradient-to-b from-[var(--c-violet)] to-[#115e59] px-9 text-base font-normal text-white shadow-[0_12px_30px_rgba(13,148,136,0.22),inset_0_-0.5px_2px_1px_rgba(0,0,0,0.28),inset_0_0_0_1px_rgba(255,255,255,0.12)] transition-[background-color,transform,box-shadow] duration-200 hover:opacity-95"
              >
                {primaryCtaText}
              </Cta>

              <a
                href={secondaryCtaHref}
                className="group inline-flex min-h-10 items-center gap-2 text-base font-medium text-[var(--c-ink)] transition-colors duration-200 hover:text-[var(--c-violet)]"
              >
                <span>{secondaryCtaText}</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </a>
            </motion.div>
          </motion.div>

          <motion.a
            href={scrollHref}
            variants={copyItem}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            className="absolute right-0 bottom-[24%] hidden min-h-10 items-center gap-3 text-sm font-medium text-[var(--c-ink)] transition-colors duration-200 hover:text-[var(--c-violet)] lg:inline-flex"
          >
            <span>{scrollText}</span>
            <ArrowDown className="h-3 w-3" />
          </motion.a>
        </div>
      </div>
    </section>
  );
}

export default Hero7;
