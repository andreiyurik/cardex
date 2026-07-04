# Architecture

## Overview

Cardex is a frontend-first static site. Every page is prerendered by Astro
(SSG) for SEO and instant load; interactivity is added only where needed
via Svelte islands. There is no backend: all clinical calculations run in
the browser, which also means no patient data ever leaves the device — a
useful privacy property for a medical tool.

## Layers

```
┌─────────────────────────────────────────────────────────┐
│ Astro pages (static, SEO)                               │
│   src/pages/**  — ru at root, en under /en/             │
│   BaseLayout → Seo.astro (meta + schema.org JSON-LD)    │
├─────────────────────────────────────────────────────────┤
│ Svelte islands (interactivity only)                     │
│   src/components/islands/**                             │
│   render UI, hold $state, call calculator functions     │
├─────────────────────────────────────────────────────────┤
│ Clinical logic (single source of truth)                 │
│   src/lib/calculators/** — pure typed TS functions      │
│   fully covered by Vitest                               │
└─────────────────────────────────────────────────────────┘
```

Dependencies point strictly downward. The clinical layer imports nothing
from the UI layers, so it can later be reused by server functions, a
report generator, or a mobile shell without changes.

## Data flow: island → calculation → result

1. The user interacts with an island (e.g. taps a coronary segment in the
   SYNTAX SVG tree). The island updates its `$state` input model.
2. A `$derived` value calls the pure function from
   `src/lib/calculators/` with that input.
3. The function returns a typed result: numeric score + interpretation
   (category, thresholds, human-readable message key).
4. The island renders the result. UI strings come from `src/i18n/`
   dictionaries via the message key — the clinical layer returns keys and
   numbers, never localized prose.

## Calculator pattern (the SYNTAX vertical slice is the reference)

Each calculator consists of exactly three parts:

| Part | Location | Responsibility |
|---|---|---|
| Pure function + tests | `src/lib/calculators/<name>.ts` + `<name>.test.ts` | formulas, thresholds, interpretation; 100% deterministic, no DOM, no i18n |
| Static page (×2 locales) | `src/pages/calculators/<name>.astro`, `src/pages/en/calculators/<name>.astro` | SEO: unique title/description/OG, schema.org `MedicalRiskCalculator`, indexable explanatory content |
| Svelte island | `src/components/islands/<Name>Calculator.svelte` | interactive input UI; imports and calls the pure function |

Rules:

- Islands never contain formulas, thresholds or clinical constants.
- Clinical constants not yet verified by a physician are marked
  `TODO(clinical): verify with practicing physician` and tracked in
  `docs/roadmap.md`.
- Calculation functions accept an optional override of coefficient tables
  (dependency injection) so tests can verify the *mechanics* (summation,
  multipliers, boundaries) independently of the clinical values.

## i18n

Astro built-in i18n routing: `ru` is the default locale served at `/`,
`en` under `/en/`. Dictionaries live in `src/i18n/{ru,en}.ts` behind a
typed `useTranslations(locale)` helper. Components receive a locale from
the page; no UI string is hardcoded.

## Design tokens

All tokens live in `src/styles/global.css`:

- Tailwind 4 `@theme` block — fonts, spacing, radii.
- A custom DaisyUI theme (`cardex`, dark) — the full color palette with a
  single accent color.

Both Astro components and Svelte islands use only Tailwind/DaisyUI
classes, so the token layer is automatically shared.

## SEO

- `Seo.astro` — one reusable component: title, description, canonical,
  OG/Twitter tags, `hreflang` alternates, JSON-LD slot.
- `src/lib/seo/schema.ts` — builders for `MedicalWebPage` /
  `MedicalRiskCalculator` JSON-LD.
- `@astrojs/sitemap` + `public/robots.txt`.
- Semantic HTML on static pages; JS is shipped only for islands.

## Future (v2, not built now)

- 3D heart/coronary viewer: `HeartViewer.svelte` exists as an empty
  `<model-viewer>` wrapper stub. Model assets and interaction come in v2.
- Backend (accounts, saved reports, PDF generation): added as Astro
  server endpoints on Cloudflare when needed — the adapter is already in
  place, so this is an incremental change, not a migration.
