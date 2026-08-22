"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { Canvas } from "@react-three/fiber";
import CarouselScene from "@/components/work/CarouselScene";
import {
  CAMERA_FOV,
  cameraDistance,
  measureTrack,
  RING,
  smoothstep,
  wrapSigned,
  type TrackLayout,
} from "@/lib/gl/liquid";
import { createTrackState } from "@/lib/gl/track";
import { gsap } from "@/lib/gsap";
import { CAROUSEL, VELOCITY } from "@/lib/tokens";
import type { Project } from "@/lib/types";
import { getVelocity, writeCarousel } from "@/lib/velocity";

/** px/frame ceiling, so a violent flick can't fold the plates inside out. */
const MAX_SPEED = 140;
/** px of travel after which a pointer-up counts as a drag, not a click. */
const DRAG_SLOP = 8;

/**
 * The liquid carousel (plan §7).
 *
 * Two layers, one set of numbers. Underneath, a WebGL ring of cover plates that
 * bow and fringe with the speed of the track. On top, one real `<a>` per plate
 * carrying the index, category and title as DOM text — positioned from the same
 * offset the shader uses and scaled by the same perspective, so the words are
 * welded to the picture instead of merely near it.
 *
 * This component owns the physics, and it owns them in exactly one place: a
 * single GSAP ticker callback that integrates the track, writes the shared
 * velocity store, moves the DOM overlay, and *then* asks the WebGL root to draw.
 * Because the draw happens last in the same callback, the plates can never be a
 * frame behind the text on top of them — and the site still has just one loop.
 *
 * The track is never quite still: it drifts, it takes a push from page-scroll
 * velocity, and it follows the finger 1:1 on drag with inertia on release.
 */
