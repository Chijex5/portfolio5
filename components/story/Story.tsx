"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { chapter } from "@/lib/chapter";
import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";
import { intro } from "@/lib/intro";
import { CONTACT, SOCIAL_LINKS } from "@/lib/nav";
import { projects } from "@/lib/projects";
import { getLenis, lockScroll, recallStory, rememberStory } from "@/lib/scroll";
import { stage, type ShapeId } from "@/lib/stage/stage";
import ProjectChapter from "@/components/work/ProjectChapter";
import { SCENES } from "@/components/work/scenes";

/**
 * The home page: CJ's story told in eight beats, drawn by the particle stage.
 *
 *   hero     "CJ."             — who
 *   navy     an anchor         — the first plan
 *   jss2     <h1>, h1 to h6    — the textbook, Notepad, the feeling
 *   bribe    jollof + chicken  — how Computer Science became Statistics
 *   stats    a Galton board    — maths, done in his head
 *   build    a live graph      — the building stuck
 *   proof    seven scenes      — what came out of it, each acted out
 *   hello    "Say hello."      — the ask
 *
 * Each chapter is a tall section with a sticky, screen-high inner. Scrolling
 * into a section morphs the stage from the previous chapter's shape to this one;
 * scrolling through it holds the shape while its copy reads. The stage is driven
 * from one function of scroll position (`update`), so jumping anywhere — an
 * anchor, a reload mid-page, scrolling backwards — always lands on the right
 * picture.
 */

type Beat = {
  id: string;
  shape: ShapeId;
  index: string;
  label: string;
  /** Section height, in viewport heights. */
  vh: number;
};

const BEATS: readonly Beat[] = [
  { id: "top", shape: "cj", index: "00", label: "CJ", vh: 1 },
  { id: "navy", shape: "anchor", index: "01", label: "The Navy", vh: 1.8 },
  { id: "jss2", shape: "tag", index: "02", label: "JSS2", vh: 2.3 },
  { id: "bribe", shape: "plate", index: "03", label: "The bribe", vh: 2.4 },
  { id: "stats", shape: "bell", index: "04", label: "Statistics", vh: 1.8 },
  { id: "build", shape: "flow", index: "05", label: "Still building", vh: 1.8 },
  // The projects carry this chapter themselves; the stage drops to a quiet
  // field behind them. Its height is the sum of the project chapters.
  { id: "work", shape: "field", index: "06", label: "Proof", vh: 0 },
  { id: "contact", shape: "hello", index: "07", label: "Hello", vh: 1.6 },
];

const clamp = (v: number) => Math.min(1, Math.max(0, v));

