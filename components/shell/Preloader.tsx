"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { intro } from "@/lib/intro";
import { lockScroll } from "@/lib/scroll";
import { stage } from "@/lib/stage/stage";

/** Give up waiting on the stage after this and let the page in anyway. */
const GIVE_UP = 7;

/**
 * The counter itself, as an inline script inside the preloader: it runs the
 * moment the browser parses it, before any of the app's JavaScript arrives.
 *
 * It counts on the frame clock, and each frame may only move it forward by
 * what 50ms would — so when the main thread stalls (the app booting, the
 * stage building its shapes), the count pauses and then carries on from
 * where it was. It never leaps ahead to catch up, so every number is shown.
 * It eases a little as it nears 99, stops there, and publishes its state on
 * `window.__pl` for the component below, which stops it (\`stop\`), rolls
 * it to 100 and exits.
 */
const COUNT_SCRIPT = `(function(){
var root=document.currentScript.parentNode,
reels=root.querySelectorAll(".pl-reel"),bar=root.querySelector(".pl-bar"),
step=100/11,
dur=document.documentElement.hasAttribute("data-seen")?1.1:2.0,
reduced=matchMedia("(prefers-reduced-motion: reduce)").matches,
pl=window.__pl={n:0,done:false,stop:false},v=0,last=0,shown=-1;
function draw(){var n=Math.min(99,Math.floor(v));if(n===shown)return;shown=n;pl.n=n;
var d=[0,Math.floor(n/10),n%10];
for(var i=0;i<3;i++)reels[i].style.transform="translateY("+(-d[i]*step)+"%)";
bar.style.transform="scaleX("+(n/100)+")";}
function tick(t){if(pl.stop)return;if(!last)last=t;var dt=Math.min(t-last,50);last=t;
v+=reduced?100:(dt/1000)*(100/dur)*(1.35-0.7*v/100);
draw();if(v>=99){pl.done=true;return;}requestAnimationFrame(tick);}
draw();requestAnimationFrame(tick);})();`;

/** 0–9 and a second 0, so a reel can roll from 9 over into 0 without jumping. */
const REEL = "01234567890".split("");
const STEP = 100 / REEL.length;

/**
 * The opening.
 *
 * The count 00 → 99 is COUNT_SCRIPT above, running from the first parse.
 * This component only does the finish: once the count has reached 99 and
 * the page is ready, all three reels roll over from 99 to 100 together,
 * rest, and the exit plays — the labels and number
 * lift out, the paper wipes up with an accent band chasing it, and as it
 * clears the particles fly into "CJ." and the headline rises.
 */
