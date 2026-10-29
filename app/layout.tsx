import type { Metadata, Viewport } from "next";
import { Anybody, DM_Mono, Instrument_Serif } from "next/font/google";
import SmoothScrollProvider from "@/components/providers/SmoothScrollProvider";
import Cursor from "@/components/shell/Cursor";
import Hud from "@/components/shell/Hud";
import Preloader from "@/components/shell/Preloader";
import StageCanvas from "@/components/shell/StageCanvas";
import { THEME_SCRIPT } from "@/lib/theme";
import "./globals.css";

// The display face: one variable family whose width axis does the work — set
// condensed for headlines, let out wide for the turn word. The particle stage
// also sets "CJ" and "Say hello." in it, reading the family back from this
// variable (lib/stage/stage.ts), so keep the name in step.
const display = Anybody({
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
  axes: ["wdth"],
  variable: "--font-display-family",
  display: "swap",
});

// Only the wedding scene's invitation uses it — it is that product's face.
const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["italic"],
  variable: "--font-serif-family",
  display: "swap",
  preload: false,
});

const mono = DM_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-mono-family",
  display: "swap",
});

/**
 * Absolute base for metadata URLs. `VERCEL_PROJECT_PRODUCTION_URL` is set on
 * every Vercel deployment, previews included, so OG images and canonicals always
 * point at production; local dev falls back to localhost.
 */
const SITE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

const DESCRIPTION =
  "Chijioke Uzodinma (CJ) is a full-stack developer who designs the data model, builds the API, and sweats the interface — from cohort platforms to storefronts.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
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
    "TypeScript",
    "FastAPI",
    "Lagos",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Chijioke Uzodinma",
    title: "Chijioke Uzodinma — Full-stack developer",
    description: DESCRIPTION,
  },
  twitter: { card: "summary", creator: "@chijex5" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3eadb" },
    { media: "(prefers-color-scheme: dark)", color: "#12100e" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${serif.variable} ${mono.variable}`}
    >
      <head>
        {/* Before first paint: mark the document as scripted, which is what lets
            the preloader and the hero's pre-intro state exist at all (see
            globals.css), and apply the visitor's saved theme so it never
            flashes. Visitors without JS get the finished page, in light. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.setAttribute("data-js","");try{history.scrollRestoration="manual"}catch(e){}${THEME_SCRIPT}`,
          }}
        />
      </head>
      <body className="min-h-dvh">
        <a
          href="#main"
          className="label bg-accent text-paper fixed top-2 left-2 z-[110] -translate-y-24 px-3 py-2 focus:translate-y-0"
        >
          Skip to content
        </a>
        <SmoothScrollProvider>
          <StageCanvas />
          <Hud />
          {children}
          <div
            aria-hidden="true"
            className="grain pointer-events-none fixed inset-0 z-50"
          />
          <Cursor />
          <Preloader />
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
