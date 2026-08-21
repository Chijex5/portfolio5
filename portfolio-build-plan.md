# Portfolio Build Plan — Editorial Layout + WebGL Deform Carousel

> **Status:** Full implementation plan, pending sign-off on the proposed design system (§4).
> **Goal:** Build an original portfolio site that borrows two proven _techniques_ (not code, copy, or assets) from reference sites: (a) an editorial DOM layout with smooth scroll + GSAP micro-interactions, and (b) a velocity-reactive WebGL displacement carousel.
> **How to use this doc:** §1–§9 are the design/architecture reference. §10 is the milestone sequence we execute. Everything marked _placeholder_ gets swapped for real content in Milestone 12.

---

## 0. Locked decisions (from planning Q&A)

| Decision             | Choice                                                    | Consequence for the build                                                                                               |
| -------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Content strategy     | **Placeholder now, real content later**                   | Build against a typed content model with tasteful stand-in projects + images; swap real content in the final milestone. |
| Case-study authoring | **Single typed TypeScript data file** (`lib/projects.ts`) | No CMS, no MDX tooling. `/work/[slug]` renders from the array via `generateStaticParams`. Migratable to MDX/CMS later.  |
| Art direction        | **I propose a design system** (§4)                        | One concrete proposal (fonts, 2-color palette, spacing + motion tokens) for your sign-off before Phase 1.               |
| Execution            | **Plan, then scaffold**                                   | On approval, I begin Milestone 1 immediately.                                                                           |
| Language             | **TypeScript**, strict                                    | All components `.tsx`, shared types in `lib/`.                                                                          |
| Package manager      | **pnpm** (available locally, fast, strict)                | Lockfile committed.                                                                                                     |
| Deploy target        | **Vercel**                                                | Native Next.js image optimization, edge, preview deploys.                                                               |

---

## 1. Reference grounding (patterns we borrow, not clone)

**Dennis Snellenberg** — real stack GSAP + Barba.js + Locomotive Scroll; signature is a 2-color palette, large type, heavy parallax, clean micro-interactions. We borrow the **editorial layout + smooth-scroll + micro-interaction** pattern (modernized to Lenis + GSAP).

**Robin Mastromarino** (with dev Patrick Heng) — real stack Three.js + GSAP, almost entirely WebGL. Signature is a homepage slider whose **displacement is driven by scroll and drag velocity** — harder input = stronger liquid distortion. We borrow the **velocity-reactive displacement** pattern only.

**We are not cloning either site.** Original content, original design, our own shader math. The two sites establish that these techniques are achievable and worth doing; they are not a spec.

---

## 2. Tech stack (decided)

| Layer            | Choice                                                           | Why                                                                                                                                       |
| ---------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Framework        | **Next.js (App Router)**                                         | Route-based case studies, `next/image`, static export of `/work/[slug]`.                                                                  |
| Language         | **TypeScript** (strict)                                          | Type-safe content model + shader uniforms.                                                                                                |
| Styling          | **Tailwind CSS v4** (CSS-first `@theme`)                         | Fast iteration on an editorial grid; design tokens live in CSS.                                                                           |
| Smooth scroll    | **`lenis`** (via `lenis/react`)                                  | Maintained successor to Locomotive; `ReactLenis` + `useLenis` integrate cleanly with ScrollTrigger.                                       |
| Animation        | **`gsap`** + **ScrollTrigger** + **Flip** + **SplitText**        | Industry standard for this effect set. (Note: as of 2025 **all GSAP plugins incl. SplitText/Flip are free** — no Club membership needed.) |
| React/GSAP glue  | **`@gsap/react`** (`useGSAP`)                                    | Automatic context cleanup on unmount; prevents animation leaks.                                                                           |
| WebGL            | **`@react-three/fiber` v9** + **`@react-three/drei`** (Three.js) | React-idiomatic Three.js; easier state sync than raw Three. R3F v9 pairs with React 19 / Next 15.                                         |
| Shaders          | **Custom GLSL** authored as TS template-string modules           | Needed for liquid displacement; template strings = zero webpack/Turbopack loader config (see §6).                                         |
| Shared velocity  | **Mutable ref store** (tiny Zustand store, read non-reactively)  | One source of truth for scroll+drag velocity; read via `getState()` inside `useFrame` to avoid re-renders.                                |
| Page transitions | **Next router + GSAP/Flip transition layer**                     | Not Barba.js (pre-React, fights App Router). Native back/forward preserved.                                                               |
| Utilities        | `clsx` + `tailwind-merge`                                        | Ergonomic conditional classes.                                                                                                            |
| Debug (dev only) | `leva`                                                           | Live shader-uniform tuning; stripped from prod.                                                                                           |
| Tooling          | ESLint + Prettier + TypeScript                                   | Consistency.                                                                                                                              |

