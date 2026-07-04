/**
 * GRACE — risk of death in acute coronary syndrome. Standard-tier,
 * additive score over categorized clinical variables.
 *
 * ─────────────────────────────────────────────────────────────────────
 * TODO(clinical): verify with practicing physician.
 * The per-variable POINT TABLES below are PLACEHOLDERS (simple round
 * numbers), NOT the real GRACE lookup values, and the band thresholds are
 * placeholders too. The real GRACE / GRACE 2.0 mapping must be transcribed
 * from the primary source and verified before any clinical use. Only the
 * STRUCTURE (which variables, additive mechanics, banding) is real here.
 * Golden cases are 'placeholder' (regression only). provenance.status is
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

export type KillipClass = 'I' | 'II' | 'III' | 'IV';

export interface GraceInput extends StandardInput {
  age: number;
  heartRate: number;
  systolicBp: number;
  creatinine: number; // mg/dL (canonical)
  killip: KillipClass;
  cardiacArrest: boolean;
  stDeviation: boolean;
  elevatedMarkers: boolean;
}

const MGDL_PER_UMOL = 1 / 88.4;

/** TODO(clinical): PLACEHOLDER point tables — replace with real GRACE values. */
function agePoints(age: number): number {
  if (age >= 80) return 5;
  if (age >= 70) return 4;
  if (age >= 60) return 3;
  if (age >= 50) return 2;
  if (age >= 40) return 1;
  return 0;
}
function heartRatePoints(hr: number): number {
  if (hr >= 150) return 4;
  if (hr >= 110) return 3;
  if (hr >= 90) return 2;
  if (hr >= 70) return 1;
  return 0;
}
function sbpPoints(sbp: number): number {
  if (sbp < 100) return 4;
  if (sbp < 120) return 3;
  if (sbp < 160) return 2;
  if (sbp < 200) return 1;
  return 0;
}
function creatininePoints(scr: number): number {
  if (scr >= 4) return 3;
  if (scr >= 2) return 2;
  if (scr >= 1) return 1;
  return 0;
}
const KILLIP_POINTS: Record<KillipClass, number> = { I: 0, II: 2, III: 4, IV: 6 };

export const GRACE_BANDS: InterpretationBand[] = [
  { id: 'low', severity: 'low', min: 0, max: 10, labelKey: 'low.label', summaryKey: 'low.summary' },
  { id: 'intermediate', severity: 'moderate', min: 11, max: 20, labelKey: 'intermediate.label', summaryKey: 'intermediate.summary' },
  { id: 'high', severity: 'high', min: 21, max: null, labelKey: 'high.label', summaryKey: 'high.summary' },
];

export const GRACE_PROVENANCE: Provenance = {
  status: 'draft',
  sources: [
    {
      title:
        'Predictors of hospital mortality in the Global Registry of Acute Coronary Events (GRACE)',
      authors: 'Granger CB, et al.',
      journal: 'Arch Intern Med',
      year: 2003,
      doi: '10.1001/archinte.163.19.2345',
    },
  ],
  notesKey: 'notes',
};

export const GRACE_INPUTS: InputField[] = [
  { kind: 'number', id: 'age', labelKey: 'age', min: 18, max: 120, step: 1, required: true },
  { kind: 'number', id: 'heartRate', labelKey: 'heartRate', min: 20, max: 300, step: 1, required: true },
  { kind: 'number', id: 'systolicBp', labelKey: 'systolicBp', min: 40, max: 300, step: 1, required: true },
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
  {
    kind: 'select',
    id: 'killip',
    labelKey: 'killip',
    required: true,
    options: [
      { id: 'I', labelKey: 'killipI' },
      { id: 'II', labelKey: 'killipII' },
      { id: 'III', labelKey: 'killipIII' },
      { id: 'IV', labelKey: 'killipIV' },
    ],
  },
  { kind: 'boolean', id: 'cardiacArrest', labelKey: 'cardiacArrest' },
  { kind: 'boolean', id: 'stDeviation', labelKey: 'stDeviation' },
  { kind: 'boolean', id: 'elevatedMarkers', labelKey: 'elevatedMarkers' },
];

export function computeGrace(input: GraceInput): CalcResult {
  const contributions: Contribution[] = [];
  let score = 0;
  const add = (labelKey: string, value: number) => {
    if (value > 0) {
      score += value;
      contributions.push({ labelKey, value });
    }
  };

  add('age', agePoints(Number(input.age)));
  add('heartRate', heartRatePoints(Number(input.heartRate)));
  add('systolicBp', sbpPoints(Number(input.systolicBp)));
  add('creatinine', creatininePoints(Number(input.creatinine)));
  add('killip', KILLIP_POINTS[input.killip] ?? 0);
  add('cardiacArrest', input.cardiacArrest ? 5 : 0);
  add('stDeviation', input.stDeviation ? 3 : 0);
  add('elevatedMarkers', input.elevatedMarkers ? 3 : 0);

  const band = bandFor(score, GRACE_BANDS);
  return { score, bandId: band.id, contributions };
}

export const graceDefinition: CalculatorDefinition<GraceInput, CalcResult> = {
  slug: 'grace',
  version: '0.1.0-draft',
  tier: 'standard',
  i18nKey: 'grace',
  estimatesRiskOf: 'Death in acute coronary syndrome',
  bands: GRACE_BANDS,
  provenance: GRACE_PROVENANCE,
  inputs: GRACE_INPUTS,
  defaultInput: {
    age: 65,
    heartRate: 80,
    systolicBp: 130,
    creatinine: 1.0,
    killip: 'I',
    cardiacArrest: false,
    stDeviation: false,
    elevatedMarkers: true,
  },
  compute: computeGrace,
  goldenCases: [
    {
      id: 'default-low',
      input: { age: 65, heartRate: 80, systolicBp: 130, creatinine: 1.0, killip: 'I', cardiacArrest: false, stDeviation: false, elevatedMarkers: true },
      expectedScore: 10, // 3 + 1 + 2 + 1 + 0 + 0 + 0 + 3
      expectedBandId: 'low',
      status: 'placeholder',
      source: 'mechanics regression (placeholder point tables)',
    },
    {
      id: 'intermediate-example',
      input: { age: 70, heartRate: 100, systolicBp: 110, creatinine: 1.5, killip: 'II', cardiacArrest: false, stDeviation: false, elevatedMarkers: true },
      expectedScore: 15, // 4 + 2 + 3 + 1 + 2 + 0 + 0 + 3
      expectedBandId: 'intermediate',
      status: 'placeholder',
      source: 'mechanics regression (placeholder point tables)',
    },
    {
      id: 'high-example',
      input: { age: 80, heartRate: 150, systolicBp: 90, creatinine: 2.0, killip: 'III', cardiacArrest: true, stDeviation: true, elevatedMarkers: true },
      expectedScore: 30, // 5 + 4 + 4 + 2 + 4 + 5 + 3 + 3
      expectedBandId: 'high',
      status: 'placeholder',
      source: 'mechanics regression (placeholder point tables)',
    },
  ],
};
