import { footer } from "@/lib/content";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-hair bg-ink">
      <div className="mx-auto max-w-[1500px] px-6 pt-20 md:px-12 md:pt-28">
        <nav aria-label="Footer" className="grid grid-cols-2 gap-12 md:grid-cols-4">
          {footer.columns.map((c) => (
            <div key={c.title}>
              <p className="micro text-ivory/45">{c.title}</p>
              <ul className="mt-6 space-y-4">
                {c.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-sm text-ivory/75 transition-colors duration-500 ease-nexus hover:text-gold"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <p className="micro mt-24 text-[10px] text-ivory/40">{footer.legal}</p>
      </div>

      {/* Oversized wordmark at 4% ivory, cropped by the bottom edge */}
      <div className="relative mt-6 h-[14vw] overflow-hidden" aria-hidden>
        <span className="display absolute left-1/2 top-0 -translate-x-1/2 select-none whitespace-nowrap text-[20vw] leading-[0.85] text-ivory/[0.04]">
          {footer.wordmark}
        </span>
      </div>
    </footer>
  );
}