**Hard rule:** Do **not** add Framer Motion on top of GSAP. One animation library owns transforms — mixing them causes fighting over the same elements' `transform`.

> Versions are pinned to latest stable at scaffold time; the table names the libraries, not exact semver. R3F v9 + React 19 + Next 15 (or later) is the known-good matrix.

---

## 3. Site structure

```
/                     → Home (hero, work carousel, about, contact — one page)
/work/[slug]          → Case study route, entered via carousel click-to-expand
```

### File tree

```
app/
  layout.tsx              # <ReactLenis> root, GSAP context, fonts, theme tokens, metadata
  page.tsx                # Home: composes Hero, Work, About, Contact
  work/[slug]/page.tsx    # Case study template (generateStaticParams from lib/projects)
  work/[slug]/opengraph-image.tsx  # Per-project OG image
  sitemap.ts / robots.ts  # SEO
  globals.css             # Tailwind v4 @import + @theme tokens
components/
  layout/
    Header.tsx            # Fixed header, magnetic pill nav, status dot
    Footer.tsx            # Contact footer, marquee, magnetic CTA
    PageTransition.tsx    # GSAP-driven route transition overlay
  hero/
    Hero.tsx              # Kinetic type (SplitText) + parallax depth planes
  work/
    Work.tsx              # Section wrapper; chooses Carousel vs MobileCarousel
    CarouselCanvas.tsx    # R3F <Canvas> wrapper; owns pointer/drag handlers
    CarouselScene.tsx     # Plane-mesh grid + ShaderMaterial
    ProjectCardsDOM.tsx   # Live HTML titles/labels synced to mesh screen positions
    MobileCarousel.tsx    # scroll-snap fallback (no shader)
    shaders/
      displace.vert.ts    # Vertex shader (string export)
      displace.frag.ts    # Fragment shader (string export)
  about/
    About.tsx             # Sticky split layout + GSAP line reveals
  shared/
    MagneticButton.tsx    # quickTo magnetic pull, reused by header + footer
    Marquee.tsx           # CSS marquee (optional velocity-reactive speed)
    SplitReveal.tsx       # Clip-path line reveal on ScrollTrigger enter
lib/
  projects.ts             # ← Single source of truth for all project content (typed)
  types.ts                # Project, CaseStudyBlock, etc.
  useLenis.ts             # Lenis access + velocity tracking
  velocityStore.ts        # Shared mutable velocity ref (Zustand)
  useReducedMotion.ts     # prefers-reduced-motion hook
  gsap.ts                 # Centralized plugin registration
  tokens.ts               # Motion constants (durations, easings, lerp factors)
public/
  images/work/...         # Placeholder project imagery (optimized)
```

---

## 4. Proposed design system (needs your sign-off)

This is my concrete proposal per your "propose a design system" choice. It's swappable — the only thing I'd like confirmed before Phase 1 is the **font pairing** and **accent color**, since they ripple through everything.

### Typography

| Role                   | Font                                                            | Rationale                                                                                    |
| ---------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Display / kinetic type | **Fraunces** (variable serif, optical sizing + soft/wonky axes) | High-contrast editorial serif that gets dramatic at large sizes — the hero centerpiece.      |
| Body / UI              | **Inter** (variable)                                            | Neutral, legible, pairs cleanly under a characterful serif.                                  |
| Labels / indices       | **JetBrains Mono**                                              | Monospaced tags ("01 / 04", "AVAILABLE FOR WORK", categories) are a signature of this genre. |

All three are free, on Google Fonts, loaded via `next/font/google` as CSS variables (`--font-display`, `--font-body`, `--font-mono`) → fed into the Tailwind `@theme`. Fluid sizing via `clamp()`.

### Color — 2-color base + one signal accent

Warm neutrals (not cold pure black/white) read as editorial. Theme-swappable tokens:

| Token               | Light                    | Dark                      | Use                                                                     |
| ------------------- | ------------------------ | ------------------------- | ----------------------------------------------------------------------- |
| `--paper` (bg)      | `#F4F1EA` warm off-white | `#14110F` warm near-black | Page background                                                         |
| `--ink` (fg)        | `#14110F`                | `#F4F1EA`                 | Text, borders                                                           |
| `--ink-muted`       | `#14110F` @ 55%          | `#F4F1EA` @ 55%           | Secondary text                                                          |
| `--signal` (accent) | `#FF4A1C` vermilion      | `#FF6A42`                 | Links, magnetic CTA, status dot, shader hover tint — used **sparingly** |

