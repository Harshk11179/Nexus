"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { story } from "@/lib/content";
import { EASE, detectWebGL, useIsMobile, useReducedMotion } from "@/lib/motion";
import type { Progress } from "./StoryScene";

// Lazy-loaded: the 3D scene only downloads when the section is near the viewport.
const StoryScene = dynamic(() => import("./StoryScene"), { ssr: false });

/**
 * SCROLL TIMELINE
 *
 * The section is 500vh tall. Inside it a `position: sticky` 100svh stage
 * stays on screen while the page scrolls past, which is the "pin". (CSS
 * sticky is used instead of ScrollTrigger's pin so it cooperates with Lenis
 * and never creates a pin-spacer that can drift out of sync.)
 *
 * One GSAP tween drives a single number, prog.p, from 0 to 1 over the whole
 * 500vh, scrubbed with a 0.8s lag for a filmic ease. Everything reads it:
 *
 *   p 0.0 – 0.2   stage 01 DECOMPOSE
 *   p 0.2 – 0.4   stage 02 ROUTE
 *   p 0.4 – 0.6   stage 03 RETRIEVE
 *   p 0.6 – 0.8   stage 04 CONNECT
 *   p 0.8 – 1.0   stage 05 SYNTHESIZE
 *
 *  - the R3F scene (StoryScene) reads prog.p every frame and derives each
 *    object's state from it, so scrolling backwards plays the film in reverse
 *  - the left-hand text switches when floor(p * 5) changes
 *  - the right-edge bar fills segment i by clamp(p * 5 - i)
 *
 * Reduced motion: no scrub, section is one viewport tall, p is fixed at 1
 * and the final stage is shown as a static state.
 */
export default function ScrollStory() {
  const section = useRef<HTMLElement>(null);
  const prog = useRef<Progress>({ p: 0 }).current;
  const fills = useRef<(HTMLSpanElement | null)[]>([]);
  const [stage, setStage] = useState(0);
  const [mount, setMount] = useState(false);
  const [gl, setGl] = useState(true);
  const reduce = useReducedMotion();
  const mobile = useIsMobile();

  // Mount the canvas only when the section is close to the viewport.
  useEffect(() => {
    setGl(detectWebGL());
    const el = section.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setMount(true);
          io.disconnect();
        }
      },
      { rootMargin: "100% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const paint = (p: number) => {
      fills.current.forEach((el, i) => {
        if (el) el.style.transform = `scaleY(${Math.min(1, Math.max(0, p * 5 - i))})`;
      });
    };
    if (reduce) {
      prog.p = 1;
      setStage(4);
      paint(1);
      return;
    }
    prog.p = 0;
    const el = section.current!;
    const ctx = gsap.context(() => {
      gsap.to(prog, {
        p: 1,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top top", end: "bottom bottom", scrub: 0.8 },
        onUpdate: () => {
          const s = Math.min(4, Math.floor(prog.p * 5));
          setStage((prev) => (prev === s ? prev : s));
          paint(prog.p);
        },
      });
    }, el);
    return () => ctx.revert();
  }, [reduce, prog]);

  const s = story.stages[stage];

  return (
    <section
      ref={section}
      id="story"
      aria-label={story.eyebrow}
      className="relative bg-ink"
      style={{ height: reduce ? "100svh" : "500vh" }}
    >
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        {/* Radial glow behind the scene (also the fallback without WebGL) */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(45% 50% at 68% 50%, rgba(200,169,106,0.10) 0%, rgba(7,7,10,0) 70%)",
          }}
        />
        {gl && mount && (
          <div className="absolute inset-0" aria-hidden>
            <StoryScene prog={prog} reduce={reduce} mobile={mobile} />
          </div>
        )}

        {/* Left: stage number, title, one sentence */}
        <div className="pointer-events-none relative z-10 mx-auto flex h-full max-w-[1500px] flex-col justify-end px-6 pb-14 md:justify-center md:px-12 md:pb-0">
          <p className="micro mb-10 text-ivory/50">{story.eyebrow}</p>
          <div className="min-h-[220px] max-w-[420px]" aria-live="polite">
            <AnimatePresence mode="wait">
              <motion.div
                key={stage}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.7, ease: EASE }}
              >
                <p className="micro mb-4 text-gold">
                  {s.n} <span className="text-ivory/30">/ 05</span>
                </p>
                <h2 className="display text-[14vw] text-ivory md:text-[5.6vw]">{s.title}</h2>
                <p className="mt-5 text-base leading-relaxed text-ivory/70 md:text-lg">{s.body}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Right edge: 5-segment progress bar */}
        <div
          aria-hidden
          className="absolute right-4 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-2 md:right-8"
        >
          {story.stages.map((st, i) => (
            <div key={st.n} className="relative h-12 w-px overflow-hidden bg-ivory/15 md:h-16">
              <span
                ref={(el) => {
                  fills.current[i] = el;
                }}
                className="absolute inset-0 origin-top bg-gold"
                style={{ transform: "scaleY(0)" }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
