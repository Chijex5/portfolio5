import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import SmoothScrollProvider from "@/components/providers/SmoothScrollProvider";
import LiquidLens from "@/components/shared/LiquidLens";
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
      className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased`}
    >
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
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