export default function LiquidCarousel({
  projects,
}: {
  projects: readonly Project[];
}) {
  const container = useRef<HTMLDivElement>(null);
  const slots = useRef<(HTMLAnchorElement | null)[]>([]);
  const track = useRef(createTrackState());
  const advance = useRef<((time: number) => void) | null>(null);

  const [layout, setLayout] = useState<TrackLayout | null>(null);

  // Only projects with artwork can be plates — there is nothing for the shader
  // to sample otherwise, and the numbered list below already covers every one.
  const slides = useMemo(
    () => projects.filter((project) => project.cover),
    [projects],
  );
  // `plate`, not `src`. These URLs go to THREE.TextureLoader, which bypasses
  // next/image: whatever is named here is fetched at full size and held on the
  // GPU *uncompressed*. The 2400x1650 master would cost ~15.8 MB of VRAM per
  // plate before mipmaps, times six or more plates, to be drawn into a box
  // measureTrack caps at 620 CSS px. `plate` is the same picture at 1240x850 —
  // still 2x the largest size it can be drawn at. See Project["cover"].
  const sources = useMemo(
    () => slides.map((project) => project.cover!.plate ?? project.cover!.src),
    [slides],
  );

  const bindAdvance = useCallback((fn: ((time: number) => void) | null) => {
    advance.current = fn;
  }, []);

  // Measure the band, not the window: the layout has to agree with the canvas,
  // and the canvas measures its own container.
  useEffect(() => {
    const element = container.current;
    if (!element || slides.length === 0) return;

    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      if (width <= 0) return;
      setLayout((previous) => {
        const next = measureTrack(
          width,
          slides.length,
          CAROUSEL.aspect,
          CAROUSEL.gap,
        );
        // Bail out of the state update when nothing that matters moved, or a
        // scrollbar appearing mid-animation would rebuild every material.
        return previous &&
          previous.width === next.width &&
          previous.plates.length === next.plates.length
          ? previous
          : next;
      });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [slides.length]);

  // The frame. One callback, one order: integrate → publish → move DOM → draw.
  useEffect(() => {
    const element = container.current;
    if (!element || !layout) return;

    const state = track.current;
    let dragging = false;
    let pointerId = -1;
    let lastX = 0;
    let pendingDx = 0;
    let travelled = 0;
    let suppressClick = false;

    // All five are arrows rather than `function` declarations: TypeScript keeps
    // the `element`/`layout` non-null narrowing inside closures created after the
    // guard above, but resets it inside hoisted declarations.
    const tick = (time: number, deltaTime: number) => {
      // Clamped: a tab returning from the background reports a huge delta, and
      // integrating it would teleport the track.
      const ms = Math.min(deltaTime, 50);
      const frames = ms / (1000 / 60);

      if (dragging) {
        // 1:1 with the finger for position, smoothed for velocity — so letting
        // go of a still finger stops, and letting go mid-sweep throws.
        const dx = pendingDx;
        pendingDx = 0;
        state.offset -= dx;
        state.velocity += (-dx - state.velocity) * 0.35;
      } else {
        // Page-scroll velocity bleeds sideways into the track: scrolling hard
        // past this section shoves it along, which is the moment the bend and the
        // colour fringe are most visible.
        const bleed =
          getVelocity().scroll * VELOCITY.norm.scroll * CAROUSEL.scrollBleed;
        // Hovering a plate stops the drift so the title can actually be read.
        const target = (state.hover >= 0 ? 0 : CAROUSEL.drift) + bleed;
        const ease = 1 - Math.pow(0.001, ms / 1000 / CAROUSEL.snap);
        state.velocity += (target - state.velocity) * ease;
        state.offset += state.velocity * frames;
      }

      state.velocity = Math.max(
        -MAX_SPEED,
        Math.min(MAX_SPEED, state.velocity),
      );
      writeCarousel(state.velocity);

      const { width, height, pitch, span, plates } = layout;
      const bounds = element.getBoundingClientRect();
      const reach = bounds.width / 2 + width / 2;
      const distance = cameraDistance(bounds.height, CAMERA_FOV);
      const hoverStep = 1 - Math.pow(0.001, ms / 1000 / RING.hoverEase);

      for (let i = 0; i < plates.length; i++) {
        const previous = state.hoverEase[i] ?? 0;
        const hover =
          previous + ((state.hover === i ? 1 : 0) - previous) * hoverStep;
        state.hoverEase[i] = hover;

        const slot = slots.current[i];
        if (!slot) continue;

        const x = wrapSigned(i * pitch - state.offset, span);
        const away = Math.abs(x / reach);
        const z = -away * RING.depth + hover * RING.lift;
        // The same perspective divide the camera does, so the words shrink into
        // the distance at exactly the rate their plate does.
        const scale = distance / (distance - z);
        const opacity = 1 - smoothstep(RING.fade[0], RING.fade[1], away);

        slot.style.width = `${width}px`;
        slot.style.height = `${height}px`;
        slot.style.transform = `translate3d(${x * scale}px, ${-away * RING.arc * scale}px, 0) scale(${scale})`;
        slot.style.opacity = `${opacity}`;
        // A plate dissolving off the edge must not still be catching clicks.
        slot.style.pointerEvents = opacity < 0.2 ? "none" : "auto";
      }

      advance.current?.(time);
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      dragging = true;
      pointerId = event.pointerId;
      lastX = event.clientX;
      pendingDx = 0;
      travelled = 0;
      element.setPointerCapture(event.pointerId);
      element.dataset.dragging = "true";
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!dragging || event.pointerId !== pointerId) return;
      const dx = event.clientX - lastX;
      lastX = event.clientX;
      pendingDx += dx;
      travelled += Math.abs(dx);
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (!dragging || event.pointerId !== pointerId) return;
      dragging = false;
      // Remember that this gesture was a drag: the click that follows a swipe
      // must not navigate.
      suppressClick = travelled > DRAG_SLOP;
      if (element.hasPointerCapture(pointerId)) {
        element.releasePointerCapture(pointerId);
      }
      pointerId = -1;
      delete element.dataset.dragging;
    };

    const handleClick = (event: MouseEvent) => {
      if (!suppressClick) return;
      suppressClick = false;
      event.preventDefault();
      event.stopPropagation();
    };

    element.addEventListener("pointerdown", handlePointerDown);
    element.addEventListener("pointermove", handlePointerMove);
    element.addEventListener("pointerup", handlePointerUp);
    element.addEventListener("pointercancel", handlePointerUp);
    element.addEventListener("click", handleClick, { capture: true });
    gsap.ticker.add(tick);

    return () => {
      element.removeEventListener("pointerdown", handlePointerDown);
      element.removeEventListener("pointermove", handlePointerMove);
      element.removeEventListener("pointerup", handlePointerUp);
      element.removeEventListener("pointercancel", handlePointerUp);
      element.removeEventListener("click", handleClick, { capture: true });
      gsap.ticker.remove(tick);
      writeCarousel(0);
    };
  }, [layout]);

  if (slides.length === 0) return null;

  return (
    <div
      ref={container}
      // Decorative twin of the list below: same six projects, same destinations.
      // Presenting it to assistive tech would mean six duplicate links and a
      // drag-only affordance, so the list stays the accessible path — exactly the
      // pattern the work rows already use for their plate link.
      aria-hidden="true"
      // overflow-clip is load-bearing, not cosmetic: the ring is wider than the
      // viewport by design (measureTrack), and the plates are absolutely
      // positioned out to ±span/2. Opacity 0 and pointer-events: none do not
      // remove a box from its ancestor's scrollable overflow — only clipping
      // does — so without this the document grew ~1800px of dead space to the
      // right and every section inherited a horizontal scrollbar. `clip` rather
      // than `hidden`: it never becomes a scroll container, so it can't swallow
      // a stray programmatic scrollLeft or fight Lenis.
      //
      // pan-y keeps vertical page scroll working while the horizontal axis is
      // ours; without it the browser claims the gesture before pointermove fires.
      className="relative h-[62svh] max-h-[620px] min-h-[320px] w-full cursor-grab touch-pan-y overflow-clip select-none [&[data-dragging]]:cursor-grabbing"
    >
      {layout ? (
        <Suspense fallback={null}>
          <Canvas
            // The DOM overlay above is the only pointer target; R3F's own event
            // layer would just be a second, raycast-based opinion about hover.
            style={{ pointerEvents: "none" }}
            // Never: the frame belongs to the ticker callback above, which draws
            // after it has moved everything else.
            frameloop="never"
            // Pass the covers through untouched — no sRGB re-encode, no tone
            // mapping — so the plates are the same paper and vermilion as the page.
            linear
            flat
            dpr={[1, 2]}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: "high-performance",
            }}
            camera={{
              fov: CAMERA_FOV,
              near: 1,
              far: 8000,
              position: [0, 0, 1000],
            }}
          >
            <CarouselScene
              sources={sources}
              layout={layout}
              track={track}
              bindAdvance={bindAdvance}
            />
          </Canvas>
        </Suspense>
      ) : null}

      {/* Captions. Absolutely centred, then moved every frame by the tick — the
          plate's picture and its name are driven by one number. */}
      <div className="pointer-events-none absolute inset-0">
        {layout?.plates.map((slide, i) => {
          const project = slides[slide];
          return (
            <Link
              key={`${project.slug}-${i}`}
              href={`/work/${project.slug}`}
              tabIndex={-1}
              ref={(node) => {
                slots.current[i] = node;
              }}
              onPointerEnter={() => {
                track.current.hover = i;
              }}
              onPointerLeave={() => {
                if (track.current.hover === i) track.current.hover = -1;
              }}
              // Centred with margins rather than a translate utility, because the
              // tick owns `transform` outright and an inline transform would win
              // over the class anyway.
              className="group absolute top-1/2 left-1/2 overflow-hidden will-change-transform"
              style={{
                marginLeft: `-${layout.width / 2}px`,
                marginTop: `-${layout.height / 2}px`,
              }}
            >
              <span className="text-paper absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-black/55 via-black/15 to-transparent p-5 pt-16 opacity-0 transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:opacity-100">
                <span className="min-w-0">
                  <span className="block font-mono text-[0.625rem] tracking-[0.2em] uppercase opacity-70">
                    {project.index} &mdash; {project.category}
                  </span>
                  <span className="font-display mt-1.5 block truncate text-2xl leading-tight tracking-[-0.01em] md:text-3xl">
                    {project.title}
                  </span>
                </span>
                <span className="border-paper/40 shrink-0 rounded-full border px-3 py-1 font-mono text-[0.5625rem] tracking-[0.16em] whitespace-nowrap uppercase">
                  View
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
