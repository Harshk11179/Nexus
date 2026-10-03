import { stack } from "@/lib/content";
import Reveal from "./Reveal";

export default function Stack() {
  return (
    <section id="stack" className="relative bg-ink px-6 py-32 md:px-12 md:py-44">
      <div className="mx-auto max-w-[1500px]">
        <Reveal>
          <p className="micro text-gold">{stack.eyebrow}</p>
        </Reveal>
        <Reveal i={1} as="h2" className="display mt-6 text-[13vw] text-ivory md:text-[6.5vw]">
          {stack.title}
        </Reveal>

        {/* Hovering or focusing a row lights it and dims the rest */}
        <ul className="group/list mt-20 border-t border-hair">
          {stack.rows.map((r, i) => (
            <li
              key={r.name}
              tabIndex={0}
              data-cursor
              className="group/row relative flex items-baseline justify-between gap-6 border-b border-hair py-7 opacity-100 outline-offset-[-4px] transition-opacity duration-500 ease-nexus focus:!opacity-100 hover:!opacity-100 group-hover/list:opacity-30 group-focus-within/list:opacity-30 md:py-9"
            >
              <span className="flex items-baseline gap-6 md:gap-12">
                <span className="micro w-6 text-ivory/40">{String(i + 1).padStart(2, "0")}</span>
                <span className="display text-[9vw] text-ivory transition-colors duration-500 ease-nexus group-hover/row:text-gold group-focus/row:text-gold md:text-[4.6vw]">
                  {r.name}
                </span>
              </span>
              <span className="micro text-right text-ivory/60">{r.role}</span>
              <span
                aria-hidden
                className="absolute bottom-[-1px] left-0 h-px w-full origin-left scale-x-0 bg-gold transition-transform duration-700 ease-nexus group-hover/row:scale-x-100 group-focus/row:scale-x-100"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
