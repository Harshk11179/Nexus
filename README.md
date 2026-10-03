# NEXUS landing page

Next.js 14 (App Router), TypeScript, Tailwind, Framer Motion, GSAP + ScrollTrigger, Lenis, React Three Fiber.

    npm install
    npm run dev      # http://localhost:3000
    npm run build && npm start

- All copy: `lib/content.ts`
- Stats in `lib/content.ts` are PLACEHOLDERS, replace with measured figures.
- The final CTA button links to `access@nexus.example`; replace with a real address or form.
- Pinned scroll story: `components/ScrollStory.tsx` (timeline comment at top) and `components/StoryScene.tsx`.
- Fonts are bundled via @fontsource packages, so no network fetch at build time.
