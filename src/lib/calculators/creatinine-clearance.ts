/**
 * Creatinine Clearance — Cockcroft–Gault. Standard-tier calculator
 * (form-driven, rendered by the generic engine).
 *
 * This is a well-established published formula (not invented coefficients),
 * directly relevant to interventional cardiology (contrast dosing / CI-AKI
 * risk). It is the reference implementation for the STANDARD tier: it
 * exercises unit switching (creatinine mg/dL ↔ µmol/L, weight kg ↔ lb),
 * a select field, and physiologic range validation.
 *
 * TODO(clinical): verify formula transcription and band boundaries with a
 * practicing physician before clinical use — provenance.status is 'draft'.
 */
import {
  bandFor,
  type CalcResult,
  type CalculatorDefinition,
  type InputField,
  type InterpretationBand,
  type Provenance,
  type StandardInput,
} from './types';

/** Cockcroft–Gault native units: age (years), weight (kg), creatinine (mg/dL). */
export interface CrClInput extends StandardInput {
  age: number;
  weight: number; // kg (canonical)
  sex: 'male' | 'female';
  creatinine: number; // mg/dL (canonical)
}

/** 1 mg/dL creatinine = 88.4 µmol/L. */
const MGDL_PER_UMOL = 1 / 88.4;
const KG_PER_LB = 0.45359237;

export const CRCL_BANDS: InterpretationBand[] = [
  { id: 'failure', severity: 'very-high', min: 0, max: 14, labelKey: 'failure.label', summaryKey: 'failure.summary' },
  { id: 'severe', severity: 'high', min: 15, max: 29, labelKey: 'severe.label', summaryKey: 'severe.summary' },
  { id: 'moderate', severity: 'moderate', min: 30, max: 59, labelKey: 'moderate.label', summaryKey: 'moderate.summary' },
  { id: 'mild', severity: 'low', min: 60, max: 89, labelKey: 'mild.label', summaryKey: 'mild.summary' },
  { id: 'normal', severity: 'low', min: 90, max: null, labelKey: 'normal.label', summaryKey: 'normal.summary' },
];

export const CRCL_PROVENANCE: Provenance = {
  status: 'draft',
  sources: [
    {
      title: 'Prediction of creatinine clearance from serum creatinine',
      authors: 'Cockcroft DW, Gault MH',
      journal: 'Nephron',
      year: 1976,
      doi: '10.1159/000180580',
    },
  ],
};

export const CRCL_INPUTS: InputField[] = [
  {
    kind: 'number',
    id: 'age',
    labelKey: 'age',
    min: 18,
    max: 120,
    step: 1,
    required: true,
  },
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
  {
    kind: 'number',
    id: 'weight',
    labelKey: 'weight',
    min: 20,
    max: 300,
    step: 0.5,
    required: true,
    units: [
      { id: 'kg', toCanonical: (v) => v, fromCanonical: (v) => v },
      { id: 'lb', toCanonical: (v) => v * KG_PER_LB, fromCanonical: (v) => v / KG_PER_LB },
    ],
  },
  {
    kind: 'number',
    id: 'creatinine',
    labelKey: 'creatinine',
    min: 0.1,
    max: 20,
    step: 0.1,
    required: true,
    units: [
      { id: 'mg/dL', toCanonical: (v) => v, fromCanonical: (v) => v },
      { id: 'µmol/L', toCanonical: (v) => v * MGDL_PER_UMOL, fromCanonical: (v) => v / MGDL_PER_UMOL },
    ],
  },
];

export function computeCrCl(input: CrClInput): CalcResult {
  const age = Number(input.age);
  const weight = Number(input.weight);
  const scr = Number(input.creatinine);
  const sexFactor = input.sex === 'female' ? 0.85 : 1;

  const raw = ((140 - age) * weight * sexFactor) / (72 * scr);
  const score = Math.round(raw * 10) / 10;
  const band = bandFor(score, CRCL_BANDS);

  const sexLabel = sexFactor === 1 ? '1' : '0.85';
  return {
    score,
    bandId: band.id,
    unitKey: 'ml/min',
    contributions: [],
    formula: `CrCl = (140 − ${age}) × ${weight} × ${sexLabel} / (72 × ${scr}) = ${score} мл/мин`,
  };
}

export const creatinineClearanceDefinition: CalculatorDefinition<CrClInput, CalcResult> = {
  slug: 'creatinine-clearance',
  version: '1.0.0',
  tier: 'standard',
  i18nKey: 'creatinine',
  estimatesRiskOf: 'Chronic kidney disease',
  bands: CRCL_BANDS,
  provenance: CRCL_PROVENANCE,
  inputs: CRCL_INPUTS,
  defaultInput: { age: 65, sex: 'male', weight: 80, creatinine: 1 },
  compute: computeCrCl,
  goldenCases: [
    {
      id: 'male-70y-72kg-scr1.0',
      input: { age: 70, sex: 'male', weight: 72, creatinine: 1.0 },
      expectedScore: 70,
      expectedBandId: 'mild',
      status: 'verified',
      source: 'Cockcroft–Gault worked example',
    },
    {
      id: 'female-65y-70kg-scr1.1',
      input: { age: 65, sex: 'female', weight: 70, creatinine: 1.1 },
      expectedScore: 56.3,
      expectedBandId: 'moderate',
      status: 'verified',
      source: 'Cockcroft–Gault × 0.85 female factor',
    },
    {
      id: 'male-60y-80kg-scr2.0-severe',
      input: { age: 60, sex: 'male', weight: 80, creatinine: 2.0 },
      expectedScore: 44.4,
      expectedBandId: 'moderate',
      status: 'verified',
      source: 'Cockcroft–Gault worked example',
    },
  ],
};
