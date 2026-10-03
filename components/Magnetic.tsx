"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

/**
 * Magnetic hover: the child is pulled toward the cursor while the pointer is
 * within reach, then springs back. Transform-only; off for touch and
 * reduced motion.
 */
export default function Magnetic({
  children,
  strength = 0.35,
}: {
  children: React.ReactNode;
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 180, damping: 16, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 180, damping: 16, mass: 0.4 });

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = ref.current!.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  // The outer padding enlarges the reach so the pull starts before the cursor touches the button.
  return (
    <div ref={ref} onPointerMove={onMove} onPointerLeave={reset} className="inline-block p-10">
      <motion.div style={{ x: sx, y: sy }}>{children}</motion.div>
    </div>
  );
}
