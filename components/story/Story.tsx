"use client";

import { useRouter } from "next/navigation";
import { Fragment, useEffect, useRef } from "react";
import { chapter } from "@/lib/chapter";
import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";
import { intro } from "@/lib/intro";
import { CONTACT, SOCIAL_LINKS } from "@/lib/nav";
import { projects } from "@/lib/projects";
import { getLenis, lockScroll, recallStory, rememberStory } from "@/lib/scroll";
import { stage, type ShapeId } from "@/lib/stage/stage";
import SectionTitle from "@/components/story/SectionTitle";
import ProjectChapter from "@/components/work/ProjectChapter";
import { SCENES } from "@/components/work/scenes";

/**
 * The home page, drawn over the particle stage:
 *
 *   hero     "CJ."         — who, what, and how to reach him
 *   work     quiet field   — each project acted out
 *   about    quiet field   — stack, what he's on now, GitHub activity
 *   hello    "Say hello."  — the ask
 *
 * The hero, work and hello hold the screen while their section scrolls
 * past; about reads like a normal page. Scrolling into a section morphs the
 * stage from the previous section's shape to this one. The stage is driven
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
  { id: "top", shape: "cj", index: "00", label: "Intro", vh: 1 },
  // The projects carry this chapter themselves; the stage drops to a quiet
  // field behind them. Its height is the sum of the project chapters.
  { id: "work", shape: "field", index: "01", label: "Work", vh: 0 },
  // Natural height: it is read, not scrubbed.
  { id: "about", shape: "field", index: "02", label: "About", vh: 0 },
  { id: "contact", shape: "hello", index: "03", label: "Hello", vh: 1.6 },
];

const clamp = (v: number) => Math.min(1, Math.max(0, v));

/** What CJ is on right now. */
const NOW = [
  { label: "Building", value: "Rise Classroom" },
  { label: "Learning", value: "Risevest Academy" },
  { label: "Studied", value: "Statistics, University of Nigeria" },
  { label: "Based", value: "Lagos · remote" },
] as const;

const MARQUEE = [
  "Got something worth building?",
  "Let's talk",
  "Got something worth building?",
  "Let's talk",
] as const;

const STACK = [
  { group: "Frontend", items: ["React", "Next.js", "TypeScript", "Tailwind"] },
  { group: "Mobile", items: ["React Native"] },
  { group: "Backend", items: ["Python", "FastAPI"] },
  { group: "Data", items: ["PostgreSQL", "MongoDB"] },
] as const;

