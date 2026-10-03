"use client";

import { useEffect, useRef } from "react";

/**
 * Small gold ring that follows the pointer and grows over interactive
 * elements. Transform-only. Hidden on touch devices and with reduced motion.
 */
export default function Cursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = ref.current;
    if (!fine || reduce || !el) return;

    document.body.classList.add("has-cursor");
    let x = -100, y = -100, cx = -100, cy = -100, scale = 1, target = 1;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      const t = e.target as HTMLElement | null;
      const hit = t?.closest("a, button, [role='button'], input, [data-cursor]");
      target = hit ? 2.4 : 1;
      el.style.opacity = "1";
    };
    const onLeave = () => { el.style.opacity = "0"; };

    const loop = () => {
      cx += (x - cx) * 0.2;
      cy += (y - cy) * 0.2;
      scale += (target - scale) * 0.16;
      el.style.transform = `translate3d(${cx - 11}px, ${cy - 11}px, 0) scale(${scale})`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      document.body.classList.remove("has-cursor");
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="cursor-ring pointer-events-none fixed left-0 top-0 z-[100] h-[22px] w-[22px] rounded-full border border-gold opacity-0 transition-opacity duration-300"
      style={{ willChange: "transform" }}
    />
  );
}
