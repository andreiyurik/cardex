/**
 * HAS-BLED — major bleeding risk on anticoagulation in atrial fibrillation.
 * Standard-tier, additive point score (each factor = 1 point, max 9).
 *
 * The one-point-per-factor structure is the canonical definition; golden
 * cases are deterministic from it. provenance.status stays 'draft' until
 * the physician co-founder confirms the ≥3 "high risk" threshold wording
 * and the factor definitions (e.g. uncontrolled hypertension SBP > 160).
 *
 * TODO(clinical): confirm factor definitions and the high-risk threshold.
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

export interface HasBledInput extends StandardInput {
  hypertension: boolean; // uncontrolled, SBP > 160
  renal: boolean; // abnormal renal function
  liver: boolean; // abnormal liver function
  stroke: boolean;
  bleeding: boolean; // prior major bleeding or predisposition
  labileInr: boolean;
  elderly: boolean; // age > 65
  drugs: boolean; // antiplatelet / NSAID
  alcohol: boolean; // alcohol excess
}

export const HASBLED_BANDS: InterpretationBand[] = [
  { id: 'low', severity: 'low', min: 0, max: 2, labelKey: 'low.label', summaryKey: 'low.summary' },
  { id: 'high', severity: 'high', min: 3, max: null, labelKey: 'high.label', summaryKey: 'high.summary' },
];

export const HASBLED_PROVENANCE: Provenance = {
  status: 'draft',
  sources: [
    {
      title:
        'A novel user-friendly score (HAS-BLED) to assess 1-year risk of major bleeding in patients with atrial fibrillation',
      authors: 'Pisters R, et al.',
      journal: 'Chest',
      year: 2010,
      doi: '10.1378/chest.10-0134',
    },
  ],
};

export const HASBLED_INPUTS: InputField[] = [
  { kind: 'boolean', id: 'hypertension', labelKey: 'hypertension' },
  { kind: 'boolean', id: 'renal', labelKey: 'renal' },
  { kind: 'boolean', id: 'liver', labelKey: 'liver' },
  { kind: 'boolean', id: 'stroke', labelKey: 'stroke' },
  { kind: 'boolean', id: 'bleeding', labelKey: 'bleeding' },
  { kind: 'boolean', id: 'labileInr', labelKey: 'labileInr' },
  { kind: 'boolean', id: 'elderly', labelKey: 'elderly' },
  { kind: 'boolean', id: 'drugs', labelKey: 'drugs' },
  { kind: 'boolean', id: 'alcohol', labelKey: 'alcohol' },
];

export function computeHasBled(input: HasBledInput): CalcResult {
  const contributions: Contribution[] = [];
  let score = 0;
  const add = (labelKey: string, on: boolean) => {
    if (on) {
      score += 1;
      contributions.push({ labelKey, value: 1 });
    }
  };

  add('hypertension', input.hypertension);
  add('renal', input.renal);
  add('liver', input.liver);
  add('stroke', input.stroke);
  add('bleeding', input.bleeding);
  add('labileInr', input.labileInr);
  add('elderly', input.elderly);
  add('drugs', input.drugs);
  add('alcohol', input.alcohol);

  const band = bandFor(score, HASBLED_BANDS);
  return { score, bandId: band.id, contributions };
}

export const hasBledDefinition: CalculatorDefinition<HasBledInput, CalcResult> = {
  slug: 'has-bled',
  version: '1.0.0',
  tier: 'standard',
  i18nKey: 'hasbled',
  estimatesRiskOf: 'Major bleeding',
  bands: HASBLED_BANDS,
  provenance: HASBLED_PROVENANCE,
  inputs: HASBLED_INPUTS,
  defaultInput: {
    hypertension: false,
    renal: false,
    liver: false,
    stroke: false,
    bleeding: false,
    labileInr: false,
    elderly: false,
    drugs: false,
    alcohol: false,
  },
  compute: computeHasBled,
  goldenCases: [
    {
      id: 'no-factors',
      input: { hypertension: false, renal: false, liver: false, stroke: false, bleeding: false, labileInr: false, elderly: false, drugs: false, alcohol: false },
      expectedScore: 0,
      expectedBandId: 'low',
      status: 'verified',
      source: 'Canonical HAS-BLED point table',
    },
    {
      id: 'three-factors-high',
      input: { hypertension: true, renal: true, liver: false, stroke: false, bleeding: false, labileInr: false, elderly: true, drugs: false, alcohol: false },
      expectedScore: 3,
      expectedBandId: 'high',
      status: 'verified',
      source: 'Canonical HAS-BLED point table',
    },
    {
      id: 'all-factors',
      input: { hypertension: true, renal: true, liver: true, stroke: true, bleeding: true, labileInr: true, elderly: true, drugs: true, alcohol: true },
      expectedScore: 9,
      expectedBandId: 'high',
      status: 'verified',
      source: 'Canonical HAS-BLED point table (max score)',
    },
  ],
};