Default theme: light. Optional dark toggle is a stretch goal, but tokens are authored theme-ready from day one.

### Spacing & grid

- 4px base scale: `4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192`.
- **12-column editorial grid**, generous gutters, `--content-max: 1600px`, wide asymmetric margins.
- Fluid type scale with `clamp()` (e.g. display `clamp(3rem, 12vw, 14rem)`).

### Motion tokens (`lib/tokens.ts`)

| Token                    | Value                          | Use                                       |
| ------------------------ | ------------------------------ | ----------------------------------------- |
| `dur.fast / base / slow` | `0.2 / 0.4 / 0.8`s             | Micro-interactions → section reveals      |
| `ease.out`               | `[0.16, 1, 0.3, 1]` (expo-out) | The "expensive" decelerating feel         |
| `magnet.max`             | `12px`                         | Magnetic offset cap (header + footer CTA) |
| `lenis.lerp / duration`  | `0.1 / 1.2`                    | Smooth-scroll feel                        |
| `velocity.damp`          | `~0.05–0.08` /frame            | Inertia settle after drag/scroll release  |
| `shader.strength`        | tunable via `leva`             | Displacement amplitude ceiling            |

---

## 5. Content model (typed, single source of truth)

`lib/types.ts`:

```ts
export type CaseStudyBlock =
  | { kind: "text"; heading?: string; body: string }
  | { kind: "image"; src: string; alt: string; wide?: boolean }
  | {
      kind: "duo";
      left: string;
      right: string;
      altLeft: string;
      altRight: string;
    };

export interface Project {
  slug: string; // URL: /work/[slug]
  title: string;
  category: string; // e.g. "Brand / Web"
  year: number;
  role: string; // "Design & Build"
  index: string; // "01"
  cover: { src: string; alt: string; width: number; height: number };
  accent?: string; // optional per-project accent override
  intro: string; // one-paragraph summary (also meta description)
  blocks: CaseStudyBlock[]; // long-form case-study body
  nextSlug: string; // for "next project" navigation
  live?: string; // optional external link
}
```

`lib/projects.ts` exports `projects: Project[]` (4–6 placeholder projects). `generateStaticParams` maps slugs; `/work/[slug]/page.tsx` looks up by slug and 404s on miss. This keeps content edits to one file and makes a future MDX/CMS migration mechanical.

---

## 6. Section-by-section build notes

### Fixed Header

- **Magnetic pill nav** (`MagneticButton`): on hover, translate toward cursor with a capped offset (`magnet.max` 12px) using GSAP `quickTo` for spring-like easing — cheaper than a physics lib at this scale.
- **Status indicator** ("Available for work"): pulsing dot, pure CSS animation. No GSAP.

### Hero

- **Kinetic type**: split into word/char spans via **SplitText**; animate `y`/`opacity` on load, then subtle scroll-scrub via ScrollTrigger.
- **Vertical parallax**: 2–3 depth planes translated at different scroll-speed multipliers, driven by Lenis scroll value through ScrollTrigger `scrub`.

### Work Showcase — the carousel (centerpiece; build in this exact order)

1. **Static grid first** — plain DOM/CSS cards. Confirm content, routing, responsive layout **before** any WebGL.
2. **Swap in R3F `<Canvas>`** behind/around the DOM cards. Each card → a plane mesh textured with the project image (`useTexture`).
3. **Single shared velocity source** (`velocityStore.ts`) — one value that _both_ the DOM drag handler and the canvas read. **This is the #1 desync bug.** Lenis and any drag input must feed one store; the shader reads it via `getState()` in `useFrame`. Never let two systems drive the same visual independently.
4. **Displacement shader** — vertex shader bends the plane along a sine/bezier curve driven by a `uVelocity` uniform, updated every frame from the shared store. Fragment shader adds a subtle RGB-shift/ripple at high velocity for the "liquid" feel. **Keep it an accent, not the main event.**
5. **Inertia / lerp damping** — don't snap velocity to 0 on release; lerp back over ~0.5–1s so deformation settles naturally (`velocity.damp`).
6. **DOM text overlay** (`ProjectCardsDOM`) — titles/categories are **real HTML** absolutely positioned over the canvas, synced to each mesh's screen-space projection (`useFrame` + `camera.project`, or drei `Html` with `transform={false}` for perf). Satisfies a11y/SEO. **Never bake text into the texture.**
7. **Click-to-expand transition** — on click: (a) fade/scale DOM text out, (b) crossfade the canvas frame into a full-screen `next/image` positioned via **GSAP Flip** to match the clicked card's last on-screen rect, (c) `router.push('/work/[slug]')` once the crossfade completes. This is a **two-layer illusion** (WebGL → DOM handoff), _not_ a literal mesh-to-DOM morph — the realistic way to build it. Plan crossfade timing to avoid a visible seam.

