import { brand, nav } from "@/lib/content";

export default function Nav() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between px-6 py-6 md:px-12">
      <a
        href="#top"
        className="micro pointer-events-auto text-ivory"
        style={{ letterSpacing: "0.4em" }}
        aria-label={`${brand.name}, back to top`}
      >
        {brand.name}
      </a>
      <a
        href="#access"
        className="micro pointer-events-auto text-ivory/75 transition-colors duration-500 ease-nexus hover:text-gold"
      >
        {nav.cta}
      </a>
    </header>
  );
}
