"use client";

import { useRef } from "react";
import { bento } from "@/lib/content";
import Reveal from "./Reveal";

/* Tiny looping SVG animations. Motion lives in CSS (see globals.css, .bt-*)
   so prefers-reduced-motion freezes them automatically. */

const stroke = { stroke: "#c8a96a", fill: "none", strokeWidth: 1 } as const;

function Decompose() {
  return (
    <svg viewBox="0 0 220 120" className="h-full w-full" aria-hidden>
      <rect x="14" y="54" width="64" height="6" rx="3" fill="#f1ede4" opacity="0.8" />
      <rect x="14" y="64" width="40" height="3" rx="1.5" fill="#f1ede4" opacity="0.35" />
      {[24, 60, 96].map((y, i) => (
        <g key={y}>
          <path d={`M82 58 C 110 58, 120 ${y}, 150 ${y}`} className="bt-dash" {...stroke} strokeDasharray="3 5" opacity="0.7" />
          <circle cx="160" cy={y} r="6" fill="#c8a96a" className="bt-pulse" style={{ animationDelay: `${i * 0.35}s` }} />
        </g>
      ))}
    </svg>
  );
}

function KnowledgeGraph() {
  const n = [
    [40, 30], [100, 20], [160, 44], [70, 78], [130, 92], [180, 100], [28, 104],
  ];
  const e = [[0, 1], [1, 2], [0, 3], [3, 4], [1, 4], [2, 5], [4, 5], [3, 6]];
  return (
    <svg viewBox="0 0 210 120" className="h-full w-full" aria-hidden>
      {e.map(([a, b], i) => (
        <line key={i} x1={n[a][0]} y1={n[a][1]} x2={n[b][0]} y2={n[b][1]} {...stroke} opacity="0.35" strokeDasharray="2 4" className="bt-dash" />
      ))}
      {n.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="4" fill="#c8a96a" className="bt-pulse" style={{ animationDelay: `${i * 0.28}s` }} />
      ))}
    </svg>
  );
}

function Reflection() {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden>
      <circle cx="60" cy="60" r="34" {...stroke} opacity="0.35" />
      <circle cx="60" cy="60" r="34" {...stroke} strokeDasharray="6 10" className="bt-spin" opacity="0.8" />
      <g className="bt-spin" style={{ animationDuration: "4s" }}>
        <circle cx="60" cy="26" r="4.5" fill="#f1ede4" />
      </g>
      <circle cx="60" cy="60" r="3" fill="#c8a96a" className="bt-pulse" />
    </svg>
  );
}

function Hybrid() {
  const dense = Array.from({ length: 11 }, (_, i) => i);
  return (
    <svg viewBox="0 0 220 120" className="h-full w-full" aria-hidden>
      {dense.map((i) => (
        <rect key={i} x={14 + i * 7} y="30" width="2.5" height="60" fill="#f1ede4" opacity="0.55" className="bt-bar" style={{ animationDelay: `${(i % 5) * 0.2}s` }} />
      ))}
      {[0, 1, 2].map((i) => (
        <rect key={i} x={120 + i * 28} y="30" width="14" height="60" fill="#c8a96a" opacity="0.8" className="bt-bar" style={{ animationDelay: `${i * 0.45}s` }} />
      ))}
      <line x1="104" y1="20" x2="104" y2="100" {...stroke} opacity="0.4" />
    </svg>
  );
}

function Attribution() {
  return (
    <svg viewBox="0 0 220 120" className="h-full w-full" aria-hidden>
      {[26, 44, 62, 80, 98].map((y, i) => (
        <rect key={y} x="14" y={y} width={150 - (i % 3) * 22} height="4" rx="2" fill="#f1ede4" opacity="0.28" />
      ))}
      <rect x="10" y="40" width="160" height="20" fill="#c8a96a" opacity="0.16" className="bt-sweep" />
      <g className="bt-tag">
        <rect x="176" y="42" width="30" height="16" rx="8" {...stroke} />
        <text x="191" y="54" textAnchor="middle" fontSize="9" fill="#c8a96a" fontFamily="monospace">[1]</text>
      </g>
    </svg>
  );
}