### Shader detail (concrete)

- **Uniforms:** `uTime`, `uVelocity` (from store), `uTexture`, `uResolution`, `uHover`, `uProgress` (expand transition).
- **Vertex (sketch):** displace `position.z += sin(uv.x * PI) * uVelocity * strength` (or a bezier bend) so the plane curves harder with velocity.
- **Fragment (sketch):** sample the texture with a small per-channel UV offset scaled by `uVelocity` (RGB shift), clamped so it stays subtle.
- Tune `strength`/offsets live with `leva` in dev; hard-code final values for prod.

### About / Skills

- **Sticky split layout**: CSS `position: sticky` on one column while the other scrolls — no JS for stickiness.
- **Line reveals** (`SplitReveal`): each line in a clipped span; animate `clip-path`/`translateY` on ScrollTrigger enter.

### Contact Footer

- **Magnetic CTA**: same `quickTo` pattern as header.
- **Kinetic marquee** (`Marquee`): CSS `@keyframes translateX` loop. Optional stretch: make speed scroll-velocity-reactive by reading the velocity store.

---

## 7. The 3 non-negotiable rules

1. **DOM text stays DOM.** Never render typography into a WebGL texture. Screen readers + text selection must work.
2. **Mobile gets a _different_ carousel, not a degraded one.** Touch → `scroll-snap` (or lightweight swipe) carousel, shader dropped to a cheap/no-op pass. Budgeted as real implementation time (Milestone 10), not a toggle.
3. **Case studies are real routes.** `/work/[slug]` via the Next router so back/forward and direct linking work.

---

## 8. Cross-cutting requirements (apply throughout, verified in Milestone 11)

### Accessibility

- **`prefers-reduced-motion`**: disable SplitText load animations, freeze the displacement shader (static planes), set Lenis to a near-instant/native scroll, stop the marquee. One `useReducedMotion` hook gates all heavy motion.
- **Keyboard**: carousel items are focusable links; arrow-key navigation between cards; visible focus rings; Enter opens the case study.
- **Focus management**: move focus to `<h1>` on route change; skip-to-content link.
- **Semantics**: real `<nav>`, `<main>`, `<article>` for case studies; `alt` text on every image (part of the content model).

### Performance budget

