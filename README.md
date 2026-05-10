# JILBER Performance Engineering

Premium car tuning and performance engineering landing page. Built with Next.js 16, React 19, TypeScript, and Tailwind CSS v4.

## Features

- **Scroll-driven canvas hero** — 241-frame JPEG sequence plays as you scroll, cover-scaled to any viewport
- **8 sections** — Hero, Services, Packages, Why JILBER, Build Showcase, Process, Contact, Footer
- **Fully responsive** — mobile-first layout with adaptive typography and CTAs
- **Contact form** — service selector, validation, and success state
- **Dark automotive aesthetic** — black/zinc palette with cyan accent, sharp typography

## Tech Stack

| Layer | Detail |
| --- | --- |
| Framework | Next.js 16.2.6 (App Router, Turbopack) |
| UI | React 19, TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Icons | lucide-react |
| Rendering | Static (SSG) |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scroll Frames

Place 241 JPEG frames at:

```text
public/scroll-frames/frame_0001.jpg
public/scroll-frames/frame_0002.jpg
...
public/scroll-frames/frame_0241.jpg
```

Recommended resolution: 1280×720. The canvas scales frames to cover the viewport at any aspect ratio.

## Scripts

```bash
npm run dev      # development server (Turbopack)
npm run build    # production build
npm run start    # serve production build
npm run lint     # ESLint
```

## Project Structure

```text
app/
  layout.tsx         # root layout + metadata
  page.tsx           # page composition
  globals.css        # base styles, scrollbar, keyframes
components/
  ScrollFrameHero    # canvas scroll animation + hero copy
  Navbar             # fixed nav with mobile menu
  ServicesSection    # service cards
  PackagesSection    # Stage 1 / 2 / 3 pricing cards
  WhyChooseUsSection # stats bar + reason grid
  GallerySection     # build showcase grid
  ProcessSection     # 6-step process + inline CTA
  ContactSection     # contact info + booking form
  Footer             # links, socials, certifications
  SectionHeader      # reusable heading component
public/
  scroll-frames/     # frame_0001.jpg … frame_0241.jpg
```
