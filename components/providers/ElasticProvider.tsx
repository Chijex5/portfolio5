"use client";

import { useEffect } from "react";
import { gsap } from "@/lib/gsap";
import { ELASTIC, MOTION_OK } from "@/lib/tokens";
import { getVelocity } from "@/lib/velocity";

/**
 * The site-wide elastic layer.
 *
 * Any element marked `data-elastic="<multiplier>"` shears, stretches and lags
 * with the page's scroll velocity. Bands with different multipliers deform by
 * different amounts at the same instant, and that disagreement is what reads as
 * depth — one sheet tilting reads as a bug, five sheets tilting by different
 * amounts reads as liquid.
 *
 * Why a provider that queries the DOM rather than a component per section:
 *
 *   - the transform has to be written from the *same* frame the velocity was
 *     sampled in, and there is exactly one such frame — the GSAP ticker that
 *     already drives Lenis and the carousel. A component per section would mean
 *     N subscriptions to one value.
 *   - it stays out of the markup: sections opt in with one attribute, and no
 *     wrapper element is inserted that could disturb a grid or a sticky column.
 *
 * The loop is write-only. It never calls getBoundingClientRect or reads a
 * computed style, so it cannot force a synchronous layout no matter how many
 * bands opt in.
 *
 * Mounted once, inside SmoothScrollProvider. Under `prefers-reduced-motion` the
 * matchMedia block never runs and nothing is ever written.
 */
export default function ElasticProvider() {
  useEffect(() => {
    const mm = gsap.matchMedia();

    mm.add(MOTION_OK, () => {
      // Resolved once per mount rather than per frame. A band added later (route
      // change, conditional carousel) is picked up by the observer below.
      let bands: { el: HTMLElement; intensity: number }[] = [];

      const collect = () => {
        bands = gsap.utils
          .toArray<HTMLElement>("[data-elastic]")
          .map((el) => ({
            el,
            // Clamped: a typo like data-elastic="10" should look wrong, not fold
            // the section inside out.
            intensity: Math.min(
              ELASTIC.maxIntensity,
              Math.max(0, Number(el.dataset.elastic) || 0),
            ),
          }))
          .filter((band) => band.intensity > 0);
      };

      collect();

      // The showreel band mounts after hydration (WebGL + motion probe), and the
      // work rows are the most rewarding thing on the page to deform — so the set
      // of bands is not final at mount.
      const observer = new MutationObserver(collect);
      observer.observe(document.body, { childList: true, subtree: true });

      // Tracks the last value written per element so a settled page stops
      // touching the style attribute entirely — otherwise every band would get a
      // fresh transform string 60 times a second while nothing is moving.
      const written = new WeakMap<HTMLElement, string>();

      const tick = () => {
        const { scroll } = getVelocity();

        for (const { el, intensity } of bands) {
          const v = scroll * intensity;
          const speed = Math.abs(v);

          // Shear against the direction of travel: scrolling down drags the
          // bottom of the band behind the top.
          const skew = -v * ELASTIC.skew;
          // Stretch along travel, pinch across it — the shape a falling drop
          // takes, and the reason this reads as volume rather than as a squash.
          const scaleY = 1 + speed * ELASTIC.stretch;
          const scaleX = 1 - speed * ELASTIC.stretch * ELASTIC.pinch;
          // Positional lag. Small, but it's what separates the bands from each
          // other instead of every one deforming in place.
          const y = -v * ELASTIC.lag;

          const transform =
            speed < 0.002
              ? // Cleared rather than left at an identity string, so a resting
                // band has no transform at all: no stacking context, no raster
                // layer, and no containing block over the sticky column inside.
                ""
              : `translate3d(0, ${y.toFixed(2)}px, 0) skewY(${skew.toFixed(3)}deg) scale(${scaleX.toFixed(4)}, ${scaleY.toFixed(4)})`;

          if (written.get(el) === transform) continue;
          written.set(el, transform);
          el.style.transform = transform;
          // will-change only while it is actually moving. Left on permanently it
          // would pin a full-height layer per band into GPU memory for nothing.
          el.style.willChange = transform ? "transform" : "";
        }
      };

      gsap.ticker.add(tick);

      return () => {
        observer.disconnect();
        gsap.ticker.remove(tick);
        for (const { el } of bands) {
          el.style.transform = "";
          el.style.willChange = "";
        }
      };
    });

    return () => mm.revert();
  }, []);

  return null;
}
