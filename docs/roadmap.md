# Roadmap

## Phase 0 — Foundation ✓

- [x] Docs: architecture, ADRs, roadmap
- [x] Astro + Svelte 5 + Tailwind 4 + DaisyUI + Lucide + sitemap +
      Cloudflare adapter + Vitest
- [x] i18n routing ru/en, locale dictionaries, design tokens,
      SEO layout + schema.org helper, shared header/footer
- [x] `HeartViewer.svelte` stub (empty `<model-viewer>` wrapper, v2)

## Phase 1 — SYNTAX Score + calculator framework ✓ (pending clinical sign-off)

- [x] Calculator framework (`types.ts`): `CalculatorDefinition`,
      provenance, interpretation bands, input schema (units + ranges),
      golden cases, `registry`
- [x] Two tiers: generic `StandardCalculator` engine + signature islands
- [x] SYNTAX (signature): pure scoring + bands + provenance + golden cases
      + interactive coronary-tree island
- [x] Cockcroft–Gault creatinine clearance (standard tier) — reference
      implementation of the generic engine (units, select, validation)
- [x] Trust layer: server-rendered provenance + schema.org citations
- [x] Generic golden-case test harness
- [x] Registry-driven dynamic routes (adding a calculator = no new pages)
- [x] PWA / offline (manifest + service worker)
- [x] URL-encoded shareable state
- [ ] **Clinical verification by practicing physician** (see below)

## Phase 2 — Risk calculators (pre-deploy set)

Added (standard tier, pending physician sign-off):

- [x] CHA₂DS₂-VASc (stroke risk in AF) — canonical point table, golden
      cases `verified`; `draft` pending band-threshold wording sign-off.
- [x] HAS-BLED (bleeding on anticoagulation) — canonical point table,
      golden cases `verified`; `draft` pending sign-off.
- [x] Mehran (CI-AKI after PCI) — structure + mechanics; **weights are
      placeholders**, golden cases `placeholder`, `draft`.
- [x] GRACE (ACS mortality) — structure + mechanics; **point tables and
      band thresholds are placeholders**, golden cases `placeholder`,
      `draft`. Replace with the real GRACE / GRACE 2.0 mapping.

Still to add: PRECISE-DAPT / DAPT score, CRUSADE, eGFR (CKD-EPI 2021),
max contrast dose / contrast-to-clearance ratio, EuroSCORE II.

Each is a `CalculatorDefinition` (standard tier). Clinical constants enter
the codebase only from primary sources, verified by the physician
co-founder, with golden cases from published references.

## Launch readiness (pre-deploy polish)

- [x] Clinical review worksheet (`/review`, noindex) — per-calculator
      sources, thresholds, worked cases, placeholder flags, questions.
- [x] Honest per-calculator banners: "числа-заглушки" vs "на верификации"
      (data-driven from golden-case status).
- [x] Branding: Cardex favicon + social/OG image (`/og.png`, in `<head>`).
- [x] About + Disclaimer pages (ru/en) + contact (mailto) in footer.
- [x] Custom 404, print styles, CI (astro check + vitest + build).
- [ ] Set real production domain in `astro.config.mjs` `site`
      (affects canonical / sitemap / OG URLs).
- [ ] Set real contact email in `src/lib/site.ts` (`CONTACT_EMAIL`).
- [ ] Privacy-first analytics (e.g. Cloudflare Web Analytics token).
- [ ] Lighthouse pass (perf / a11y / SEO / best-practices).
- [ ] v1.1: refine the SYNTAX coronary diagram visual (signature showcase).

## Phase 3 — Report generator

- Structured PCI report/conclusion builder reusing calculator results
  (the pure `compute` layer already runs anywhere; URL state seeds it).
- Still frontend-only (print/PDF in browser) until persistence is needed.

## Phase 4 (v2) — Education & 3D

- 3D heart/coronary viewer as an **input surface** for signature
  calculators (rotate + tap segment). Interaction contract already
  decoupled from the 2D SVG; likely Threlte — dedicated ADR.
- Educational content, case library.
- Backend (accounts, saved reports) — only if traction demands.

---

## TODO(clinical) — items requiring physician verification

Every item is also marked in code with `TODO(clinical)`.

### SYNTAX Score
1. **Segment weights** (`syntax.ts` → `DEFAULT_SEGMENT_WEIGHTS`): all `1`
   placeholders. Fill Leaman-based per-segment weights for right/left
   dominance from the official definition.
2. **Lesion multipliers** (`DEFAULT_SCORING`): placeholder ×2 / ×5 —
   verify against the official algorithm.
3. **Adverse lesion characteristics** (bifurcation/trifurcation,
   aorto-ostial, tortuosity, length > 20 mm, calcification, thrombus,
   diffuse disease, CTO details): NOT modeled — decide which to include.
4. **Segment set completeness**: 16 core segments used; confirm
   subsegments (16a/b/c, 9a, 10a, 12a/b, 14a/b) and dominance rules.
5. **Interpretation thresholds/wording** (≤22 / 23–32 / ≥33): confirm the
   band summaries shown to users.
6. **Golden cases**: replace SYNTAX placeholder cases with real published
   reference scores once weights are verified.

### Creatinine clearance (Cockcroft–Gault)
7. **Formula transcription + band boundaries**: the formula is standard
   and published, but confirm the transcription and the CrCl band
   thresholds/wording before marking `physician-verified`.

### CHA₂DS₂-VASc
8. **OAC thresholds / band wording**: confirm the sex-dependent
   anticoagulation thresholds and band summaries; the point table itself
   is canonical.

### HAS-BLED
9. **Factor definitions + high-risk threshold**: confirm definitions
   (e.g. uncontrolled hypertension SBP > 160) and the ≥3 threshold; the
   one-point-per-factor table is canonical.

### Mehran (`mehran.ts` → `WEIGHTS`, `MEHRAN_BANDS`)
10. **Factor weights and band thresholds are PLACEHOLDERS**: verify the
    published weights (hypotension/IABP/CHF, age > 75, anemia, diabetes,
    renal categories, contrast per 100 mL) and risk bands; replace the
    `placeholder` golden cases with published reference cases.

### GRACE (`grace.ts` → point tables, `GRACE_BANDS`)
11. **Point tables and band thresholds are PLACEHOLDERS** (round numbers,
    not real GRACE values): transcribe the real GRACE / GRACE 2.0 mapping
    and thresholds from the primary source; replace the `placeholder`
    golden cases. Only the input structure and additive mechanics are real.

### General
12. **Disclaimer + band summary text** (ru/en): review medico-legal wording.
13. Set `provenance.reviewedBy` and flip `status` to `physician-verified`
    per calculator once the co-founder signs off.