export default function Story() {
  const root = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const busy = useRef(false);

  useGSAP(
    () => {
      const el = root.current!;
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const sections = BEATS.map((b) =>
        el.querySelector<HTMLElement>(`#${b.id}`)!,
      );
      // Coming back from a case study: the intro has played, so no waiting on it.
      const returning = stage.introduced;
      stage.show(true);
      if (returning) stage.skipIntro();

      // --- Geometry ---------------------------------------------------------
      let tops: number[] = [];
      const measure = () => {
        tops = sections.map(
          (s) => s.getBoundingClientRect().top + window.scrollY,
        );
      };

      // --- The one function of scroll ---------------------------------------
      const update = () => {
        if (!tops.length) return;
        const y = window.scrollY;
        const vh = window.innerHeight;

        let i = BEATS.length - 1;
        while (i > 0 && y < tops[i] - vh) i--;

        if (i === 0) {
          stage.set("cj", "cj", 1);
        } else {
          const prev = BEATS[i - 1];
          const beat = BEATS[i];
          const entry = (y - (tops[i] - vh)) / vh;
          if (entry < 1) {
            // The morph runs through the middle of the entry, so it settles just
            // as the chapter's copy arrives.
            stage.set(prev.shape, beat.shape, clamp((entry - 0.08) / 0.78));
          } else {
            stage.set(beat.shape, beat.shape, 1);
          }
        }

        let c = 0;
        for (let j = 0; j < BEATS.length; j++)
          if (tops[j] <= y + vh * 0.5) c = j;
        chapter.set({ index: BEATS[c].index, label: BEATS[c].label });
      };

      // Back from a case study: return to the project that was opened.
      // The router restores its own idea of the scroll after mount, so wait a
      // couple of frames and then put the visitor back.
      const back = recallStory();
      if (back !== null) {
        const restore = () => {
          getLenis()?.scrollTo(back, { immediate: true, force: true });
          window.scrollTo(0, back);
          ScrollTrigger.update();
        };
        requestAnimationFrame(() => requestAnimationFrame(restore));
        setTimeout(restore, 120);
      }

      ScrollTrigger.create({
        trigger: el,
        start: 0,
        end: "max",
        onUpdate: update,
        onRefresh: () => {
          measure();
          update();
        },
      });
      measure();
      update();

      // --- Copy reveals -----------------------------------------------------
      const lines = (
        target: HTMLElement,
        build: (lines: Element[]) => gsap.core.Animation,
      ) =>
        SplitText.create(target, {
          type: "lines",
          mask: "lines",
          linesClass: "split-line",
          autoSplit: true,
          onSplit: (self) => build(self.lines),
        });

      if (reduced) {
        gsap.set("[data-intro]", { autoAlpha: 1 });
        return;
      }

      // Hero: plays once, as the preloader leaves.
      const hero = sections[0];
      const heroTitle = hero.querySelector<HTMLElement>("[data-hero-title]")!;
      const heroBits = hero.querySelectorAll("[data-hero-bit]");
      gsap.set(heroBits, { autoAlpha: 0, y: 12 });
      let heroPlayed = false;
      lines(heroTitle, (ls) => {
        if (heroPlayed) return gsap.set(ls, { yPercent: 0 });
        return gsap.set(ls, { yPercent: 115 });
      });
      const offIntro = intro.onReveal(() => {
        heroPlayed = true;
        const ls = heroTitle.querySelectorAll(".split-line");
        const d = returning ? 0.15 : 0.9;
        gsap.to(ls, {
          yPercent: 0,
          duration: 1.4,
          ease: "expo.out",
          stagger: 0.12,
          delay: d,
        });
        gsap.to(heroBits, {
          autoAlpha: 1,
          y: 0,
          duration: 1,
          ease: "expo.out",
          stagger: 0.08,
          delay: d + 0.4,
        });
      });

      // Chapter headings: in as the chapter lands, back out if you scroll back.
      gsap.utils.toArray<HTMLElement>("[data-reveal]", el).forEach((t) => {
        const section = t.closest("section")!;
        lines(t, (ls) =>
          gsap.from(ls, {
            yPercent: 115,
            duration: 1.2,
            ease: "expo.out",
            stagger: 0.09,
            scrollTrigger: {
              trigger: section,
              start: "top 28%",
              toggleActions: "play none none reverse",
            },
          }),
        );
      });
      gsap.utils.toArray<HTMLElement>("[data-fade]", el).forEach((t) => {
        gsap.from(t, {
          autoAlpha: 0,
          y: 16,
          duration: 1,
          ease: "expo.out",
          delay: 0.25,
          scrollTrigger: {
            trigger: t.closest("section")!,
            start: "top 28%",
            toggleActions: "play none none reverse",
          },
        });
      });

      // Leaving: each chapter's copy lifts and fades as its section scrolls off,
      // so it never slides up under the header.
      gsap.utils.toArray<HTMLElement>("[data-exit]", el).forEach((t) => {
        const section = t.closest("section")!;
        const hero = section.id === "top";
        gsap.to(t, {
          autoAlpha: 0,
          y: -60,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: hero ? "top top" : "bottom bottom",
            end: hero ? "bottom 30%" : "bottom 45%",
            scrub: true,
          },
        });
      });

      // Lines that pile up one at a time as you hold in a chapter.
      sections.forEach((section) => {
        gsap.utils
          .toArray<HTMLElement>("[data-pile]", section)
          .forEach((t, i) => {
            gsap.fromTo(
              t,
              { yPercent: 110 },
              {
                yPercent: 0,
                ease: "power2.out",
                scrollTrigger: {
                  trigger: section,
                  start: () =>
                    `top+=${window.innerHeight * (i * 0.32 - 0.55)} top`,
                  end: () =>
                    `top+=${window.innerHeight * (i * 0.32 - 0.3)} top`,
                  scrub: 0.6,
                },
              },
            );
          });
      });

      return () => {
        offIntro();
      };
    },
    { scope: root },
  );

  // Leaving the page: the stage has nothing to show elsewhere.
  useEffect(() => () => stage.show(false, 0.3), []);

  // Opening a case study: let the story fade before the route changes, and
  // remember where it was so Back returns to this project.
  const open = (e: { preventDefault(): void }, slug: string) => {
    e.preventDefault();
    if (busy.current) return;
    busy.current = true;
    rememberStory();
    lockScroll(true);
    stage.show(false, 0.5);
    gsap.to(root.current, {
      autoAlpha: 0,
      duration: 0.5,
      ease: "power2.inOut",
      onComplete: () => {
        getLenis()?.scrollTo(0, { immediate: true, force: true });
        window.scrollTo(0, 0);
        lockScroll(false);
        router.push(`/work/${slug}`, { scroll: false });
      },
    });
  };

  return (
    <div ref={root} className="relative z-10">
      {/* 00 — Hero ---------------------------------------------------------- */}
      <section id="top" className="relative h-svh">
        <div
          data-exit
          className="absolute inset-x-4 bottom-20 md:inset-x-10 md:bottom-24"
        >
          <p
            data-intro
            data-hero-bit
            className="label text-ink-muted mb-6 md:mb-8"
          >
            {CONTACT.name} <span className="text-jollof">/</span> {CONTACT.role}
          </p>
          <h1
            data-intro
            data-hero-title
            className="display max-w-[11ch] text-[clamp(3.2rem,7.2vw,9rem)] md:max-w-[12ch]"
          >
            I build things that make people ask{" "}
            <em className="turn">who made this?</em>
          </h1>
        </div>
        <p
          data-intro
          data-hero-bit
          className="label text-ink-muted absolute right-4 bottom-20 hidden items-center gap-3 md:right-10 md:bottom-24 md:flex"
        >
          Scroll for the story
          <span className="bg-ink-faint relative block h-8 w-px overflow-hidden">
            <span className="bg-jollof absolute inset-x-0 top-0 h-1/2 animate-[drip_1.8s_ease-in-out_infinite]" />
          </span>
        </p>
      </section>

      {/* 01 — The Navy ------------------------------------------------------ */}
      <Chapter id="navy" vh={BEATS[1].vh}>
        <Eyebrow index="01" label="The Navy" />
        <h2 data-reveal className="display text-[clamp(2.8rem,7vw,8rem)]">
          Primary-school plan: the <em className="turn">Navy.</em>
        </h2>
        <p data-fade className="label text-ink-muted mt-6">
          Got as far as military boarding school. Always hungry.
        </p>
      </Chapter>

      {/* 02 — JSS2 ---------------------------------------------------------- */}
      <Chapter id="jss2" vh={BEATS[2].vh}>
        <Eyebrow index="02" label="JSS2" />
        <h2 className="sr-only">How it started</h2>
        <ul className="display space-y-[0.08em] text-[clamp(2.4rem,5.4vw,6.5rem)]">
          <li className="line-mask">
            <span data-pile className="block">
              One HTML textbook.
            </span>
          </li>
          <li className="line-mask">
            <span data-pile className="block">
              Notepad. A single{" "}
              <code className="text-jollof font-mono text-[0.72em] font-normal tracking-[-0.04em]">
                &lt;h1&gt;
              </code>
            </span>
          </li>
          <li className="line-mask">
            <span data-pile className="block">
              I felt like a <em className="turn">god.</em>
            </span>
          </li>
        </ul>
        <p data-fade className="label text-ink-muted mt-6">
          Never figured out CSS that term. Still chasing that feeling.
        </p>
      </Chapter>

      {/* 03 — The bribe ----------------------------------------------------- */}
      <Chapter id="bribe" vh={BEATS[3].vh}>
        <Eyebrow index="03" label="The bribe" />
        <h2 data-reveal className="display text-[clamp(2.6rem,6.2vw,7.25rem)]">
          I wanted Computer Science. Then Mum visited with{" "}
          <em className="turn">jollof.</em>
        </h2>
        <p data-fade className="label text-ink-muted mt-6 max-w-[46ch]">
          Six big pieces of chicken. A lot of plantain. I said{" "}
          <span className="text-ink">&ldquo;yes ma.&rdquo;</span>
        </p>
      </Chapter>

      {/* 04 — Statistics ---------------------------------------------------- */}
      <Chapter id="stats" vh={BEATS[4].vh}>
        <Eyebrow index="04" label="Statistics" />
        <h2 data-reveal className="display text-[clamp(2.8rem,7vw,8rem)]">
          So: <em className="turn">Statistics.</em>
        </h2>
        <p data-fade className="label text-ink-muted mt-6">
          I do the maths in my head. Slowly, but correctly.
        </p>
      </Chapter>

      {/* 05 — Still building ------------------------------------------------ */}
      <Chapter id="build" vh={BEATS[5].vh}>
        <Eyebrow index="05" label="Still building" />
        <h2 data-reveal className="display text-[clamp(2.6rem,6.4vw,7.5rem)]">
          The AI plan never stuck. The <em className="turn">building</em> did.
        </h2>
        <p data-fade className="label text-ink-muted mt-6">
          Schema, API, interface — React, Next.js, TypeScript, Python, Postgres.
        </p>
      </Chapter>

      {/* 06 — Proof: each project acts itself out ------------------------ */}
      <section id="work" className="relative">
        <h2 className="sr-only">Selected work</h2>
        {projects.map((p, i) => {
          const scene = SCENES[p.slug];
          if (!scene) return null;
          return (
            <ProjectChapter
              key={p.slug}
              project={p}
              index={i}
              total={projects.length}
              scene={scene}
              onOpen={(e) => open(e, p.slug)}
            />
          );
        })}
      </section>

      {/* 07 — Hello --------------------------------------------------------- */}
      <section
        id="contact"
        className="relative"
        style={{ height: `${BEATS[7].vh * 100}svh` }}
      >
        <div className="sticky top-0 flex h-svh flex-col justify-end px-4 pb-20 md:px-10 md:pb-24">
          <h2 className="sr-only">Say hello</h2>
          <div className="flex flex-col items-center text-center">
            <p data-fade className="label text-ink-muted mb-6 max-w-[40ch]">
              {CONTACT.status}
            </p>
            <a
              data-fade
              href={`mailto:${CONTACT.email}`}
              data-cursor="Write"
              className="group relative text-[clamp(1.35rem,3.4vw,3.25rem)] tracking-[-0.03em]"
            >
              {CONTACT.email}
              <span className="bg-jollof absolute -bottom-1 left-0 h-[2px] w-full origin-left scale-x-0 transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-x-100" />
            </a>
            <ul
              data-fade
              className="label mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3"
            >
              {SOCIAL_LINKS.map((s) => (
                <li key={s.href}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="hover:text-jollof transition-colors"
                  >
                    {s.label} ↗
                  </a>
                </li>
              ))}
              <li>
                <a
                  href={CONTACT.writing}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="hover:text-jollof transition-colors"
                >
                  Writing ↗
                </a>
              </li>
            </ul>
          </div>
          <p className="label text-ink-muted mt-14 hidden justify-center md:flex">
            © {new Date().getFullYear()} {CONTACT.name}
          </p>
        </div>
      </section>
    </div>
  );
}

function Chapter({
  id,
  vh,
  top,
  children,
}: {
  id: string;
  vh: number;
  /** Copy at the top of the screen instead of the bottom. */
  top?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="relative" style={{ height: `${vh * 100}svh` }}>
      <div className="sticky top-0 h-svh">
        <div
          data-exit
          className={
            top
              ? "absolute inset-x-4 top-24 md:inset-x-10 md:top-32"
              : "absolute inset-x-4 bottom-20 md:inset-x-10 md:bottom-24 md:max-w-[44vw]"
          }
        >
          {children}
        </div>
      </div>
    </section>
  );
}

function Eyebrow({
  index,
  label,
  children,
}: {
  index: string;
  label: string;
  children?: React.ReactNode;
}) {
  return (
    <p data-fade className="label mb-5 flex items-center md:mb-7">
      <span className="text-jollof">({index})</span>
      <span className="bg-ink-faint mx-3 h-px w-8" />
      <span className="text-ink-muted">{label}</span>
      {children}
    </p>
  );
}