export default function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const curtain = useRef<HTMLDivElement>(null);
  const reels = useRef<(HTMLSpanElement | null)[]>([]);
  const bar = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = root.current;
    const band = curtain.current;
    if (!el || !band) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    lockScroll(true);
    window.scrollTo(0, 0);

    let done = false;
    let exit: gsap.core.Timeline | null = null;
    const [hundreds, tens, units] = reels.current;

    // The inline counter's state. If it never ran (scripts blocked inline),
    // there is nothing to wait for.
    const pl = (
      window as unknown as {
        __pl?: { n: number; done: boolean; stop: boolean };
      }
    ).__pl;
    const counted = () => !pl || pl.done;
    const ready = () => stage.ready || stage.failed;

    const leave = () => {
      if (done) return;
      done = true;
      const fast = reduced ? 0.01 : 1;

      // Take the reels over from the counter where they stand (normally 099;
      // earlier only if we gave up waiting), dropping their CSS slide so it
      // can't fight GSAP, then roll every one of them over to 100 together,
      // units leading.
      const n = pl ? pl.n : 99;
      [hundreds, tens, units].forEach((reel, i) => {
        if (!reel) return;
        reel.style.transition = "none";
        const d = [0, Math.floor(n / 10), n % 10][i];
        gsap.set(reel, { yPercent: -d * STEP, y: 0 });
      });
      // And stop it, in case we gave up waiting mid-count.
      if (pl) pl.stop = true;

      exit = gsap.timeline({
        onComplete: () => {
          el.style.display = "none";
          band.style.display = "none";
        },
      });
      exit.to([units, tens], {
        yPercent: -10 * STEP,
        duration: 0.7 * fast,
        ease: "expo.inOut",
        stagger: 0.06,
      });
      exit.to(
        hundreds,
        { yPercent: -1 * STEP, duration: 0.7 * fast, ease: "expo.inOut" },
        0.12,
      );
      exit.to(
        bar.current,
        { scaleX: 1, duration: 0.5 * fast, ease: "power2.out" },
        0,
      );
      // Everything on the panel lifts out together.
      exit.to(
        el.querySelectorAll("[data-pl-out]"),
        {
          yPercent: -110,
          duration: 0.6 * fast,
          ease: "expo.in",
          stagger: 0.05,
        },
        // Rest on 100 for a breath before anything moves.
        "+=0.25",
      );
      // The paper wipes up; the accent band follows a beat behind it.
      exit.addLabel("wipe", "-=0.1");
      exit.to(
        el,
        {
          clipPath: "inset(0% 0% 100% 0%)",
          duration: reduced ? 0.25 : 1,
          ease: "expo.inOut",
        },
        "wipe",
      );
      exit.to(
        band,
        {
          clipPath: "inset(0% 0% 100% 0%)",
          duration: reduced ? 0.25 : 1,
          ease: "expo.inOut",
        },
        reduced ? "wipe" : "wipe+=0.12",
      );
      // The page comes in as the wipe passes the middle of the screen: the
      // particles start gathering and the headline starts to rise, so both
      // land just after the screen is clear.
      exit.add(
        () => {
          lockScroll(false);
          stage.intro();
          intro.reveal();
        },
        reduced ? ">" : "wipe+=0.45",
      );
    };

    // Leave once the count has run and the page is ready — whichever is
    // last. If the page is slow, the count simply rests on 99 until then.
    const id = window.setInterval(() => {
      if (counted() && ready()) leave();
    }, 50);
    const giveUp = window.setTimeout(leave, GIVE_UP * 1000);

    return () => {
      window.clearInterval(id);
      window.clearTimeout(giveUp);
      // A remount (development) starts the sequence over; don't leave a
      // half-played exit behind.
      if (exit) {
        exit.kill();
        el.style.display = "";
        band.style.display = "";
        el.style.clipPath = "inset(0% 0% 0% 0%)";
        band.style.clipPath = "inset(0% 0% 0% 0%)";
      }
    };
  }, []);

  return (
    <>
      {/* The band that chases the wipe. Same visibility rules as the panel. */}
      <div
        ref={curtain}
        aria-hidden="true"
        className="preloader bg-accent fixed inset-0 z-[89]"
        style={{ clipPath: "inset(0% 0% 0% 0%)" }}
      />
      <div
        ref={root}
        aria-hidden="true"
        className="preloader bg-paper text-ink fixed inset-0 z-[90] flex-col justify-between p-4 md:p-10"
        style={{ clipPath: "inset(0% 0% 0% 0%)" }}
      >
        <div className="label text-ink-muted flex justify-between">
          <span className="block overflow-clip">
            <span data-pl-out className="block">
              CJ — Portfolio 2026
            </span>
          </span>
          <span className="block overflow-clip">
            <span data-pl-out className="block">
              Full-stack developer
            </span>
          </span>
        </div>

        <div className="flex items-end justify-between gap-6">
          <span className="block overflow-clip">
            {/* `items-start`: a stretched reel would be one digit tall, and
                every percentage move would be measured against one digit
                instead of the whole reel. */}
            <span
              data-pl-out
              className="display flex h-[0.9em] items-start overflow-clip text-[clamp(5rem,22vw,20rem)] tabular-nums"
            >
              {["hundreds", "tens", "units"].map((name, i) => (
                <span
                  key={name}
                  ref={(el) => {
                    reels.current[i] = el;
                  }}
                  className={`pl-reel pl-reel-${name} flex flex-col will-change-transform`}
                >
                  {REEL.map((d, k) => (
                    <span key={k} className="block h-[0.9em] leading-[0.9]">
                      {d}
                    </span>
                  ))}
                </span>
              ))}
              <span className="text-accent ml-[0.06em] self-start text-[0.32em] leading-none">
                %
              </span>
            </span>
          </span>
          <div className="label text-ink-muted mb-[1.2em] hidden w-56 md:block">
            <span className="block overflow-clip">
              <span data-pl-out className="block">
                Loading the good stuff
              </span>
            </span>
            <span className="bg-ink-faint mt-3 block h-px w-full overflow-hidden">
              <span
                ref={bar}
                className="pl-bar bg-accent block h-full w-full origin-left"
              />
            </span>
          </div>
        </div>
        {/* After the reels, so they exist when it runs. */}
        <script dangerouslySetInnerHTML={{ __html: COUNT_SCRIPT }} />
      </div>
    </>
  );
}
