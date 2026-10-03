"use client";

import { finalCta } from "@/lib/content";
import ConstellationBg from "./ConstellationBg";
import Magnetic from "./Magnetic";
import Reveal from "./Reveal";

export default function FinalCta() {
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
          <Magnetic>
            <a
              href="mailto:access@nexus.example?subject=Request%20access"
              className="micro inline-block rounded-full bg-ivory px-10 py-5 text-ink"
            >
              {finalCta.button}
            </a>
          </Magnetic>
        </Reveal>
      </div>
    </section>
  );
}
