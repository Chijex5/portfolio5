# Portfolio Content — Full Copy

> Written in the voice of your previous portfolio (pulled from `sections.tsx` in `myportfolio`). Two blurbs below are reused near-verbatim from that site since they already worked (D'Footprint, Jobless/Scout); the other four are new, matched to the same tone: short, concrete, no adjectives doing the work a verb should do.

---

## Nav

- Logo: `Chijioke.` (period in accent color)
- Links: Work · About · Contact
- Status pill: "Available for work" (green blink dot)

---

## Hero

**Eyebrow row:** `Full-stack developer` — `Lagos (live clock) · Remote`

**Headline:**

> I build web
> products people
> actually _use._

**Subtext:**

> I'm **Chijioke** — a full-stack developer who designs the data model, builds the API, and sweats the interface. Below are some products I took from idea to shipped.

**CTA button:** "See the work" → `#work`

---

## Marquee (scrolling strip)

**Brands:** EchoStats · Wayframe · Jobless · D'Footprint · Blog · PicPress

**Stack line:** `REACT · NEXT.JS · REACT NATIVE · TYPESCRIPT · PYTHON · FASTAPI · POSTGRES · MONGODB`

---

## Work — Selected work (06)

### 01 — D'Footprint

- **Meta:** E-commerce · 2026
- **Blurb:** A storefront I built for my sister's handmade-footwear brand — customers browse the catalogue, order made-to-measure pairs, and track each one from the workshop bench to their doorstep.
- **Tags:** Next.js · Tailwind · Paystack · PostgreSQL

### 02 — Jobless

- **Meta:** Tooling · 2026
- **Blurb:** Scrapes listings across the web, scores each role against your skills and taste, then tracks every application from saved to signed.
- **Tags:** Python · AI validation · Scraper · MongoDB

### 03 — Wayframe

- **Meta:** AI tooling · 2026
- **Blurb:** Turns a plain-language description of a screen flow into an editable diagram, then checks it against a library of real app patterns and flags the screens you forgot to design.
- **Tags:** Next.js · TypeScript · LLM · React Flow

### 04 — Blog

- **Meta:** Publishing · 2026
- **Blurb:** A full personal publishing platform — admin dashboard, rich-text editor, and an email pipeline, built around one writer instead of an editorial team.
- **Tags:** Next.js · PostgreSQL · TipTap · Resend

### 05 — PicPress

- **Meta:** Utility · 2026
- **Blurb:** Compresses phone photos on the spot and stitches them into a lightweight PDF — no account, no upload wall, just a file you can send.
- **Tags:** React · Next.js · Client-side · PDF

### 06 — Precious & Emmanuel

- **Meta:** Client site · 2026
- **Blurb:** A wedding site with a real deadline — RSVP tracking, guest details, and a countdown built for two people who aren't developers.
- **Tags:** Next.js · Backend · RSVP system

---

## About

**Section label:** `(who)`

**Lede:**

> I like owning the whole picture — schema, API, and the interface on top.

**Body (two columns):**

> My work usually starts as a problem I actually have — a messy job hunt, a wedding site with a deadline, screens I forgot to design. I build the thing, then sand the edges until it's something I'd hand a friend without a disclaimer.

> On the front I reach for React, Next.js, React Native and TypeScript; behind it, Python and FastAPI over PostgreSQL and MongoDB. I care about performance, honest copy, and interfaces that get out of the way.

**Currently / Previously row:**

- Currently — EY Nigeria, Transfer pricing
- Statistics undergraduate — University of Nigeria, Nsukka

---

## Contact

**Label:** `Let's talk`

**Headline:**

> Got something
> worth building?

**Email link:** embroconnect3@gmail.com

**Footer:**

- Copyright: `© 2026 Chijioke Uzodinma`
- Socials: GitHub ↗ · LinkedIn ↗ · X ↗
  - github.com/chijex5
  - linkedin.com/in/chijioke-uzodinma-34389b267
  - x.com/chijex5

---

## Notes for the implementer

- The 6 work items map to `index: "01"`–`"06"` the same way the old `sections.tsx` did — alternate the image/copy side left↔right per project (odd = copy left, even = copy left too but frame reversed — see original file's `order-1`/`order-2` pattern) to keep the editorial rhythm.
- "Currently / Previously" in About is new — the old site only had a "Previously" row (Heizong Tech, Vzy internships). Swap those out for the EY Nigeria role since that's the current one; drop the old internships unless you want them listed further back in a longer timeline.
- Marquee brand list and Work section are now the same 6 projects, kept in sync — update both together if the project set changes again.