export default function Story({
  activity,
}: {
  /** The GitHub activity block, rendered on the server. */
  activity?: React.ReactNode;
}) {
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

      // Section titles: the outlined echoes fan out below the word as it
      // comes up the screen, and fold back if you scroll back.
      gsap.utils.toArray<HTMLElement>("[data-echo]", el).forEach((echo) => {
        const k = Number(echo.dataset.echo);
        gsap.fromTo(
          echo,
          { yPercent: 0, autoAlpha: 0 },
          {
            yPercent: k * 26,
            autoAlpha: 1,
            ease: "none",
            scrollTrigger: {
              trigger: echo.closest("[data-title]")!,
              start: "top 85%",
              end: "top 35%",
              scrub: 0.6,
            },
          },
        );
      });

      // About is a normal page: each block fades up as it reaches the screen.
      gsap.utils.toArray<HTMLElement>("[data-rise]", el).forEach((t) => {
        gsap.from(t, {
          autoAlpha: 0,
          y: 24,
          duration: 1,
          ease: "expo.out",
          scrollTrigger: {
            trigger: t,
            start: "top 88%",
            toggleActions: "play none none reverse",
          },
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
            className="label text-ink-muted mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 md:mb-8"
          >
            <span>
              {CONTACT.name} <span className="text-accent">/</span>{" "}
              {CONTACT.role}
            </span>
            {CONTACT.available && (
              <span className="border-accent text-accent inline-flex -rotate-3 items-center gap-2 border px-2 py-1">
                <span className="bg-accent h-1.5 w-1.5 animate-pulse rounded-full" />
                Open to work · Freelance
              </span>
            )}
          </p>
          <h1
            data-intro
            data-hero-title
            className="display max-w-[12ch] text-[clamp(3.2rem,7.6vw,9.5rem)]"
          >
            I build web products people actually <em className="turn">use.</em>
          </h1>
          <div
            data-intro
            data-hero-bit
            className="mt-8 flex flex-wrap items-center gap-3 md:mt-10"
          >
            <a
              href="#work"
              className="bg-ink text-paper hover:bg-accent rounded-full px-5 py-3 text-[0.95rem] tracking-[-0.01em] transition-colors"
            >
              See the work
            </a>
            <a
              href={`mailto:${CONTACT.email}`}
              className="border-ink-faint hover:border-ink rounded-full border px-5 py-3 text-[0.95rem] tracking-[-0.01em] transition-colors"
            >
              Email me
            </a>
          </div>
        </div>
        <p
          data-intro
          data-hero-bit
          className="label text-ink-muted absolute right-4 bottom-20 hidden items-center gap-3 md:right-10 md:bottom-24 md:flex"
        >
          Scroll for the work
          <span className="bg-ink-faint relative block h-8 w-px overflow-hidden">
            <span className="bg-accent absolute inset-x-0 top-0 h-1/2 animate-[drip_1.8s_ease-in-out_infinite]" />
          </span>
        </p>
      </section>

      {/* 01 — Work: each project acts itself out ------------------------- */}
      <section id="work" aria-labelledby="work-title" className="relative">
        <div className="grid gap-y-10 px-4 pt-32 pb-16 md:grid-cols-12 md:gap-x-10 md:px-10 md:pt-48 md:pb-24">
          <div className="md:col-span-5">
            <SectionTitle
              id="work-title"
              word="Work"
              index="01"
              label={`Selected work (${String(projects.length).padStart(2, "0")})`}
            />
            <p
              data-rise
              className="text-ink-muted mt-6 max-w-[34ch] text-[clamp(1.05rem,1.35vw,1.3rem)] leading-snug tracking-[-0.01em] md:mt-10"
            >
              Products I took from idea to shipped. Each one plays out below as
              you scroll — or jump straight to one.
            </p>
          </div>
          <ol className="border-ink-faint self-end border-t md:col-span-7 md:col-start-6">
            {projects.map((p) => (
              <li key={p.slug} data-rise className="border-ink-faint border-b">
                <a
                  href={`#work-${p.slug}`}
                  className="group grid grid-cols-[2.5rem_1fr_auto] items-baseline gap-x-4 py-4 md:grid-cols-[3rem_1fr_10rem_2rem] md:py-5"
                >
                  <span className="label text-ink-muted">{p.index}</span>
                  <span className="group-hover:text-accent text-[clamp(1.35rem,2.4vw,2.25rem)] font-medium tracking-[-0.03em] transition-[color,translate] duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-2">
                    {p.title}
                  </span>
                  <span className="label text-ink-muted hidden md:block">
                    {p.category} · {p.year}
                  </span>
                  <span
                    aria-hidden="true"
                    className="text-ink-muted group-hover:text-accent justify-self-end transition-[color,rotate] duration-500 group-hover:-rotate-45"
                  >
                    →
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </div>
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

      {/* 02 — About ------------------------------------------------------- */}
      <section
        id="about"
        aria-labelledby="about-title"
        className="relative px-4 pt-32 pb-24 md:px-10 md:pt-48 md:pb-40"
      >
        <div className="grid gap-y-6 md:grid-cols-12 md:items-end md:gap-x-10">
          <div className="md:col-span-5">
            <SectionTitle
              id="about-title"
              word="About"
              index="02"
              label="Who"
            />
          </div>
          <p
            data-reveal
            className="display max-w-[18ch] pb-[0.5em] text-[clamp(2.2rem,4.2vw,4.75rem)] md:col-span-7 md:col-start-6"
          >
            I like owning the whole picture — schema, API, and the{" "}
            <em className="turn">interface.</em>
          </p>
        </div>
        <div className="mt-14 grid gap-x-10 gap-y-14 md:mt-20 md:grid-cols-12">
          <div
            data-rise
            className="text-ink-muted space-y-5 text-[clamp(1.05rem,1.35vw,1.3rem)] leading-snug tracking-[-0.01em] md:col-span-6"
          >
            <p>
              My work usually starts as a problem someone actually has — a
              cohort that outgrew Google Classroom, a brand stuck on a
              storefront it can&rsquo;t control, a town that never knows if the
              light is out for everyone. I build the thing, then sand the edges
              until I&rsquo;d hand it to a friend without a disclaimer.
            </p>
            <p>
              I care about performance, honest copy, and interfaces that get out
              of the way.
            </p>
          </div>
          <dl
            data-rise
            className="grid grid-cols-[auto_1fr] content-start gap-x-8 gap-y-4 md:col-span-5 md:col-start-8"
          >
            {NOW.map((n) => (
              <Fragment key={n.label}>
                <dt className="label text-ink-muted pt-1">{n.label}</dt>
                <dd className="text-[1.05rem] tracking-[-0.01em]">{n.value}</dd>
              </Fragment>
            ))}
          </dl>
        </div>

        <div className="mt-20 md:mt-28">
          <SectionTitle word="Stack" />
          <ul className="border-ink-faint mt-6 grid grid-cols-2 border-t md:mt-10 md:grid-cols-4">
            {STACK.map((g) => (
              <li
                key={g.group}
                data-rise
                className="border-ink-faint hover:bg-paper-raised border-b py-6 transition-colors duration-500 max-md:odd:border-r max-md:odd:pr-4 max-md:even:pl-4 md:border-r md:px-6 md:py-8 md:last:border-r-0"
              >
                <p className="label text-accent">{g.group}</p>
                <ul className="mt-4 space-y-1.5">
                  {g.items.map((item) => (
                    <li
                      key={item}
                      className="text-[clamp(1.15rem,1.6vw,1.5rem)] tracking-[-0.02em]"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>

        {activity && (
          <div data-rise className="mt-20 md:mt-28">
            {activity}
          </div>
        )}
      </section>

      {/* The ask, scrolling ------------------------------------------------ */}
      <a
        href={`mailto:${CONTACT.email}`}
        data-cursor="Write"
        aria-label={`Email ${CONTACT.email}`}
        className="border-ink-faint group relative block overflow-hidden border-y py-6 md:py-8"
      >
        <span className="marquee-track flex w-max">
          {[0, 1].map((copy) => (
            <span
              key={copy}
              aria-hidden="true"
              className="display flex shrink-0 items-center text-[clamp(3rem,8vw,7.5rem)] whitespace-nowrap"
            >
              {MARQUEE.map((t, i) => (
                <span key={i} className="flex items-center">
                  <span
                    className={
                      i % 2
                        ? "outline-text group-hover:text-accent transition-colors duration-500"
                        : "group-hover:text-accent transition-colors duration-500"
                    }
                  >
                    {t}
                  </span>
                  <span className="text-accent mx-[0.35em] text-[0.5em]">
                    ✦
                  </span>
                </span>
              ))}
            </span>
          ))}
        </span>
      </a>

      {/* 03 — Hello --------------------------------------------------------- */}
      <section
        id="contact"
        className="relative"
        style={{ height: `${BEATS[3].vh * 100}svh` }}
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
              <span className="bg-accent absolute -bottom-1 left-0 h-[2px] w-full origin-left scale-x-0 transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-x-100" />
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
                    className="hover:text-accent transition-colors"
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
                  className="hover:text-accent transition-colors"
                >
                  Writing ↗
                </a>
              </li>
            </ul>
          </div>
          <footer className="label text-ink-muted mt-14 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
            <span>
              © {new Date().getFullYear()} {CONTACT.name}
            </span>
            <span className="hidden md:inline">
              Built with Next.js, GSAP &amp; WebGL
            </span>
            <a href="#top" className="hover:text-accent transition-colors">
              Back to top ↑
            </a>
          </footer>
        </div>
      </section>
    </div>
  );
}
