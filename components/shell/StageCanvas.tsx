"use client";

import { useEffect, useRef } from "react";
import { stage } from "@/lib/stage/stage";

/**
 * Mounts the particle stage's canvas. In the root layout, so the canvas survives
 * route changes — see lib/stage/stage.ts for why that matters.
 */
export default function StageCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // After first paint and hydration, so GL setup never queues behind them.
    const start = () => {
      if (ref.current) stage.init(ref.current).catch(() => undefined);
    };
    const idle = typeof window.requestIdleCallback === "function";
    const id = idle
      ? window.requestIdleCallback(start, { timeout: 300 })
      : window.setTimeout(start, 50);
    return () =>
      idle ? window.cancelIdleCallback(id) : window.clearTimeout(id);
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="stage" />;
}
