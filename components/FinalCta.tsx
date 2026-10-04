"use client";

import { useState } from "react";
import { finalCta } from "@/lib/content";
import ConstellationBg from "./ConstellationBg";
import Magnetic from "./Magnetic";
import Reveal from "./Reveal";

export default function FinalCta() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    try {
      const r = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Something went wrong.");
      setState("done");
    } catch (err) {
      setState("error");
      setMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <section
      id="start"
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-ink px-6 py-32"
    >
      <ConstellationBg />
      <div className="relative z-10 flex flex-col items-center text-center">
        <Reveal as="h2" className="display max-w-[12ch] text-[17vw] text-ivory md:text-[10vw]">
          {finalCta.line}
        </Reveal>
        <Reveal i={1} className="mt-8">
          {state === "done" ? (
            <p className="micro text-gold">Request received</p>
          ) : (
            <form onSubmit={submit} className="flex flex-col items-center gap-3 md:flex-row">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                aria-label="Email address"
                className="w-[min(86vw,320px)] rounded-full border border-hair bg-transparent px-6 py-4 text-sm text-ivory placeholder:text-ivory/40"
              />
              <Magnetic>
                <button
                  type="submit"
                  disabled={state === "sending"}
                  className="micro rounded-full bg-ivory px-10 py-5 text-ink disabled:opacity-60"
                >
                  {finalCta.button}
                </button>
              </Magnetic>
            </form>
          )}
          {state === "error" && <p className="micro mt-4 text-ivory/60">{msg}</p>}
        </Reveal>
      </div>
    </section>
  );
}