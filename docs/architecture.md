# Architecture

## Overview

Cardex is a frontend-first static site. Every page is prerendered by Astro
(SSG) for SEO and instant load; interactivity is added only where needed
via Svelte islands. There is no backend: all clinical calculations run in
the browser, which also means no patient data ever leaves the device — a
useful privacy property for a medical tool. A service worker makes the
whole site work offline after the first visit.

## Layers

```
┌─────────────────────────────────────────────────────────┐
│ Astro pages (static, SEO)                               │
│   src/pages/**  — ru at root, en under /en/             │
│   registry-driven dynamic route: calculators/[slug]     │
│   BaseLayout → Seo.astro (meta + schema.org JSON-LD)    │
│   Provenance.astro (citations + verification, static)   │
├─────────────────────────────────────────────────────────┤
│ Svelte islands (interactivity only)                     │
│   StandardCalculator.svelte — generic form engine        │
│   SyntaxCalculator.svelte   — signature (coronary tree)  │
├─────────────────────────────────────────────────────────┤
│ Calculator framework (single source of truth)           │
│   src/lib/calculators/types.ts  — definition + contracts │
│   <name>.ts  — pure compute + bands + provenance + golden │
│   registry.ts — the list everything derives from         │
│   fully covered by Vitest (+ generic golden-case harness)│
└─────────────────────────────────────────────────────────┘
```

Dependencies point strictly downward. The clinical layer imports nothing
from the UI layers, so it can later be reused by server functions, a
report generator, or a mobile shell without changes.

## A calculator is data: `CalculatorDefinition`

Each calculator is a single typed object (`src/lib/calculators/types.ts`)
from which pages, SEO, forms, the sitemap and tests are derived. Adding a
calculator is one file + one registry entry; it needs **no new page
files** (the dynamic route enumerates the registry).

```ts
interface CalculatorDefinition<TInput, TResult> {
  slug: string;
  version: string;                 // bump when clinical constants change
  tier: 'standard' | 'signature';
  i18nKey: string;                 // dictionaries[locale].calculators[i18nKey]
  estimatesRiskOf: string;         // schema.org
  bands: InterpretationBand[];     // score → clinical category
  provenance: Provenance;          // sources, DOI, physician sign-off, status
  inputs?: InputField[];           // standard tier: fields + units + ranges
  defaultInput: TInput;
  compute: (input: TInput) => TResult;   // the pure clinical function
  goldenCases: GoldenCase<TInput>[];     // verification = regression tests
}
```

### Two tiers

- **Standard tier** — form-driven. The declarative `inputs` schema (field
  types, units with conversions, physiologic ranges) is rendered by ONE
  generic engine, `StandardCalculator.svelte`. No bespoke UI per
  calculator. Reference implementation: Cockcroft–Gault creatinine
  clearance. This is where most calculators live — cheap to add, no UI
  drift.
- **Signature tier** — bespoke island for calculators whose value is
  visual/spatial (and, later, 3D). Reference implementation: SYNTAX with
  its interactive coronary-tree SVG. This is where design effort is
  concentrated to differentiate the product.

`CalculatorHost.astro` dispatches: signature calculators by slug, all
standard calculators to the generic engine.

## Trust layer (what makes it a medical product)

A medical calculator is only as good as the trust it earns. Three things
are first-class, not afterthoughts:

- **Provenance** (`Provenance`): every calculator carries its source
  citations (with DOI), a formula `version`, and a `status` of `draft`
  vs `physician-verified` plus an optional `reviewedBy` sign-off. Rendered
  server-side by `Provenance.astro` (visible to search engines and to
  users without JS) and emitted into schema.org `citation`.
- **Golden cases** (`GoldenCase[]`): published reference results attached
  to the definition. A generic harness (`golden.test.ts`) runs every
  calculator's cases through its own `compute()`. `verified` cases are the
  physician's checkable sign-off artifact; `placeholder` cases guard
  mechanics until clinical constants are verified.
- **Input safety**: units and physiologic ranges live in the input schema.
  The engine converts to canonical units and refuses to show a result for
  out-of-range or missing required values.

Unverified clinical constants stay marked `TODO(clinical): verify with
practicing physician` and are tracked in `docs/roadmap.md`.

## Data flow: island → calculation → result

1. The user interacts with an island (fills a field, or taps a coronary
   segment). The island updates its `$state`.
2. A `$derived` value converts inputs to canonical units and calls the
   pure `compute()` from the definition.
3. `compute()` returns a typed `CalcResult`: `score`, matched `bandId`,
   an "explain" breakdown (`contributions` or a substituted `formula`),
   and an optional `unitKey`.
4. The island renders the result; `bandFor()` maps the score to a clinical
   band, whose `severity` drives color. UI strings come from `src/i18n/`
   — the clinical layer returns keys and numbers, never localized prose.
5. Input state is mirrored to the URL query string, so a filled
   calculation is shareable/bookmarkable with no backend.

## i18n

Astro built-in i18n routing: `ru` default at `/`, `en` under `/en/`.
Typed dictionaries in `src/i18n/{ru,en}.ts` behind `useTranslations`.
`ru.ts` is the canonical shape (`as const`); `en.ts` is type-checked
against a widened version of it. Shared calculator UI lives under `calc`,
unit labels under `units`, and per-calculator strings under
`calculators[i18nKey]`. Calculator pages are generated by a single
dynamic route per locale — adding a calculator adds zero page files.

## Offline (PWA)

`public/manifest.webmanifest` + `public/sw.js`. The service worker uses
cache-first for hashed `/_astro/*` assets and network-first (cache
fallback) for navigations, with the cached home page as the last-resort
offline fallback. Registered from `BaseLayout` in production only (skipped
on localhost to avoid stale dev caches). No precache manifest — the cache
fills as pages are visited, so it survives content updates. This makes
Cardex usable at the bedside / in a cath lab with no signal.

## Design tokens

All tokens live in `src/styles/global.css` (Tailwind 4 `@theme` + a custom
dark DaisyUI theme `cardex`, single accent color). Both Astro components
and Svelte islands use only Tailwind/DaisyUI classes, so the token layer
is shared by construction. `severity.ts` maps clinical severity to token
classes so risk coloring is consistent across islands.

## SEO

- `Seo.astro` — title/description, canonical, OG/Twitter, `hreflang`
  alternates, JSON-LD slot.
- `src/lib/seo/schema.ts` — `MedicalWebPage` / `MedicalRiskCalculator`
  builders; the latter emits `citation` (from provenance), `version` and
  `lastReviewed`.
- `@astrojs/sitemap` + `public/robots.txt`, semantic HTML, minimal JS.

## Future (v2, not built now)

- 3D heart/coronary viewer as an input surface for signature calculators.
  `HeartViewer.svelte` stub reserves the slot; the interaction contract
  (selected segments) is already independent of whether the tap comes from
  the 2D SVG or a future 3D mesh. Likely Threlte (Three.js for Svelte) —
  decide in a dedicated ADR.
- Backend (accounts, saved reports, PDF generation): Astro server
  endpoints on Cloudflare when needed — the adapter is already in place.
