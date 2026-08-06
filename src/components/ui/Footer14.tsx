"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion, type Variants } from "motion/react";

export interface Footer14Link {
  label: string;
  href: string;
}

export interface Footer14Column {
  title: string;
  links: Footer14Link[];
}

export interface Footer14Props {
  logoIcon?: ReactNode;
  brandName?: string;
  columns?: Footer14Column[];
  statusLabel?: string;
  statusValue?: string;
  copyright?: string;
  heroBrandName?: string;
}

const defaultColumns: Footer14Column[] = [
  {
    title: "PRODUCT",
    links: [
      { label: "How it works", href: "/#how-it-works" },
      { label: "What you get", href: "/#what-you-get" },
      { label: "Pricing", href: "/#pricing" },
      { label: "Questions", href: "/#questions" },
    ],
  },
  {
    title: "GET STARTED",
    links: [
      { label: "Start your assessment", href: "/discovery" },
      { label: "EraseFriction", href: "https://erasefriction.com" },
    ],
  },
];

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const navStagger: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.02 } },
};

const riseItem: Variants = {
  hidden: { opacity: 0, y: 18, filter: "blur(6px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", duration: 0.6, bounce: 0 } },
};

const linkStagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};

const linkItem: Variants = {
  hidden: { opacity: 0, y: 5 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", duration: 0.4, bounce: 0 } },
};

const bottomBarItem: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const heroBrandVariant: Variants = {
  hidden: { opacity: 0, y: 40, filter: "blur(12px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", duration: 1.1, bounce: 0 } },
};

function LogoMark() {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
      <span className="text-[13px] font-bold leading-none text-white">▲</span>
    </span>
  );
}

function isExternal(href: string) {
  return href.startsWith("http");
}

export function Footer14({
  logoIcon,
  brandName = "AssessAI",
  columns = defaultColumns,
  statusLabel = "System status :",
  statusValue = "All systems operational",
  copyright = "© 2026 AssessAI, powered by EraseFriction.",
  heroBrandName = "AssessAI",
}: Footer14Props) {
  return (
    <footer className="w-full overflow-hidden rounded-t-4xl bg-[var(--c-ink)] font-sans antialiased">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        className="px-6 pt-10 pb-0 sm:px-10 lg:px-14 xl:px-20"
      >
        <div className="mx-auto flex max-w-[1440px] flex-col gap-8 lg:flex-row lg:gap-12 xl:gap-16">
          <motion.div variants={riseItem} className="flex shrink-0 items-start justify-start gap-2.5 -translate-y-2">
            <span className="shrink-0">{logoIcon ?? <LogoMark />}</span>
            <span className="mt-0.5 text-lg font-normal tracking-wide text-gray-100 uppercase select-none">
              {brandName}
            </span>
          </motion.div>

          <motion.nav
            variants={navStagger}
            aria-label="Footer navigation"
            className="grid flex-1 grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:gap-x-6 xl:gap-x-8"
          >
            {columns.map((col) => (
              <motion.div key={col.title} variants={riseItem}>
                <h3 className="text-lg leading-none font-normal tracking-wide text-balance text-gray-100 uppercase">
                  {col.title}
                </h3>
                <motion.ul variants={linkStagger} className="mt-4 space-y-[10px]">
                  {col.links.map((link) => (
                    <motion.li key={link.label} variants={linkItem}>
                      {isExternal(link.href) ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-md leading-none font-light text-white/70 transition-colors duration-200 hover:text-white"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-md leading-none font-light text-white/70 transition-colors duration-200 hover:text-white"
                        >
                          {link.label}
                        </Link>
                      )}
                    </motion.li>
                  ))}
                </motion.ul>
              </motion.div>
            ))}
          </motion.nav>
        </div>

        <motion.div variants={bottomBarItem} className="mx-auto mt-4 max-w-[1440px] border-t border-white/15">
          <div className="flex flex-col gap-3 py-4 text-[13px] sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <p className="text-md font-normal text-white/70">
              {statusLabel}
              <span className="ml-2 font-light text-gray-100">{statusValue}</span>
            </p>
            <p className="text-md font-normal text-white/70">{copyright}</p>
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        variants={heroBrandVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="relative flex items-end justify-center overflow-hidden bg-[var(--c-ink)] px-6 pt-6 sm:pt-8 md:pt-14"
        style={{ minHeight: "clamp(140px, 20vw, 260px)" }}
      >
        <p
          aria-hidden="true"
          className="translate-y-1 text-center font-sans leading-[0.82] font-bold tracking-[-0.02em] text-white/10 select-none text-shadow-xs md:translate-y-8"
          style={{ fontSize: "clamp(3rem, 15vw, 22rem)" }}
        >
          {heroBrandName}
        </p>
      </motion.div>
    </footer>
  );
}

export default Footer14;
