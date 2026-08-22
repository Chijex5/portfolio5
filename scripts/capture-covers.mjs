/**
 * Capture project covers from the live sites.
 *
 * Usage:  node scripts/capture-covers.mjs [slug ...]
 *         (no args = every project with a `url` below)
 *
 * Why headless Chrome and not a service: the covers have to be reproducible. A
 * screenshot pasted in by hand is a fact nobody can re-derive six months later
 * when a site gets a redesign; this script is the source of truth for what the
 * plates show, the same way scripts/make-covers.py is for the abstract stand-ins
 * it replaces.
 *
 * Why `playwright-core` + `channel: "chrome"`: the machine already has Chrome, so
 * there is no reason to download a second browser. playwright-core is the variant
 * that never fetches one — the driver only, about 3 MB.
 *
 * Capture geometry is 1200x825 CSS at deviceScaleFactor 2, which lands exactly
 * 2400x1650 native — 16:11, the aspect every consumer of these images already
 * declares (WorkRow, the case-study cover, the OG card). Capturing at the target
 * ratio means no crop and no resample on the way in.
 *
 * The PNG is handed to scripts/covers-derive.py, which writes the two WebP
 * derivatives the site actually loads. See that file for why there are two.
 */

import { chromium } from "playwright-core";
import { mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

/** 1200 x 825 CSS at dpr 2 = 2400 x 1650 native = 16:11 exactly. */
const VIEWPORT = { width: 1200, height: 825 };
const SCALE = 2;

const RAW_DIR = ".scratch/caps";

/**
 * Overlays that exist to interrupt a first-time visitor: cookie walls, welcome
 * toasts, chat bubbles, newsletter modals. They are correct on the live site and
 * wrong in a portfolio plate, where they read as chrome bolted onto the design.
 *
 * Split into two lists because the two need opposite treatment, and conflating
 * them is what let D'Footprint's welcome toast into the first four captures:
 *
 * HIDE_ALWAYS — notification *regions*. A live region or a known toast-library
 *   viewport is a notification container by definition, so there is no such thing
 *   as a false positive and no position check is wanted. That check is exactly
 *   what failed before: Sonner renders
 *       section[aria-live=polite]  (position: static, height 0)
 *         -> ol[z-index: 999999999] (position: fixed, no class, no role)
 *   so the semantic ancestor was skipped for being static, and the fixed child
 *   matched no selector at all.
 *
 *   These go in as a <style> tag rather than a querySelectorAll pass, which also
 *   fixes the second bug: the toast mounted ~5s after load, *after* the old JS
 *   pass had already run and reported "hid 0". CSS applies to nodes that do not
 *   exist yet, so late arrivals never get a chance to appear.
 */
const HIDE_ALWAYS = [
  "[role='alert']",
  "[role='status']",
  "[aria-live='polite']",
  "[aria-live='assertive']",
  // Named viewports from the usual toast libraries, in case one renders without
  // a live region.
  "[data-sonner-toaster]",
  "[data-radix-toast-viewport]",
  ".Toastify",
  "#nprogress",
];

/**
 * HIDE_IF_FIXED — name patterns. "cookie" or "toast" in a class name is a strong
 * hint but not proof: the same word turns up on in-flow page content. So these
 * are only hidden when the element is genuinely floating over the page, and never
 * when it spans the top edge (that is the site's own header, which belongs in the
 * shot).
 */
const HIDE_IF_FIXED = [
  "[class*='toast' i]",
  "[class*='cookie' i]",
  "[class*='consent' i]",
  "[class*='newsletter' i]",
  "[class*='chat-widget' i]",
  "[class*='intercom' i]",
  "[id*='cookie' i]",
  "[id*='consent' i]",
];

/**
 * One entry per project that has something to photograph.
 *
 * `jobless` is deliberately absent — it has no frontend yet, so it keeps the
 * generated abstract cover from scripts/make-covers.py. That is why that script
 * stays in the repo rather than being deleted once real imagery lands.
 */
const TARGETS = [
  {
    slug: "dfootprint",
    url: "https://dfootprint.me",
    /** The "Welcome to D'FOOTPRINT!" toast that pops in over the hero. */
    hide: [],
  },
  { slug: "wayframe", url: "https://wayframe.vercel.app" },
  { slug: "blog", url: "https://chijioke.app" },
  {
    slug: "precious-and-emmanuel",
    url: "https://emmanuel-precious.vercel.app",
  },
  { slug: "picpress", url: "https://benevolent-figolla-7f76d9.netlify.app" },
];

async function capture(browser, target) {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: SCALE,
    // Light scheme for every capture: the plates sit on warm paper, and a site
    // that happens to default to dark because *this machine* does would make the
    // set inconsistent for a reason that has nothing to do with the sites.
    colorScheme: "light",
    // A real UA string: some hosts serve a degraded page to unknown clients.
    userAgent:
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36",
    // Deterministic: a "3 hours ago" timestamp or a localised price that changes
    // per run would make every capture a spurious diff.
    locale: "en-US",
    timezoneId: "Africa/Lagos",
    // NOT reducedMotion: "reduce". It seems the safe choice, and it is wrong
    // here: a site whose hero animates from outline to filled honours the
    // preference by never filling, so the capture gets the *start* state of a
    // reveal that was meant to finish. Entrance animations are allowed to run,
    // and `animations: "disabled"` on the screenshot call below fast-forwards any
    // CSS animation still in flight to its end state.
  });

  // addInitScript, not addStyleTag: a style tag added before goto is discarded
  // with the document it was added to. This runs on every new document *before*
  // the page's own scripts, so the rule is in place before a toast can mount.
  await context.addInitScript((css) => {
    const apply = () => {
      const style = document.createElement("style");
      style.setAttribute("data-capture-hide", "");
      style.textContent = css;
      (document.head ?? document.documentElement).append(style);
    };
    if (document.head) apply();
    else document.addEventListener("DOMContentLoaded", apply, { once: true });
  }, `${HIDE_ALWAYS.join(",\n")} { display: none !important; }`);

  const page = await context.newPage();
  const problems = [];
  page.on("pageerror", (error) => problems.push(String(error).slice(0, 120)));

  try {
    await page.goto(target.url, { waitUntil: "load", timeout: 45_000 });

    // `networkidle` is best-effort: a page holding a socket open (analytics, a
    // live feed) never reaches it, and that must not fail the capture.
    await page
      .waitForLoadState("networkidle", { timeout: 12_000 })
      .catch(() => problems.push("networkidle timed out"));

    // Webfonts decide the whole look of a plate. Screenshotting before they swap
    // in captures the fallback face.
    await page
      .evaluate(() => document.fonts.ready)
      .catch(() => problems.push("document.fonts.ready failed"));

    // Entrance animations get to finish on their own — see the note on the
    // screenshot call for why they are not fast-forwarded.
    await page.waitForTimeout(2500);

    // The name-pattern pass runs *here*, last, not before the settle: the
    // D'Footprint toast mounted about five seconds in, so a pass that ran early
    // reported "hid 0" and the toast walked into the frame afterwards. The
    // HIDE_ALWAYS rules are already covered by CSS from addInitScript.
    const hidden = await page.evaluate((selectors) => {
      let count = 0;
      for (const selector of selectors) {
        let nodes;
        try {
          nodes = document.querySelectorAll(selector);
        } catch {
          continue; // a [attr i] form this engine will not parse
        }
        for (const node of nodes) {
          const style = getComputedStyle(node);
          // Only things floating over the page — a class name is a hint, not proof.
          if (style.position !== "fixed" && style.position !== "sticky") continue;
          // Never the site's own header.
          const rect = node.getBoundingClientRect();
          if (rect.top <= 4 && rect.width > innerWidth * 0.6) continue;
          node.style.setProperty("display", "none", "important");
          count++;
        }
      }
      return count;
    }, [...HIDE_IF_FIXED, ...(target.hide ?? [])]);

    // One frame for the hide to take effect in layout.
    await page.waitForTimeout(120);

    // animations: "allow" (the default), deliberately. `"disabled"` looks like
    // the right choice for a deterministic capture and is a trap: it fast-forwards
    // *finite* animations to completion, but **cancels infinite ones back to their
    // initial state** for the duration of the shot. D'Footprint's hero carries a
    // named animation (`dp-rise`), so "disabled" captured the pre-reveal outline
    // instead of the filled headline the site actually shows. The settle wait above
    // is what makes this deterministic: the hero is verifiably stable from ~1s
    // after networkidle through at least 12s.
    const buffer = await page.screenshot({ type: "png", animations: "allow" });
    const raw = path.join(RAW_DIR, `${target.slug}.png`);
    await writeFile(raw, buffer);

    const kb = Math.round(buffer.length / 1024);
    const note = problems.length ? `  [${problems.join("; ")}]` : "";
    console.log(`  ${target.slug.padEnd(24)} ok  ${kb} KB  hid ${hidden}${note}`);
    return raw;
  } catch (error) {
    console.error(`  ${target.slug.padEnd(24)} FAILED  ${error.message}`);
    return null;
  } finally {
    await context.close();
  }
}

const only = process.argv.slice(2);
const targets = only.length
  ? TARGETS.filter((t) => only.includes(t.slug))
  : TARGETS;

if (targets.length === 0) {
  console.error(
    `No matching targets. Known: ${TARGETS.map((t) => t.slug).join(", ")}`,
  );
  process.exit(1);
}

await mkdir(RAW_DIR, { recursive: true });

console.log(
  `Capturing ${targets.length} site(s) at ${VIEWPORT.width}x${VIEWPORT.height} @${SCALE}x -> ${VIEWPORT.width * SCALE}x${VIEWPORT.height * SCALE}\n`,
);

// The system Chrome, not a downloaded one.
const browser = await chromium.launch({ channel: "chrome" });
const captured = [];
try {
  for (const target of targets) {
    const raw = await capture(browser, target);
    if (raw) captured.push(target.slug);
  }
} finally {
  await browser.close();
}

if (captured.length === 0) {
  console.error("\nNothing captured — skipping derive step.");
  process.exit(1);
}

console.log(`\nDeriving WebP for: ${captured.join(", ")}`);
const derive = spawn("python3", ["scripts/covers-derive.py", ...captured], {
  stdio: "inherit",
});
derive.on("exit", (code) => process.exit(code ?? 0));
