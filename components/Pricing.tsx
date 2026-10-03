import { pricing } from "@/lib/content";
import Reveal from "./Reveal";

export default function Pricing() {
  return (
    <section id="access" className="relative bg-ink px-6 py-32 md:px-12 md:py-44">
      <div className="mx-auto max-w-[1500px]">
        <Reveal>
          <p className="micro text-gold">{pricing.eyebrow}</p>
        </Reveal>
        <Reveal i={1} as="h2" className="display mt-6 max-w-[14ch] text-[13vw] text-ivory md:text-[6.5vw]">
          {pricing.title}
        </Reveal>

        <div className="mt-20 grid gap-3 md:grid-cols-3">
          {pricing.tiers.map((t, i) => (
            <Reveal key={t.name} i={i}>
              <article
                className={`flex h-full flex-col justify-between bg-graphite p-8 md:p-10 ${
                  t.featured ? "border border-gold" : "hairline"
                }`}
              >
                <div>
                  <p className="micro text-ivory/50">{t.note}</p>
                  <h3 className="display mt-4 text-5xl text-ivory md:text-6xl">{t.name}</h3>
                  <ul className="mt-10 space-y-4 border-t border-hair pt-8">
                    {t.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm text-ivory/75">
                        <span aria-hidden className="mt-[9px] h-px w-3 shrink-0 bg-gold" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <a
                  href="#access"
                  className={`micro mt-12 inline-flex items-center justify-center rounded-full px-7 py-4 transition-all duration-500 ease-nexus ${
                    t.featured
                      ? "bg-ivory text-ink hover:scale-[1.02]"
                      : "border border-hair text-ivory hover:border-gold/60"
                  }`}
                >
                  {pricing.cta}
                </a>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
