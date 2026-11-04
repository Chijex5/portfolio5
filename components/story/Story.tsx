"use client";

import { useRouter } from "next/navigation";
import { Fragment, useRef } from "react";
import { chapter } from "@/lib/chapter";
import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";
import { CONTACT, SOCIAL_LINKS } from "@/lib/nav";
import { projects } from "@/lib/projects";
import { getLenis, lockScroll, recallStory, rememberStory } from "@/lib/scroll";
import BuildSequence from "@/components/build/BuildSequence";
import LivingWord from "@/components/hero/LivingWord";
import XRayHero from "@/components/hero/XRayHero";
import EmailLink from "@/components/shared/EmailLink";
import SectionTitle from "@/components/story/SectionTitle";
import ProjectChapter from "@/components/work/ProjectChapter";
import WorkIndex from "@/components/work/WorkIndex";
import { SCENES } from "@/components/work/scenes";

/**
 * The home page:
 *
 *   hero     the statement, with an x-ray lens onto how it's built
 *   build    a feature built in four scrolls, data to button
 *   work     each project acted out
 *   about    who, what he is on now, stack, GitHub activity
 *   hello    a living "Say hello." and the ways to do it
 *
 * The section the visitor is in drives the HUD's running label.
 */

const SECTIONS = [
  { id: "top", index: "00", label: "Intro" },
  { id: "build", index: "01", label: "How I build" },
  { id: "work", index: "02", label: "Work" },
  { id: "about", index: "03", label: "About" },
  { id: "contact", index: "04", label: "Hello" },
] as const;

/** What CJ is on right now. */
const NOW = [
  { label: "Building", value: "Rise Classroom" },
  { label: "Learning", value: "Risevest Academy" },
  { label: "Studied", value: "Statistics, University of Nigeria" },
  { label: "Based", value: "Lagos · remote" },
] as const;

