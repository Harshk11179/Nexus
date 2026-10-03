"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { detectWebGL, useIsMobile, useReducedMotion } from "@/lib/motion";

// Lazy-loaded: three.js never ships in the initial bundle.
const Constellation = dynamic(() => import("./Constellation"), { ssr: false });

/**
 * Wrapper that decides whether to mount the WebGL canvas at all.
 * - ~1,500 particles on desktop, 400 on mobile
 * - static radial glow if WebGL is unavailable
 * - the canvas mounts after idle so it never blocks first paint
 */
export default function ConstellationBg({ className = "" }: { className?: string }) {
  const mobile = useIsMobile();
  const reduce = useReducedMotion();
  const [ready, setReady] = useState(false);
  const [gl, setGl] = useState(true);

  useEffect(() => {
    setGl(detectWebGL());
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(() => setReady(true));
    else setTimeout(() => setReady(true), 200);
  }, []);

  return (
    <div className={`absolute inset-0 ${className}`} aria-hidden>
      {/* Soft radial glow: also the static fallback */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 55% at 50% 50%, rgba(200,169,106,0.14) 0%, rgba(7,7,10,0) 70%)",
        }}
      />
      {gl && ready && <Constellation count={mobile ? 400 : 1500} reduce={reduce} />}
    </div>
  );
}
