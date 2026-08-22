import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import Preloader from "@/components/intro/Preloader";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import SmoothScrollProvider from "@/components/providers/SmoothScrollProvider";
import LiquidLens from "@/components/shared/LiquidLens";
import { INTRO } from "@/lib/tokens";
import "./globals.css";

// Fraunces is the kinetic typeface, so it needs more than the weight axis. Google
// serves only `wght` by default; the extra three are opt-in per axis, and without
// them `font-variation-settings: "opsz" …` in `.kinetic` would silently do nothing.
//   SOFT 0–100  roundness of the terminals
//   WONK 0–1    swaps in the alternate, wonkier italic-ish forms
//   opsz 9–144  optical size: low is spindly and fine, high is fat and contrasty
// Ranges mirror AXES in lib/tokens.ts, which is what clamps the tween values.
const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const DESCRIPTION =
  "Chijioke Uzodinma is a full-stack developer in Lagos building web and mobile products with React, Next.js, TypeScript and FastAPI — from schema to interface.";

export const metadata: Metadata = {
  title: {
    default: "Chijioke Uzodinma — Full-stack developer",
    template: "%s — Chijioke Uzodinma",
  },
  description: DESCRIPTION,
  applicationName: "Chijioke Uzodinma",
  authors: [{ name: "Chijioke Uzodinma" }],
  creator: "Chijioke Uzodinma",
  keywords: [
    "full-stack developer",
    "React",
    "Next.js",
    "React Native",
    "TypeScript",
    "FastAPI",
    "Lagos",
  ],
  // No OG image yet — the social card is part of the SEO/perf pass (M11), and a
  // `twitter.card` of summary_large_image without one renders worse than summary.
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Chijioke Uzodinma",
    title: "Chijioke Uzodinma — Full-stack developer",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary",
    creator: "@chijex5",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased`}
    >
      <head>
        {/* Three things that have to be settled *before first paint*, which is
            what makes this a blocking inline script rather than an effect —
            anything that runs after hydration is by definition too late.

            1. `data-js` marks the document as scripted, which is what lets the
               hero hold its pre-intro state in CSS (see globals.css). Without it
               the hero had no intro at all from a visitor's point of view: the
               server HTML painted the finished hero, then hydration ran, then
               `gsap.from` snapped everything back to hidden and played the
               reveal into a screen the user had already seen. Keyed off `data-js`
               rather than a bare rule so the pre-intro state only ever applies
               where there is JavaScript to undo it — no-JS visitors get the
               finished hero immediately, which is also what they should get.

            2. `data-intro-seen` is the once-per-tab flag. Read here rather than
               in the component because it decides whether the preloader is
               painted at all, and deciding that in React would either flash the
               preloader or desync hydration.

            3. The failsafe. Both of the above hide content on the promise that
               JavaScript will show it again; this timer is what keeps that
               promise when JavaScript never arrives. It is deliberately the
               crudest possible mechanism, because it has to survive the failure
               of everything more sophisticated. Cleared by the reveal
               (lib/intro.ts); the CSS it triggers is in globals.css.

            Only armed on a visit that will actually play the intro — on a repeat
            visit there is nothing hidden to recover, and `scrollRestoration`
            must stay automatic so a mid-page reload still lands where it left
            off. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              `var d=document.documentElement;d.setAttribute("data-js","");` +
              `var s=false;try{s=sessionStorage.getItem("intro-played")==="1"}catch(e){}` +
              `if(s){d.setAttribute("data-intro-seen","")}else{` +
              `try{history.scrollRestoration="manual"}catch(e){}` +
              `window.__introFailsafe=setTimeout(function(){` +
              `d.setAttribute("data-intro-failed","")},${INTRO.failsafe * 1000})}`,
          }}
        />
      </head>
      <body className="font-body min-h-dvh">
        <SmoothScrollProvider>
          <Header />
          {children}
          <Footer />

          {/* The surface passes, over the whole document.

              The lens sits below the header (z-30 vs z-40) so it glides *under*
              the nav rather than washing over it, and the grain sits above both
              at z-50 — grain that the header escaped would make the header look
              like it was floating off the page instead of printed on it.

              Both are pointer-events-none and aria-hidden: nothing here is
              interactive and nothing here is content. */}
          <LiquidLens />
          <div
            aria-hidden="true"
            className="grain pointer-events-none fixed inset-0 z-50"
          />

          {/* The opening, over everything at z-70.

              Here rather than in the hero for two reasons. Its HTML is in the
              initial payload, so it paints before hydration — there is nothing
              to cover the load with if it arrives after it. And `root` on
              ReactLenis means children get no wrapper element, so this is a
              direct child of <body>: no transformed ancestor, and therefore no
              containing block that could clip a full-bleed fixed panel. Inside
              the hero it sat under `[data-elastic]`, which takes a transform on
              the first frame of scroll velocity and did exactly that. */}
          <Preloader />
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
