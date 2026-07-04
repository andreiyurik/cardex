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

## Phase 2 — Risk calculators

- GRACE 2.0 (ACS risk)
- Mehran (contrast-induced nephropathy)
- PRECISE-DAPT (bleeding on DAPT)

Each is added as a `CalculatorDefinition` (mostly standard tier). Clinical
constants enter the codebase only from primary sources, verified by the
physician co-founder, with golden cases from published references.

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

### General
8. **Disclaimer + band summary text** (ru/en): review medico-legal wording.
9. Set `provenance.reviewedBy` and flip `status` to `physician-verified`
   per calculator once the co-founder signs off.
