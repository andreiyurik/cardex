# SYNTAX Score I — implementation spec (research notes)

Source-cited specification for replacing the placeholder SYNTAX
implementation (`src/lib/calculators/syntax.ts`) with the real
algorithm. Every number below traces to a fetched source; nothing is
guessed. Per project policy, all values still require sign-off by the
physician co-founder before `provenance.status` leaves `'draft'`.

**Primary source:** Sianos G, Morel MA, Kappetein AP, et al.
"The SYNTAX Score: an angiographic tool grading the complexity of
coronary artery disease." *EuroIntervention* 2005;1(2):219–227.
<https://eurointervention.pcronline.com/article/the-syntax-score-an-angiographic-tool-grading-the-complexity-of-coronary-artery-disease/pdf>
(The PDF 403s in browsers but downloads via `curl` with a normal
User-Agent. Tables 1–2 below are transcribed verbatim from it.)

Official tutorial/definitions: <https://syntaxscore.org>

## 1. Segment weights (Sianos 2005, Table 1) — per dominance

AHA classification modified for the ARTS study; 16 segments plus
subsegments. `n.a.` = segment does not exist in that dominance;
`0` = exists but zero weight. Co-dominance is NOT an option in SYNTAX.

| Seg | Name | Right dom. | Left dom. |
|-----|------|:---:|:---:|
| 1 | RCA proximal | 1 | 0 |
| 2 | RCA mid | 1 | 0 |
| 3 | RCA distal | 1 | 0 |
| 4 | Posterior descending (from RCA) | 1 | n.a. |
| 16 | Posterolateral branch from RCA | 0.5 | n.a. |
| 16a | Posterolateral branch from RCA, a | 0.5 | n.a. |
| 16b | Posterolateral branch from RCA, b | 0.5 | n.a. |
| 16c | Posterolateral branch from RCA, c | 0.5 | n.a. |
| 5 | Left main | 5 | 6 |
| 6 | LAD proximal | 3.5 | 3.5 |
| 7 | LAD mid | 2.5 | 2.5 |
| 8 | LAD apical | 1 | 1 |
| 9 | First diagonal | 1 | 1 |
| 9a | First diagonal a | 1 | 1 |
| 10 | Second diagonal | 0.5 | 0.5 |
| 10a | Second diagonal a | 0.5 | 0.5 |
| 11 | Proximal circumflex | 1.5 | 2.5 |
| 12 | Intermediate/anterolateral | 1 | 1 |
| 12a | Obtuse marginal a | 1 | 1 |
| 12b | Obtuse marginal b | 1 | 1 |
| 13 | Distal circumflex | 0.5 | 1.5 |
| 14 | Left posterolateral | 0.5 | 1 |
| 14a | Left posterolateral a | 0.5 | 1 |
| 14b | Left posterolateral b | 0.5 | 1 |
| 15 | Posterior descending (from LCx) | n.a. | 1 |

## 2. Lesion scoring mechanics (Sianos 2005)

- A lesion = diameter stenosis ≥50% in a vessel ≥1.5 mm (visual
  estimation). No exact-% input: a lesion is either "significant"
  (50–99%) or a total occlusion (100%, TIMI 0).
- A lesion may span multiple segments: sum the involved segments'
  weights, then multiply — **×2** for significant stenosis, **×5**
  for total occlusion. (Example from the paper: isolated significant
  LM lesion = 5 × 2 = 10.)
- Tandem lesions <3 reference vessel diameters apart = ONE lesion;
  >3 diameters apart = separate lesions. Max 12 lesions per patient.

## 3. Adverse-characteristic adders (Sianos 2005, Table 2)