function Routing() {
  const targets = [22, 60, 98];
  return (
    <svg viewBox="0 0 220 120" className="h-full w-full" aria-hidden>
      <circle cx="26" cy="60" r="7" fill="#f1ede4" />
      {targets.map((y, i) => (
        <g key={y}>
          <path d={`M33 60 C 90 60, 110 ${y}, 170 ${y}`} {...stroke} strokeDasharray="3 5" className="bt-dash" opacity="0.7" />
          <rect x="172" y={y - 8} width="22" height="16" rx="2" {...stroke} className="bt-blink" style={{ animationDelay: `${i * 0.5}s` }} />
        </g>
      ))}
    </svg>
  );
}

const visuals: Record<string, () => React.ReactElement> = {
  decompose: Decompose,
  graph: KnowledgeGraph,
  reflect: Reflection,
  hybrid: Hybrid,
  attribution: Attribution,
  routing: Routing,
};

// Asymmetric 6-column layout
const spans = [
  "md:col-span-4",
  "md:col-span-2 md:row-span-2",
  "md:col-span-2",
  "md:col-span-2",
  "md:col-span-3",
  "md:col-span-3",
];

function Tile({ id, title, body, className }: { id: string; title: string; body: string; className: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const Visual = visuals[id];

  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || e.pointerType === "touch") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.transform = `perspective(900px) rotateX(${(0.5 - py) * 7}deg) rotateY(${(px - 0.5) * 9}deg)`;
    el.style.setProperty("--mx", `${px * 100}%`);
    el.style.setProperty("--my", `${py * 100}%`);
    el.style.setProperty("--spot", "1");
  };
  const leave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";
    el.style.setProperty("--spot", "0");
  };

  return (
    <div className={`${className} min-h-[260px]`} style={{ perspective: 900 }}>
      <div
        ref={ref}
        data-cursor
        tabIndex={0}
        onPointerMove={move}
        onPointerLeave={leave}
        onBlur={leave}
        className="hairline relative flex h-full flex-col justify-between overflow-hidden bg-graphite p-7 transition-transform duration-500 ease-nexus"
        style={{ transformStyle: "preserve-3d", willChange: "transform" }}
      >
        {/* Gold spotlight following the cursor (soft radial glow) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 transition-opacity duration-500 ease-nexus"
          style={{
            opacity: "var(--spot, 0)",
            background:
              "radial-gradient(260px circle at var(--mx, 50%) var(--my, 50%), rgba(200,169,106,0.16), rgba(200,169,106,0) 70%)",
          }}
        />
        <div className="relative mx-auto h-28 w-full max-w-[260px] flex-1 py-2">{Visual && <Visual />}</div>
        <div className="relative mt-6">
          <h3 className="display text-3xl text-ivory md:text-4xl">{title}</h3>
          <p className="mt-3 max-w-[38ch] text-sm leading-relaxed text-ivory/65">{body}</p>
        </div>
      </div>
    </div>
  );
}

export default function Bento() {
  return (
    <section id="capabilities" className="relative bg-ink px-6 py-32 md:px-12 md:py-44">
      <div className="mx-auto max-w-[1500px]">
        <Reveal>
          <p className="micro text-gold">{bento.eyebrow}</p>
        </Reveal>
        <Reveal i={1} as="h2" className="display mt-6 max-w-[14ch] text-[13vw] text-ivory md:text-[6.5vw]">
          {bento.title}
        </Reveal>

        <div className="mt-20 grid grid-cols-1 gap-3 md:grid-cols-6 md:auto-rows-[minmax(280px,auto)]">
          {bento.tiles.map((t, i) => (
            <Reveal key={t.id} i={i} className={spans[i]}>
              <Tile id={t.id} title={t.title} body={t.body} className="h-full" />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
