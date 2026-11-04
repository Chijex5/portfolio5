"use client";

import { useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

/**
 * The email address, set large. Clicking copies it (plenty of people have no
 * mail app set up) and still opens the mail app for those who do; hovering
 * pulls it a little toward the pointer.
 */
export default function EmailLink({ email }: { email: string }) {
  const root = useRef<HTMLAnchorElement>(null);
  const [copied, setCopied] = useState(false);

  useGSAP(
    () => {
      const el = root.current!;
      if (
        matchMedia("(prefers-reduced-motion: reduce)").matches ||
        !matchMedia("(hover: hover) and (pointer: fine)").matches
      )
        return;
      const x = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3" });
      const y = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3" });
      const move = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        x((e.clientX - (r.left + r.width / 2)) * 0.12);
        y((e.clientY - (r.top + r.height / 2)) * 0.3);
      };
      const leave = () => {
        x(0);
        y(0);
      };
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerleave", leave);
      return () => {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerleave", leave);
      };
    },
    { scope: root },
  );

  const copy = () => {
    navigator.clipboard
      ?.writeText(email)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2200);
      })
      .catch(() => {});
  };

  return (
    <a
      ref={root}
      href={`mailto:${email}`}
      onClick={copy}
      data-cursor="Copy"
      className="group relative inline-block text-[clamp(1.35rem,3.4vw,3.25rem)] tracking-[-0.03em]"
    >
      {email}
      <span className="bg-accent absolute -bottom-1 left-0 h-[2px] w-full origin-left scale-x-0 transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-x-100" />
      <span
        role="status"
        className={`label bg-ink text-paper absolute -top-10 left-1/2 -translate-x-1/2 rounded-full px-3 py-1.5 whitespace-nowrap transition-[opacity,translate] duration-500 ease-[var(--ease-out-expo)] ${
          copied
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-2 opacity-0"
        }`}
      >
        {copied ? "Copied ✓" : ""}
      </span>
    </a>
  );
}
