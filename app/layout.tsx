import type { Metadata, Viewport } from "next";
import {
  Instrument_Serif,
  Inter_Tight,
  JetBrains_Mono,
} from "next/font/google";
import SmoothScrollProvider from "@/components/providers/SmoothScrollProvider";
import Cursor from "@/components/shell/Cursor";
import Hud from "@/components/shell/Hud";
import Preloader from "@/components/shell/Preloader";
import StageCanvas from "@/components/shell/StageCanvas";
import "./globals.css";

// The display face. The particle stage also sets "Say hello." in it, reading the
// family back from this variable (lib/stage/stage.ts), so keep the name in step.
const display = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-display-family",
  display: "swap",
});

// One italic word per chapter — the turn.
const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["italic"],
  variable: "--font-serif-family",
  display: "swap",
});

const mono = JetBrains_Mono({
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
  "Chijioke Uzodinma is a full-stack developer in Lagos. Every product he has built started as an annoyance — this is how they get untangled.";

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
  themeColor: "#0a0a0a",
  colorScheme: "dark",
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
            globals.css). Visitors without JS get the finished page. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.setAttribute("data-js","");try{history.scrollRestoration="manual"}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-dvh">
        <a
          href="#main"
          className="label bg-signal text-ink fixed top-2 left-2 z-[110] -translate-y-24 px-3 py-2 focus:translate-y-0"
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
