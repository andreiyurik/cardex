/**
 * Mehran score — risk of contrast-induced acute kidney injury (CI-AKI)
 * after PCI. Standard-tier, weighted additive score.
 *
 * ─────────────────────────────────────────────────────────────────────
 * TODO(clinical): verify with practicing physician.
 * The factor WEIGHTS below (hypotension/IABP/CHF = 5, age > 75 = 4,
 * anemia/diabetes = 3, renal categories, 1 point per 100 mL contrast) and
 * the risk-band thresholds follow the published Mehran structure but MUST
 * be confirmed against the primary source before clinical use. The
 * mechanics (additive summation, banding) are implemented and tested;
 * golden cases are 'placeholder' (regression only). provenance.status is
 * 'draft'. See docs/roadmap.md.
 * ─────────────────────────────────────────────────────────────────────
 */
import {
  bandFor,
  type CalcResult,
  type CalculatorDefinition,
  type Contribution,
  type InputField,
  type InterpretationBand,
  type Provenance,
  type StandardInput,
} from './types';

export type MehranRenal = 'none' | 'egfr40-60' | 'egfr20-40' | 'egfr<20';

export interface MehranInput extends StandardInput {
  hypotension: boolean;
  iabp: boolean;
  chf: boolean;
  ageOver75: boolean;
  anemia: boolean;
  diabetes: boolean;
  renal: MehranRenal;
  contrastVolume: number; // mL
}

/** TODO(clinical): verify weights. */
const WEIGHTS = {
  hypotension: 5,
  iabp: 5,
  chf: 5,
  ageOver75: 4,
  anemia: 3,
  diabetes: 3,
  renal: { none: 0, 'egfr40-60': 2, 'egfr20-40': 4, 'egfr<20': 6 } as Record<MehranRenal, number>,
  contrastPer100ml: 1,
};

export const MEHRAN_BANDS: InterpretationBand[] = [
  { id: 'low', severity: 'low', min: 0, max: 5, labelKey: 'low.label', summaryKey: 'low.summary' },
  { id: 'moderate', severity: 'moderate', min: 6, max: 10, labelKey: 'moderate.label', summaryKey: 'moderate.summary' },
  { id: 'high', severity: 'high', min: 11, max: 15, labelKey: 'high.label', summaryKey: 'high.summary' },
  { id: 'veryHigh', severity: 'very-high', min: 16, max: null, labelKey: 'veryHigh.label', summaryKey: 'veryHigh.summary' },
];

export const MEHRAN_PROVENANCE: Provenance = {
  status: 'draft',
  sources: [
    {
      title:
        'A simple risk score for prediction of contrast-induced nephropathy after percutaneous coronary intervention',
      authors: 'Mehran R, et al.',
      journal: 'J Am Coll Cardiol',
      year: 2004,
      doi: '10.1016/j.jacc.2004.06.068',
    },
  ],
  notesKey: 'notes',
};

export const MEHRAN_INPUTS: InputField[] = [
  { kind: 'boolean', id: 'hypotension', labelKey: 'hypotension' },
  { kind: 'boolean', id: 'iabp', labelKey: 'iabp' },
  { kind: 'boolean', id: 'chf', labelKey: 'chf' },
  { kind: 'boolean', id: 'ageOver75', labelKey: 'ageOver75' },
  { kind: 'boolean', id: 'anemia', labelKey: 'anemia' },
  { kind: 'boolean', id: 'diabetes', labelKey: 'diabetes' },
  {
    kind: 'select',
    id: 'renal',
    labelKey: 'renal',
    required: true,
    options: [
      { id: 'none', labelKey: 'none' },
      { id: 'egfr40-60', labelKey: 'egfr40-60' },
      { id: 'egfr20-40', labelKey: 'egfr20-40' },
      { id: 'egfr<20', labelKey: 'egfr<20' },
    ],
  },
  { kind: 'number', id: 'contrastVolume', labelKey: 'contrastVolume', min: 0, max: 1000, step: 10, required: true },
];

export function computeMehran(input: MehranInput): CalcResult {
  const contributions: Contribution[] = [];
  let score = 0;
  const add = (labelKey: string, value: number, detail?: string) => {
    if (value > 0) {
      score += value;
      contributions.push({ labelKey, value, ...(detail ? { detail } : {}) });
    }
  };

  add('hypotension', input.hypotension ? WEIGHTS.hypotension : 0);
  add('iabp', input.iabp ? WEIGHTS.iabp : 0);
  add('chf', input.chf ? WEIGHTS.chf : 0);
  add('ageOver75', input.ageOver75 ? WEIGHTS.ageOver75 : 0);
  add('anemia', input.anemia ? WEIGHTS.anemia : 0);
  add('diabetes', input.diabetes ? WEIGHTS.diabetes : 0);
  add('renal', WEIGHTS.renal[input.renal] ?? 0);

  const volume = Number(input.contrastVolume) || 0;
  const contrastPts = Math.round(volume / 100) * WEIGHTS.contrastPer100ml;
  add('contrastVolume', contrastPts, String(volume));

  const band = bandFor(score, MEHRAN_BANDS);
  return { score, bandId: band.id, contributions };
}

export const mehranDefinition: CalculatorDefinition<MehranInput, CalcResult> = {
  slug: 'mehran',
  version: '0.1.0-draft',
  tier: 'standard',
  i18nKey: 'mehran',
  estimatesRiskOf: 'Contrast-induced acute kidney injury',
  bands: MEHRAN_BANDS,
  provenance: MEHRAN_PROVENANCE,
  inputs: MEHRAN_INPUTS,
  defaultInput: {
    hypotension: false,
    iabp: false,
    chf: false,
    ageOver75: false,
    anemia: false,
    diabetes: false,
    renal: 'none',
    contrastVolume: 150,
  },
  compute: computeMehran,
  goldenCases: [
    {
      id: 'minimal',
      input: { hypotension: false, iabp: false, chf: false, ageOver75: false, anemia: false, diabetes: false, renal: 'none', contrastVolume: 0 },
      expectedScore: 0,
      expectedBandId: 'low',
      status: 'placeholder',
      source: 'mechanics regression (weights pending verification)',
    },
    {
      id: 'moderate-example',
      input: { hypotension: false, iabp: false, chf: true, ageOver75: false, anemia: false, diabetes: true, renal: 'none', contrastVolume: 200 },
      expectedScore: 10, // 5 (chf) + 3 (diabetes) + 2 (200 mL)
      expectedBandId: 'moderate',
      status: 'placeholder',
      source: 'mechanics regression (weights pending verification)',
    },
    {
      id: 'high-example',
      input: { hypotension: true, iabp: false, chf: false, ageOver75: false, anemia: true, diabetes: true, renal: 'none', contrastVolume: 400 },
      expectedScore: 15, // 5 + 3 + 3 + 4 (400 mL)
      expectedBandId: 'high',
      status: 'placeholder',
      source: 'mechanics regression (weights pending verification)',
    },
  ],
};
