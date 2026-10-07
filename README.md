# Chijioke Uzodinma — portfolio

One page that tells one story, drawn by ~32,000 particles: every product starts
as an annoyance (a knot), comes apart into noise, and is rebuilt as a schema, a
live system and an interface. Then the shipped work acts itself out — each
project is a small scene of the product doing its job, played by scroll.

```bash
pnpm install
pnpm dev     # http://localhost:3000
pnpm build && pnpm start
```

## How it fits together

| Piece          | Where                                           | What it does                                                                                                                                                                                      |
| -------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Particle stage | `lib/stage/`                                    | One fixed WebGL2 canvas, one `drawArrays(POINTS)`. Each beat of the story is a _shape_ (`shapes.ts`) stored as float textures; the shader (`shaders.ts`) blends any two by `mix`. No 3D library.  |
| Story          | `components/story/Story.tsx`                    | Eight chapters as tall sections with sticky copy. One function of scroll position picks the two shapes and the mix, so anchors, reloads and scrolling backwards always land on the right picture. |
| Scroll         | `components/providers/SmoothScrollProvider.tsx` | Lenis on the GSAP ticker — the same loop drives ScrollTrigger and the stage.                                                                                                                      |
| Shell          | `components/shell/`                             | Preloader (real loading progress), HUD, custom cursor, the canvas mount.                                                                                                                          |
| Case studies   | `app/work/[slug]`, `components/case/`           | Opening a project morphs its picture to the exact box the case study's cover occupies (`lib/stage/layout.ts`), then the real image fades in over it.                                              |
| Content        | `lib/projects.ts`, `lib/nav.ts`                 | Projects (`line` is the one-liner the home page shows), contact details, socials.                                                                                                                 |

Screenshots of the live sites live in `public/images/work/` (re-capture with
`node scripts/capture-covers.mjs <slug>`; set `CHROME_PATH` without system
Chrome). Case studies show them below the story, and they are the OG cards.

Reduced motion gets still, composed frames and native scroll; browsers without
WebGL2 simply lose the particles; without JavaScript the copy
is all there.