- **Target 60fps** during scroll+drag interaction; profile early (Milestone 9), not at the end.
- Lazy-load the `<Canvas>` via `dynamic(() => ..., { ssr: false })` with a static-image fallback so first paint isn't blocked by WebGL.
- Clamp device pixel ratio (`dpr={[1, 2]}`); use `frameloop="demand"` when idle, `"always"` only during active interaction.
- Optimized textures (right-sized WebP/AVIF via `next/image`; consider KTX2/basis only if texture memory becomes the bottleneck), mipmaps on, preload covers.
- Bundle: keep Three/R3F out of the initial route bundle for `/work/[slug]` (it doesn't need the canvas).
- Lighthouse performance ≥ 90 on desktop, reasonable mobile score given the interactive nature.

### SEO

- Next **Metadata API**: per-page + per-case-study title/description (from `intro`), canonical URLs.
- Per-project **Open Graph images** (`opengraph-image.tsx`).
- `sitemap.ts`, `robots.ts`, and JSON-LD (`Person` + `CreativeWork`).
- DOM text overlay guarantees crawlable project titles/categories.

### Responsive

- Breakpoints: mobile `<768`, tablet `768–1024`, desktop `>1024`.
- Desktop = WebGL carousel; mobile/tablet-touch = `MobileCarousel`. Detection via pointer/matchMedia, not just width, and re-evaluated on resize.

---

## 9. Testing & QA

- **Interaction QA matrix** (manual, per milestone): slow scroll, fast scroll, slow drag, fling drag, release-inertia, hover, click-to-expand, back button, reduced-motion on, keyboard-only, touch.
- **Playwright smoke** (lightweight): home renders, each `/work/[slug]` renders + is directly linkable, back/forward works, basic a11y (axe) pass on home + one case study.
- **Lighthouse** run before deploy (perf/a11y/SEO/best-practices).
- **Cross-browser**: Chrome, Safari (WebGL + Lenis quirks differ), Firefox; iOS Safari + Android Chrome for the mobile carousel.

---

## 10. Milestones (execution sequence)

Grouped into phases. **Phase 2 is independently shippable** (full editorial site, no WebGL) — a deliberate safety net if the carousel needs more time.

### Phase 0 — Design sign-off

- **M0. Art direction.** You approve/adjust §4 (fonts, accent, tokens). _Gate before Phase 1._

### Phase 1 — Foundation

- **M1. Scaffold.** Next.js + TS + Tailwind v4 + pnpm; ESLint/Prettier; fonts via `next/font`; `@theme` tokens from §4; `<ReactLenis>` root + GSAP ticker wiring + centralized plugin registration; base layout renders with smooth scroll.
  - _Done when:_ dev server runs, tokens/fonts applied, Lenis smooth-scrolls a tall placeholder page, ScrollTrigger updates off Lenis.

### Phase 2 — Static editorial site (no WebGL)

- **M2. Header + Footer** with magnetic interactions + status dot + marquee.
- **M3. Hero** — kinetic type (SplitText) + parallax depth planes.
- **M4. About** — sticky split layout + line reveals.
- **M5. Content model + Work grid** — `lib/projects.ts`, static DOM card grid, routed to real `/work/[slug]` pages (`generateStaticParams`), case-study template rendering from the data blocks.
  - _Done when:_ entire site is usable, accessible, responsive, and linkable **without any WebGL**. This is a shippable checkpoint.

### Phase 3 — WebGL carousel

- **M6. R3F canvas + shared velocity** — swap grid for textured plane meshes; wire `velocityStore` so scroll + drag feed one value; planes move with scroll. **No shader yet.**
- **M7. Displacement shader + inertia** — vertex bend + subtle fragment RGB-shift driven by `uVelocity`; lerp damping on release; `leva` tuning in dev.
- **M8. DOM text overlay** — titles/categories synced to mesh screen positions; verify SR/selection.
- **M9. Click-to-expand Flip transition** — DOM-text-out → WebGL↔`next/image` crossfade via Flip → `router.push`. Tune timing to kill the seam.

### Phase 4 — Fallback & polish

- **M10. Mobile fallback** — `MobileCarousel` (scroll-snap/swipe) + shader downgrade; pointer/matchMedia switching with resize handling.
- **M11. Cross-cutting pass** — reduced-motion, keyboard/focus, SEO metadata + OG + sitemap + JSON-LD, Lighthouse, performance profiling (reduce shader complexity/mesh count if under 60fps), cross-browser QA.

### Phase 5 — Content & ship

- **M12. Content swap + deploy** — replace placeholder projects/images/copy with real content; final QA matrix; deploy to Vercel with preview → production.

---

## 11. Risks & mitigations

| Risk (from "known hard parts")                                                  | Mitigation                                                                                                                                                                                          |
| ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Velocity desync** between scroll and drag — the most common bug.              | One source of truth (`velocityStore`); Lenis + drag both write it, shader reads it. Never two drivers on one visual. Build M6 (movement) before M7 (shader) so desync is isolated from shader bugs. |
| **Flip→WebGL transition seam** — it's a layered illusion, not a real transform. | Storyboard the crossfade timing; match the `next/image` rect to the card's last on-screen rect exactly via Flip; test on slow connections.                                                          |
| **Full-bleed WebGL + Lenis + GSAP + Flip is heavy.**                            | Profile at M9, not the end. Lazy-load canvas, clamp DPR, `frameloop="demand"` when idle, right-size textures. Phase 2 remains shippable if the carousel must be simplified.                         |
| Shader `.glsl` loader friction in Next/Turbopack.                               | Author shaders as TS template-string modules (`displace.vert.ts`) — zero loader config.                                                                                                             |
| GSAP/React animation leaks on route change.                                     | `@gsap/react` `useGSAP` for automatic context cleanup; kill ScrollTriggers on unmount.                                                                                                              |
| Safari/iOS WebGL + smooth-scroll quirks.                                        | Cross-browser QA in M11; mobile uses the non-WebGL carousel anyway.                                                                                                                                 |

---

## 12. Things to confirm before/at M0

1. **Font pairing** — approve Fraunces + Inter + JetBrains Mono, or name substitutes.
2. **Accent color** — approve the `#FF4A1C` vermilion, or pick another single signal hue.
3. **Dark mode** — ship a toggle (stretch), or light-only with theme-ready tokens? _Default: light-only, tokens ready._
4. **Placeholder imagery source** — abstract/generated stand-ins now (I'll source license-safe images), confirmed OK? _Default: yes._
5. **Site identity for placeholders** — use your name (Chijioke) + a generic role in the copy, or fully generic "Studio" placeholder? _Default: your name, generic role._
