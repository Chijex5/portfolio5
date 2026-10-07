# Chijioke Uzodinma — portfolio

One page that tells one story, drawn by ~32,000 particles: every product starts
as an annoyance (a knot), comes apart into noise, and is rebuilt as a schema, a
live system, an interface, and finally the shipped work.

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

Covers live in `public/images/work/`; the stage samples the `-plate` versions.
Light UI screenshots are knocked out to dark-mode dots automatically
(`knockout()` in `shapes.ts`).

Reduced motion gets still, composed frames and native scroll; browsers without
WebGL2 get the DOM pictures instead of the canvas; without JavaScript the copy
is all there.