const MARQUEE = [
  "Got something worth building?",
  "I'm listening",
  "Got something worth building?",
  "I'm listening",
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

      // The HUD's running label: whichever section holds the middle of the
      // screen.
      SECTIONS.forEach((sec) => {
        const target = el.querySelector<HTMLElement>(`#${sec.id}`);
        if (!target) return;
        ScrollTrigger.create({
          trigger: target,
          start: "top 50%",
          end: "bottom 50%",
          onToggle: (self) => {
            if (self.isActive)
              chapter.set({ index: sec.index, label: sec.label });
          },
        });
      });
      chapter.set({ index: "00", label: "Intro" });

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

      // The accent word's signature: it arrives squeezed and lets itself out
      // to full width (the display face's width axis). Split lines are
      // measured at the final width, so the word only ever grows into room
      // that is already there.
      const stretch = (word: Element) =>
        gsap.fromTo(
          word,
          { fontStretch: "56%" },
          { fontStretch: "128%", duration: 1.5, ease: "expo.out" },
        );

      // Headings: lines rise out of their masks, then the accent word
      // stretches. Back out if you scroll back above them.
      gsap.utils.toArray<HTMLElement>("[data-reveal]", el).forEach((t) => {
        lines(t, (ls) => {
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: t,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          });
          tl.from(ls, {
            yPercent: 115,
            duration: 1.2,
            ease: "expo.out",
            stagger: 0.09,
          });
          t.querySelectorAll(".turn").forEach((w) => tl.add(stretch(w), 0.35));
          return tl;
        });
      });

      // Section titles: letter by letter, each rising and widening into
      // place, the outlined echoes trailing behind (below).
      gsap.utils.toArray<HTMLElement>("[data-chars]", el).forEach((t) => {
        SplitText.create(t, {
          type: "chars",
          mask: "chars",
          autoSplit: true,
          onSplit: (self) =>
            gsap.fromTo(
              self.chars,
              { yPercent: 105, fontStretch: "40%" },
              {
                yPercent: 0,
                fontStretch: "64%",
                duration: 1.1,
                ease: "expo.out",
                stagger: 0.045,
                scrollTrigger: {
                  trigger: t,
                  start: "top 88%",
                  toggleActions: "play none none reverse",
                },
              },
            ),
        });
      });

      gsap.utils.toArray<HTMLElement>("[data-fade]", el).forEach((t) => {
        gsap.from(t, {
          autoAlpha: 0,
          y: 16,
          duration: 1,
          ease: "expo.out",
          scrollTrigger: {
            trigger: t,
            start: "top 90%",
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

      // The year fills in, week by week, and the total counts up to it.
      const heat = el.querySelector<HTMLElement>("[data-heat]");
      if (heat) {
        const total = el.querySelector<HTMLElement>("[data-total]");
        const to = Number(total?.textContent?.replace(/\D/g, "") || 0);
        const n = { v: 0 };
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: heat,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        });
        tl.from(heat.querySelectorAll("[data-cell]"), {
          scale: 0,
          autoAlpha: 0,
          duration: 0.4,
          ease: "back.out(2)",
          stagger: { each: 0.0022 },
        });
        if (total)
          tl.fromTo(
            n,
            { v: 0 },
            {
              v: to,
              duration: 1.6,
              ease: "power2.out",
              onUpdate: () => {
                total.textContent = Math.round(n.v).toLocaleString("en");
              },
            },
            0,
          );
      }

      // The ask, scrolling: drifts on its own, rushes and leans with the
      // scroll, then settles back.
      const track = el.querySelector<HTMLElement>("[data-marquee]");
      if (track) {
        const loop = gsap.to(track, {
          xPercent: -50,
          duration: 32,
          ease: "none",
          repeat: -1,
        });
        // Start deep into the loop so scrolling back up can run it backwards.
        loop.totalTime(32 * 50);
        const lean = gsap.quickTo(track, "skewX", {
          duration: 0.5,
          ease: "power3",
        });
        ScrollTrigger.create({
          trigger: track,
          start: "top bottom",
          end: "bottom top",
          onUpdate: (self) => {
            const v = self.getVelocity();
            const boost = 1 + Math.min(Math.abs(v) / 300, 5);
            gsap.to(loop, {
              timeScale: self.direction * boost,
              duration: 0.2,
              overwrite: true,
            });
            gsap.to(loop, {
              timeScale: self.direction,
              duration: 1.2,
              delay: 0.25,
              ease: "power2.out",
            });
            lean(gsap.utils.clamp(-8, 8, -v / 250));
            gsap.delayedCall(0.2, () => lean(0));
          },
        });
      }

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
    },
    { scope: root },
  );

  // Opening a case study: let the story fade before the route changes, and
  // remember where it was so Back returns to this project.
  const open = (e: { preventDefault(): void }, slug: string) => {
    e.preventDefault();
    if (busy.current) return;
    busy.current = true;
    rememberStory();
    lockScroll(true);
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
      <XRayHero />

      <BuildSequence />

      {/* 01 — Work: each project acts itself out ------------------------- */}
      <section id="work" aria-labelledby="work-title" className="relative">
        <div className="grid gap-y-10 px-4 pt-32 pb-16 md:grid-cols-12 md:gap-x-10 md:px-10 md:pt-48 md:pb-24">
          <div className="md:col-span-5">
            <SectionTitle
              id="work-title"
              word="Work"
              index="02"
              label={`Selected work (${String(projects.length).padStart(2, "0")})`}
            />
            <p
              data-rise
              className="text-ink-muted mt-6 max-w-[34ch] text-[clamp(1.05rem,1.35vw,1.3rem)] leading-snug tracking-[-0.01em] md:mt-10"
            >
              Things I built because something annoyed me, or someone asked
              nicely. Scroll and each one plays out, or skip to the one you came
              for.
            </p>
          </div>
          <WorkIndex className="border-ink-faint self-end border-t md:col-span-7 md:col-start-6" />
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
              index="03"
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
              I&rsquo;m Chijioke, though most people call me{" "}
              <span className="text-ink">CJ</span>. I design the data, wire up
              the API, and sweat the interface until it feels obvious.
            </p>
            <p>
              I learn fast: new tool on Monday, shipping with it by Friday. I do
              the maths in my head (slowly, but correctly), and I care about
              performance, honest copy and interfaces that get out of the way.
            </p>
            <p>
              Away from the keyboard, I&rsquo;ll know a song&rsquo;s lyrics
              after two plays, give you a nickname you didn&rsquo;t ask for, and
              lose any cooking contest you enter me in.
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
          <p
            data-rise
            className="text-ink-muted max-w-[44ch] text-[clamp(1.05rem,1.35vw,1.3rem)] leading-snug tracking-[-0.01em]"
          >
            What I reach for first. I&rsquo;ll pick up whatever the job actually
            needs.
          </p>
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
        <span data-marquee className="flex w-max">
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

      {/* 04 — Hello --------------------------------------------------------- */}
      <section
        id="contact"
        aria-labelledby="contact-title"
        className="relative flex flex-col justify-end px-4 pt-40 pb-16 md:min-h-svh md:px-10 md:pt-32 md:pb-20"
      >
        <h2 id="contact-title" className="sr-only">
          Say hello
        </h2>
        <LivingWord
          text="Say hello."
          accents={[9]}
          enter="scroll"
          label="Say hello."
        />
        <div className="border-ink-faint mt-8 grid gap-y-10 border-t pt-8 md:mt-10 md:grid-cols-12 md:gap-x-10 md:pt-10">
          <div className="md:col-span-7">
            <p data-fade className="label text-ink-muted mb-4">
              {CONTACT.status}
            </p>
            <div data-fade>
              <EmailLink email={CONTACT.email} />
            </div>
          </div>
          <ul
            data-fade
            className="grid grid-cols-2 content-start gap-x-6 gap-y-3 md:col-span-4 md:col-start-9"
          >
            {[...SOCIAL_LINKS, { href: CONTACT.writing, label: "Writing" }].map(
              (s) => (
                <li key={s.href}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="group border-ink-faint hover:text-accent flex items-baseline justify-between border-b pb-2 text-[1.05rem] tracking-[-0.01em] transition-colors"
                  >
                    {s.label}
                    <span className="text-ink-muted group-hover:text-accent transition-[color,rotate] duration-500 group-hover:-rotate-45">
                      →
                    </span>
                  </a>
                </li>
              ),
            )}
          </ul>
        </div>
        <footer className="label text-ink-muted mt-16 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 md:mt-20">
          <span>
            © {new Date().getFullYear()} {CONTACT.name}
          </span>
          <span className="hidden md:inline">
            Designed &amp; built by CJ, with Next.js, GSAP and too much
            curiosity
          </span>
          <a href="#top" className="hover:text-accent transition-colors">
            Back to top ↑
          </a>
        </footer>
      </section>
    </div>
  );
}
