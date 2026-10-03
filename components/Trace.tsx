"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { trace } from "@/lib/content";
import { useReducedMotion } from "@/lib/motion";
import Reveal from "./Reveal";

type Line = { tag: string; text: string };

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export default function Trace() {
  const panel = useRef<HTMLDivElement>(null);
  const inView = useInView(panel, { once: true, margin: "0px 0px -25% 0px" });
  const reduce = useReducedMotion();
  const runId = useRef(0);
  const confRef = useRef(trace.lines[0].conf);

  const [query, setQuery] = useState("");
  const [done, setDone] = useState<Line[]>([]);
  const [current, setCurrent] = useState<Line | null>(null);
  const [conf, setConf] = useState(trace.lines[0].conf);
  const [running, setRunning] = useState(false);

  const tweenConf = useCallback((to: number, id: number) => {
    const from = confRef.current;
    if (from === to) return;
    const t0 = performance.now();
    const dur = 700;
    const step = (now: number) => {
      if (runId.current !== id) return;
      const k = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - k, 4);
      confRef.current = from + (to - from) * e;
      setConf(confRef.current);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, []);

  const play = useCallback(async () => {
    const id = ++runId.current;
    const alive = () => runId.current === id;
    const last = trace.lines[trace.lines.length - 1];

    if (reduce) {
      setQuery(trace.query);
      setDone(trace.lines.map(({ tag, text }) => ({ tag, text })));
      setCurrent(null);
      confRef.current = last.conf;
      setConf(last.conf);
      setRunning(false);
      return;
    }

    setRunning(true);
    setQuery("");
    setDone([]);
    setCurrent(null);
    confRef.current = trace.lines[0].conf;
    setConf(trace.lines[0].conf);

    for (let i = 1; i <= trace.query.length; i++) {
      if (!alive()) return;
      setQuery(trace.query.slice(0, i));
      await sleep(18);
    }
    await sleep(450);

    for (const l of trace.lines) {
      if (!alive()) return;
      for (let i = 1; i <= l.text.length; i++) {
        if (!alive()) return;
        setCurrent({ tag: l.tag, text: l.text.slice(0, i) });
        await sleep(10);
      }
      if (!alive()) return;
      setDone((d) => [...d, { tag: l.tag, text: l.text }]);
      setCurrent(null);
      tweenConf(l.conf, id);
      await sleep(320);
    }
    if (alive()) setRunning(false);
  }, [reduce, tweenConf]);

  useEffect(() => {
    if (inView) play();
    return () => {
      runId.current++;
    };
  }, [inView, play]);

  const typingQuery = query.length < trace.query.length && running;

  return (
    <section id="trace" className="relative bg-ink px-6 py-32 md:px-12 md:py-44">
      <div className="mx-auto grid max-w-[1500px] gap-16 md:grid-cols-12">
        <div className="md:col-span-4">
          <Reveal>
            <p className="micro text-gold">{trace.eyebrow}</p>
          </Reveal>
          <Reveal i={1} as="h2" className="display mt-6 text-[13vw] text-ivory md:text-[5.6vw]">
            {trace.title}
          </Reveal>
        </div>

        <Reveal i={2} className="md:col-span-8">
          <div ref={panel} className="hairline overflow-hidden bg-graphite">
            <div className="flex items-center justify-between border-b border-hair px-5 py-4">
              <span className="micro text-ivory/50">nexus · trace</span>
              <div className="flex items-center gap-6">
                <span className="micro tabular-nums text-ivory/60">
                  {trace.confidenceLabel} <span className="text-gold">{conf.toFixed(2)}</span>
                </span>
                <button
                  onClick={() => play()}
                  className="micro rounded-full border border-hair px-4 py-2 text-ivory/80 transition-colors duration-500 ease-nexus hover:border-gold/60 hover:text-gold"
                >
                  {trace.replay}
                </button>
              </div>
            </div>

            {/* Thin confidence bar (transform only) */}
            <div className="h-px w-full bg-ivory/10">
              <div
                className="h-px origin-left bg-gold"
                style={{ transform: `scaleX(${Math.min(1, Math.max(0, (conf - 0.5) / 0.5))})` }}
              />
            </div>

            <div
              className="min-h-[360px] space-y-3 p-5 font-mono text-[12px] leading-relaxed md:p-8 md:text-[13px]"
              aria-hidden
            >
              <p className="text-ivory">
                <span className="mr-3 text-gold">›</span>
                {query}
                {typingQuery && <Caret />}
              </p>
              {done.map((l, i) => (
                <TraceLine key={i} l={l} />
              ))}
              {current && <TraceLine l={current} caret />}
              {!running && done.length === trace.lines.length && <Caret />}
            </div>

            {/* Screen-reader version of the finished trace */}
            <div className="sr-only">
              <p>{trace.query}</p>
              <ul>
                {trace.lines.map((l) => (
                  <li key={l.tag}>
                    {l.tag}: {l.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Caret() {
  return (
    <span
      className="ml-1 inline-block h-[1em] w-[7px] translate-y-[2px] bg-gold"
      style={{ animation: "blink 1s steps(1) infinite" }}
    />
  );
}

function TraceLine({ l, caret = false }: { l: Line; caret?: boolean }) {
  return (
    <p className="text-ivory/80">
      <span className="mr-3 inline-block min-w-[104px] text-gold">[{l.tag}]</span>
      {l.text}
      {caret && <Caret />}
    </p>
  );
}
