"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { EASE } from "@/lib/motion";
import { hero } from "@/lib/content";
import ConstellationBg from "./ConstellationBg";

function RevealWords({
  text,
  start,
  className = "",
  italic = false,
}: {
  text: string;
  start: number;
  className?: string;
  italic?: boolean;
}) {
  return (
    <span className={className}>
      {text.split(" ").map((w, i) => (
        <span key={i} className="mask mr-[0.22em]">
          <motion.span
            className={`inline-block ${italic ? "italic" : ""}`}
            initial={{ y: "110%" }}
            animate={{ y: "0%" }}
            transition={{ duration: 1.1, ease: EASE, delay: start + i * 0.08 }}
          >
            {w}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

export default function Hero({ started }: { started: boolean }) {
  const t0 = started ? 0.1 : 999;
  const wrap = useRef<HTMLDivElement>(null);
  // The hero is pinned for 50svh of scroll while it fades back (opacity only).
  const { scrollYProgress } = useScroll({ target: wrap, offset: ["start start", "end start"] });
  const fade = useTransform(scrollYProgress, [0, 0.55], [1, 0]);
  return (
    <div ref={wrap} className="relative h-[150svh]">
    <motion.section
      id="top"
      style={{ opacity: fade }}
      className="sticky top-0 flex h-[100svh] min-h-[640px] w-full items-center overflow-hidden"
    >
      <ConstellationBg />

      <div className="relative z-10 mx-auto w-full max-w-[1500px] px-6 md:px-12">
        <motion.p
          className="micro mb-8 text-gold"
          initial={{ opacity: 0, y: 24 }}
          animate={started ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, ease: EASE }}
        >
          {hero.eyebrow}
        </motion.p>

        <h1 className="display text-[15vw] text-ivory md:text-[9vw]">
          <span className="block">
            <RevealWords text={hero.line1} start={t0} />
          </span>
          <span className="block text-gold">
            <RevealWords text={hero.line2} start={t0 + 0.25} italic />
          </span>
        </h1>

        <motion.p
          className="mt-8 max-w-[520px] text-base leading-relaxed text-ivory/70 md:text-lg"
          initial={{ opacity: 0, y: 24 }}
          animate={started ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, ease: EASE, delay: 0.8 }}
        >
          {hero.subline}
        </motion.p>

        <motion.div
          className="mt-10 flex flex-wrap items-center gap-4"
          initial={{ opacity: 0, y: 24 }}
          animate={started ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, ease: EASE, delay: 0.88 }}
        >
          <a
            href="#access"
            className="micro rounded-full bg-ivory px-8 py-4 text-ink transition-transform duration-500 ease-nexus hover:scale-[1.03]"
          >
            {hero.primary}
          </a>
          <a
            href="#story"
            className="micro group flex items-center gap-3 rounded-full border border-hair px-7 py-4 text-ivory transition-colors duration-500 ease-nexus hover:border-gold/60"
          >
            <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden className="fill-gold">
              <path d="M0 0l10 6-10 6z" />
            </svg>
            {hero.secondary}
          </a>
        </motion.div>
      </div>

      {/* Scroll indicator: thin line with a travelling dot */}
      <div
        className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3"
        aria-hidden
      >
        <span className="micro text-ivory/50">{hero.scroll}</span>
        <div className="relative h-14 w-px bg-ivory/20">
          <span
            className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-gold"
            style={{ animation: "scroll-dot 2.2s cubic-bezier(0.22,1,0.36,1) infinite" }}
          />
        </div>
      </div>
    </motion.section>
    </div>
  );
}