| Characteristic | Points |
|---|---|
| TO: age >3 months or unknown | +1 |
| TO: blunt stump | +1 |
| TO: bridging collaterals | +1 |
| TO: first segment visible beyond TO | +1 **per non-visible segment** |
| TO: side branch <1.5 mm at occlusion | +1 |
| TO: side branches both <1.5 mm and ≥1.5 mm | +1 |
| Trifurcation: 1 diseased segment | +3 |
| Trifurcation: 2 diseased segments | +4 |
| Trifurcation: 3 diseased segments | +5 |
| Trifurcation: 4 diseased segments | +6 |
| Bifurcation: type A, B, C | +1 |
| Bifurcation: type D, E, F, G | +2 |
| Bifurcation: angulation <70° | +1 |
| Aorto-ostial stenosis | +1 |
| Severe tortuosity | +2 |
| Lesion length >20 mm | +1 |
| Heavy calcification | +2 |
| Thrombus | +1 |
| Diffuse disease / small vessels | +1 **per segment** |

Nuances (same sources):

- If ALL side branches at a total occlusion are ≥1.5 mm, no
  side-branch points — the lesion is scored as a bifurcation instead.
- Bifurcation types in the paper are the Duke/ICPS A–G system: A/B/C =
  side-branch ostium NOT involved (+1); D/E/F/G = ostium involved
  (+2). The current syntaxscore.org calculator uses Medina codes mapped
  to the same tiers — likely 1,0,0 / 0,1,0 / 1,1,0 → +1 and
  1,1,1 / 1,0,1 / 0,1,1 / 0,0,1 → +2. **Medina grouping is
  PLAUSIBLE-but-verify** (could not fetch the live page verbatim).
- Bifurcations scored only at junctions: 5/6/11, 6/7/9, 7/8/10,
  11/13/12a, 13/14/14a, 3/4/16, and 13/14/15 (left dominance).
- Trifurcations only at: 3/4/16/16a, 5/6/11/12, 11/12a/12b/13,
  6/7/9/9a, 7/8/10/10a.
- Aorto-ostial: within 3 mm of the aortic origin; applies to segments
  1 and 5 only (or 6/11 with a double ostium / absent LM).
- Diffuse disease/small vessels: ≥75% of the segment length distal to
  the lesion has diameter <2 mm; +1 per such segment.
- Severe tortuosity: ≥1 bend ≥90°, or ≥3 bends 45–90°, proximal to the
  diseased segment.

## 4. Interpretation tertiles — CONFIRMED

Low ≤22, intermediate 23–32, high ≥33.
Source: Serruys PW et al., "Assessment of the SYNTAX score in the
SYNTAX study," *EuroIntervention* 2009;5:50–56; cross-confirmed by the
EXCEL trial protocol (NCT01205776).

## 5. Existing calculators (UX survey)

- **syntaxscore.org (official):** sequential wizard, ~11 questions.
  Dominance + diffuse-disease asked once per patient; ~9 questions
  repeated per lesion (TO first — if yes, CTO sub-questions unlock;
  bifurcation questions auto-skip when side branches <1.5 mm). Summary
  page lists per-lesion scores with edit/delete. Max 12 lesions.
  Clunky: frameset-era UI, no visual coronary tree, tedious repetition
  for multi-lesion patients, junction rules implicit.
- **MDCalc:** does NOT have a full anatomical SYNTAX I calculator.
- **Appcardio, SYNTAX Score 2020 (web/app):** form-based; no clickable
  diagram either.
- Differentiator for Cardex: interactive tap-the-tree segment picker
  that auto-derives eligible bifurcation/trifurcation junctions and
  only asks applicable questions.

## 6. SYNTAX Score II (later)

Farooq V et al., *Lancet* 2013;381:639–650 adds clinical variables
(age, CrCl, LVEF, unprotected LM, PVD, female sex, COPD) to the
anatomical score to individualize PCI vs CABG (4-yr mortality);
SYNTAX II 2020 (*Lancet* 2020) re-derived on SYNTAXES 10-yr data.
Variable list is from secondary summaries — verify against the model
table in the paper before implementing.
