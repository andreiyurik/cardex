/**
 * CHA₂DS₂-VASc — stroke risk in non-valvular atrial fibrillation.
 * Standard-tier, additive point score.
 *
 * The point values (age ≥75 = 2, prior stroke/TIA/TE = 2, everything else
 * = 1) are the canonical, unambiguous definition of the score. Golden
 * cases are deterministic from this table. provenance.status stays 'draft'
 * until the physician co-founder confirms band wording / OAC thresholds.
 *
 * TODO(clinical): confirm the sex-dependent OAC thresholds (men ≥1 / ≥2,
 * women ≥2 / ≥3) shown in band summaries with a practicing physician.
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

export interface Cha2ds2VascInput extends StandardInput {
  age: number;
  sex: 'male' | 'female';
  chf: boolean;
  hypertension: boolean;
  diabetes: boolean;
  stroke: boolean; // stroke / TIA / thromboembolism
  vascular: boolean;
}

export const CHA2DS2VASC_BANDS: InterpretationBand[] = [
  { id: 'low', severity: 'low', min: 0, max: 0, labelKey: 'low.label', summaryKey: 'low.summary' },
  { id: 'intermediate', severity: 'moderate', min: 1, max: 1, labelKey: 'intermediate.label', summaryKey: 'intermediate.summary' },
  { id: 'high', severity: 'high', min: 2, max: null, labelKey: 'high.label', summaryKey: 'high.summary' },
];

export const CHA2DS2VASC_PROVENANCE: Provenance = {
  status: 'draft',
  sources: [
    {
      title:
        'Refining clinical risk stratification for predicting stroke and thromboembolism in atrial fibrillation using a novel risk factor-based approach (CHA₂DS₂-VASc)',
      authors: 'Lip GYH, et al.',
      journal: 'Chest',
      year: 2010,
      doi: '10.1378/chest.09-1584',
    },
  ],
};

export const CHA2DS2VASC_INPUTS: InputField[] = [
  { kind: 'number', id: 'age', labelKey: 'age', min: 18, max: 120, step: 1, required: true },
  {
    kind: 'select',
    id: 'sex',
    labelKey: 'sex',
    required: true,
    options: [
      { id: 'male', labelKey: 'male' },
      { id: 'female', labelKey: 'female' },
    ],
  },
  { kind: 'boolean', id: 'chf', labelKey: 'chf' },
  { kind: 'boolean', id: 'hypertension', labelKey: 'hypertension' },
  { kind: 'boolean', id: 'diabetes', labelKey: 'diabetes' },
  { kind: 'boolean', id: 'stroke', labelKey: 'stroke' },
  { kind: 'boolean', id: 'vascular', labelKey: 'vascular' },
];

export function computeCha2ds2Vasc(input: Cha2ds2VascInput): CalcResult {
  const age = Number(input.age);
  const contributions: Contribution[] = [];
  let score = 0;
  const add = (labelKey: string, value: number, detail?: string) => {
    if (value > 0) {
      score += value;
      contributions.push({ labelKey, value, ...(detail ? { detail } : {}) });
    }
  };

  const agePts = age >= 75 ? 2 : age >= 65 ? 1 : 0;
  add('age', agePts, age >= 75 ? '≥ 75' : age >= 65 ? '65–74' : undefined);
  add('sex', input.sex === 'female' ? 1 : 0);
  add('chf', input.chf ? 1 : 0);
  add('hypertension', input.hypertension ? 1 : 0);
  add('diabetes', input.diabetes ? 1 : 0);
  add('stroke', input.stroke ? 2 : 0);
  add('vascular', input.vascular ? 1 : 0);

  const band = bandFor(score, CHA2DS2VASC_BANDS);
  return { score, bandId: band.id, contributions };
}

export const cha2ds2VascDefinition: CalculatorDefinition<Cha2ds2VascInput, CalcResult> = {
  slug: 'cha2ds2-vasc',
  version: '1.0.0',
  tier: 'standard',
  i18nKey: 'cha2ds2vasc',
  estimatesRiskOf: 'Stroke',
  bands: CHA2DS2VASC_BANDS,
  provenance: CHA2DS2VASC_PROVENANCE,
  inputs: CHA2DS2VASC_INPUTS,
  defaultInput: {
    age: 70,
    sex: 'male',
    chf: false,
    hypertension: false,
    diabetes: false,
    stroke: false,
    vascular: false,
  },
  compute: computeCha2ds2Vasc,
  goldenCases: [
    {
      id: 'young-no-factors',
      input: { age: 50, sex: 'male', chf: false, hypertension: false, diabetes: false, stroke: false, vascular: false },
      expectedScore: 0,
      expectedBandId: 'low',
      status: 'verified',
      source: 'Canonical CHA₂DS₂-VASc point table',
    },
    {
      id: 'female-only-modifier',
      input: { age: 50, sex: 'female', chf: false, hypertension: false, diabetes: false, stroke: false, vascular: false },
      expectedScore: 1,
      expectedBandId: 'intermediate',
      status: 'verified',
      source: 'Canonical CHA₂DS₂-VASc point table',
    },
    {
      id: 'elderly-multiple-factors',
      input: { age: 80, sex: 'female', chf: false, hypertension: true, diabetes: true, stroke: true, vascular: false },
      expectedScore: 7,
      expectedBandId: 'high',
      source: 'Canonical CHA₂DS₂-VASc point table',
      status: 'verified',
    },
  ],
};
