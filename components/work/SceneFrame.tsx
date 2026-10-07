"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";

/** Every scene is drawn on a fixed canvas, then scaled to fit its box. */
export const SCENE_W = 600;
export const SCENE_H = 460;

/**
 * How much of the canvas width a narrow box shows at once. Below this, fitting
 * the whole scene would shrink its text to ~8px, so the frame zooms in to this
 * window and follows the action instead.
 */
const FOCUS_W = 380;

/**
 * The scene's camera, in canvas px. Scenes tween `x` inside their timeline
 * (`tl.to(camera, { x: 432 }, t)`) to say where the action is; the frame only
 * honours it when it is too narrow to show the whole canvas.
 */
export type Camera = { x: number };
const CameraContext = createContext<Camera>({ x: SCENE_W / 2 });
export const useCamera = () => useContext(CameraContext);

/**
 * Fits a fixed-size scene into whatever box it is given. Scenes are laid out in
 * absolute px, so scaling the whole canvas is what keeps their choreography
 * identical from a phone to a wide screen.
 */
export default function SceneFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  // One mutable object per frame, handed to the scene; GSAP writes its x.
  const [camera] = useState<Camera>(() => ({ x: SCENE_W / 2 }));

  useEffect(() => {
    const b = box.current;
    const i = inner.current;
    if (!b || !i) return;
    let k = 1;
    let follow = false;
    let lastX = NaN;

    const place = () => {
      // Pan so the camera's x is centred, without showing past the canvas edges.
      let pan = 0;
      if (follow) {
        const half = b.clientWidth / 2 / k;
        const x = Math.min(SCENE_W - half, Math.max(half, camera.x));
        pan = (SCENE_W / 2 - x) * k;
      }
      i.style.transform = `translate(calc(-50% + ${pan}px), -50%) scale(${k})`;
      lastX = camera.x;
    };
    const fit = () => {
      const whole = Math.min(b.clientWidth / SCENE_W, b.clientHeight / SCENE_H);
      const zoomed = Math.min(
        b.clientWidth / FOCUS_W,
        b.clientHeight / SCENE_H,
      );
      // Only zoom when the whole scene would render too small to read.
      follow = whole < 0.85 && zoomed > whole * 1.15;
      k = follow ? zoomed : whole;
      place();
    };
    const tick = () => {
      if (follow && camera.x !== lastX) place();
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(b);
    gsap.ticker.add(tick);
    return () => {
      ro.disconnect();
      gsap.ticker.remove(tick);
    };
  }, [camera]);

  return (
    <div ref={box} className={`relative overflow-hidden ${className ?? ""}`}>
      <div
        ref={inner}
        className="absolute top-1/2 left-1/2 origin-center"
        style={{ width: SCENE_W, height: SCENE_H }}
      >
        <CameraContext.Provider value={camera}>
          {children}
        </CameraContext.Provider>
      </div>
    </div>
  );
}
