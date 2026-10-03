"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EASE } from "@/lib/motion";
import { preloader } from "@/lib/content";

/**
 * ~2s intro: a gold hairline draws across, NEXUS fades in letter by letter,
 * then the screen splits vertically (two halves slide apart). Skippable with
 * the button, Escape or Enter. Calls onDone when the halves are gone.
 */
export default function Preloader({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"play" | "split" | "gone">("play");

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setPhase("gone");
      onDone();
      return;
    }
    const t = window.setTimeout(() => setPhase("split"), 1500);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") setPhase((p) => (p === "play" ? "split" : p));
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);

  useEffect(() => {
    if (phase === "gone") return;
    document.documentElement.style.overflow = "hidden";
    return () => { document.documentElement.style.overflow = ""; };
  }, [phase]);

  if (phase === "gone") return null;
  const letters = preloader.word.split("");
  const splitting = phase === "split";

  return (
    <div className="fixed inset-0 z-[95]" role="status" aria-label="Loading">
      {/* Two halves that split apart vertically */}
      <motion.div
        className="absolute inset-y-0 left-0 w-1/2 bg-ink"
        animate={{ x: splitting ? "-100%" : "0%" }}
        transition={{ duration: 0.9, ease: EASE }}
        onAnimationComplete={() => {
          if (splitting) { setPhase("gone"); onDone(); }
        }}
      />
      <motion.div
        className="absolute inset-y-0 right-0 w-1/2 bg-ink"
        animate={{ x: splitting ? "100%" : "0%" }}
        transition={{ duration: 0.9, ease: EASE }}
      />

      <motion.div
        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
        animate={{ opacity: splitting ? 0 : 1 }}
        transition={{ duration: 0.4, ease: EASE }}
      >
        <div className="relative w-[min(70vw,520px)]">
          <motion.div
            className="h-px w-full origin-left bg-gold"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.9, ease: EASE }}
          />
        </div>
        <div className="mt-8 flex" aria-hidden>
          {letters.map((l, i) => (
            <motion.span
              key={i}
              className="display text-[10vw] text-ivory md:text-[72px]"
              style={{ letterSpacing: "0.18em", paddingLeft: i === 0 ? "0.18em" : 0 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.45 + i * 0.1 }}
            >
              {l}
            </motion.span>
          ))}
        </div>
      </motion.div>

      <AnimatePresence>
        {!splitting && (
          <motion.button
            key="skip"
            onClick={() => setPhase("split")}
            className="micro absolute bottom-8 right-8 text-ivory/60 transition-colors hover:text-gold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.6 }}
          >
            {preloader.skip}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
