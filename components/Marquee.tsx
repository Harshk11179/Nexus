import { sources } from "@/lib/content";

function Row({ items, dir }: { items: string[]; dir: "left" | "right" }) {
  // The list is rendered twice so translating by -50% loops seamlessly.
  const set = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((s, i) => (
        <li key={`${s}-${i}`} className="flex items-center">
          <span className="micro px-8 py-7 text-[13px] text-ivory/75 md:px-14 md:py-9 md:text-[15px]">{s}</span>
          <span className="h-4 w-px bg-ivory/15" aria-hidden />
        </li>
      ))}
    </ul>
  );
  return (
    <div className="marquee overflow-hidden border-b border-hair last:border-b-0">
      <div className={`marquee-track ${dir === "left" ? "marquee-left" : "marquee-right"}`}>
        {set(false)}
        {set(true)}
      </div>
    </div>
  );
}

export default function Marquee() {
  return (
    <section aria-label="Supported sources" className="relative border-y border-hair bg-ink">
      <Row items={sources.rowA} dir="left" />
      <Row items={sources.rowB} dir="right" />
    </section>
  );
}
