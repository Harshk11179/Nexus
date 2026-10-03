"use client";

import { useEffect, useRef } from "react";
import { animate, useInView } from "framer-motion";
import { stats } from "@/lib/content";
import { EASE, useReducedMotion } from "@/lib/motion";
import Reveal from "./Reveal";

function Count({
  value,
  decimals,
  prefix,
  suffix,
}: {
  value: number;
  decimals: number;
  prefix: string;
  suffix: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const reduce = useReducedMotion();
  const fmt = (v: number) => `${prefix}${v.toFixed(decimals)}${suffix}`;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce) {
      el.textContent = fmt(value);
      return;
    }
    if (!inView) return;
    const c = animate(0, value, {
      duration: 2.2,
      ease: EASE,
      onUpdate: (v) => {
        el.textContent = fmt(v);
      },
    });
    return () => c.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduce, value]);

  return (
    <span ref={ref} aria-label={fmt(value)}>
      {fmt(0)}
    </span>
  );
}

export default function Stats() {
  return (
    <section id="numbers" className="relative bg-ink px-6 py-32 md:px-12 md:py-44">
      <div className="mx-auto max-w-[1500px]">
        <Reveal>
          <p className="micro text-gold">{stats.eyebrow}</p>
        </Reveal>
        {/* PLACEHOLDER FIGURES: the values live in lib/content.ts and are not real measurements. */}
        <div className="mt-16 grid grid-cols-2 border-l border-t border-hair md:grid-cols-4">
          {stats.items.map((s, i) => (
            <Reveal key={s.label} i={i} className="border-b border-r border-hair p-6 md:p-10">
              <p className="display text-[16vw] tabular-nums text-ivory md:text-[6.4vw]">
                <Count value={s.value} decimals={s.decimals} prefix={s.prefix} suffix={s.suffix} />
              </p>
              <p className="micro mt-6 text-ivory/55">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
