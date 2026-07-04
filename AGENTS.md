# Cardex — clinical calculators for interventional cardiology

Web app with visual, interactive clinical calculators for interventional
cardiologists (Russian market first, extensible to other specialties).
Frontend-first: all computation runs in the browser; no backend at MVP stage.

## Stack

- **Astro** (SSG + islands) — content/landing pages are static for SEO.
  No SSR/endpoints for now; add later only when actually needed.
- **Svelte 5 + TypeScript** (`@astrojs/svelte`) — islands ONLY for
  interactive widgets (calculators, future 3D viewer). Use runes
  (`$state`, `$derived`).
- **Tailwind CSS 4 + DaisyUI 5** — single visual layer. Tailwind is wired
  via the official `@tailwindcss/vite` plugin (not the deprecated
  `@astrojs/tailwind` integration). **Lucide** for icons.
- **Cloudflare Pages** (`@astrojs/cloudflare`) — deploy target.
- **Vitest** — tests (`npm test`).
- **i18n** — Astro built-in i18n routing: `ru` (default, unprefixed) +
  `en` (under `/en/`). All UI text goes through locale dictionaries in
  `src/i18n/` — never hardcode UI strings in components.

## Language conventions

- Code, identifiers, comments, docs — **English**.
- Product UI and content — **Russian** (primary), English secondary.

## Architecture principles

- ALL clinical logic (formulas, thresholds, interpretations) lives in
  `src/lib/calculators/` as pure, typed, fully Vitest-covered functions.
  This is the single source of truth. Islands only render UI and call
  these functions — they NEVER duplicate formulas in markup.
- **A calculator is a typed data object** (`CalculatorDefinition` in
  `src/lib/calculators/types.ts`): pure `compute`, interpretation `bands`,
  `provenance`, optional declarative `inputs` (with units + ranges), and
  `goldenCases`. Register it in `registry.ts`; pages, the home catalog,
  the sitemap and tests derive from it. Adding a calculator needs **no new
  page files** (one dynamic route per locale enumerates the registry).
- **Two tiers.** Standard calculators are form-driven and rendered by ONE
  generic engine (`StandardCalculator.svelte`) — reference:
  Cockcroft–Gault. Signature calculators get a bespoke island — reference:
  SYNTAX (`SyntaxCalculator.svelte`). `CalculatorHost.astro` dispatches.
  Put design effort into signature islands; keep standard ones data-only.
- **Trust layer is first-class.** `Provenance` (source citations + DOI,
  formula `version`, `status` draft/physician-verified, `reviewedBy`) is
  rendered server-side (`Provenance.astro`) and emitted to schema.org.
  `GoldenCase[]` (published reference results) run in a generic test
  harness (`golden.test.ts`) and are the physician sign-off artifact.
  Units/ranges live in the input schema; the engine validates and converts.
- Design tokens (colors, typography, spacing) are defined once in
  `src/styles/global.css` (Tailwind `@theme` + DaisyUI theme) and shared
  by all pages and islands. `severity.ts` maps clinical severity → token
  classes. Dark, clean, premium clinical aesthetic; a single accent color.
- Clinical coefficients not verified by a practicing physician MUST be
  marked `TODO(clinical): verify with practicing physician`, listed in
  `docs/roadmap.md`, and kept `provenance.status: 'draft'`. Never invent
  medical numbers.
- Frontend-only guarantees: calculations run in the browser (no patient
  data leaves the device); state is mirrored to the URL (shareable); a
  service worker (`public/sw.js`) makes the site work offline.

## SEO

- Every calculator gets its own static URL with unique
  title/description/OG via the shared `Seo.astro` component.
- schema.org (`MedicalWebPage` / `MedicalRiskCalculator`) JSON-LD via
  `src/lib/seo/schema.ts`.
- `@astrojs/sitemap`, `public/robots.txt`, semantic HTML, minimal JS.

## Project structure

- `src/lib/calculators/` — clinical logic + framework
  - `types.ts` — `CalculatorDefinition`, provenance, bands, input schema,
    golden cases, `bandFor`
  - `<name>.ts` — one calculator (pure compute + definition + golden cases)
  - `registry.ts` — the list everything derives from
  - `*.test.ts` — per-calculator tests + generic `golden.test.ts` harness
- `src/lib/seo/` — schema.org helpers (citations, version, lastReviewed)
- `src/i18n/` — locale dictionaries and helpers (`ru` canonical, `en` typed)
- `src/components/islands/` — Svelte islands (`StandardCalculator` generic
  engine, signature islands like `SyntaxCalculator`, `severity.ts`,
  `url-state.ts`)
- `src/components/` — Astro components (Seo, Provenance, CalculatorHost,
  HomeContent, header, footer)
- `src/layouts/` — BaseLayout (shell + SEO + PWA + header/footer)
- `src/pages/` — ru at root, en under `en/`; calculators via the
  registry-driven `calculators/[slug].astro` route
- `public/` — `manifest.webmanifest`, `sw.js`, `robots.txt`
- `docs/` — architecture, ADRs, roadmap

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

Run tests with `npm test` (Vitest). Build with `npm run build`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

Project docs: `docs/architecture.md`, `docs/decisions.md`, `docs/roadmap.md`.
