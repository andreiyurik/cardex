import type { Dictionary } from './index';

/** English dictionary — secondary locale. */
export const en: Dictionary = {
  site: {
    name: 'Cardex',
    tagline: 'Clinical calculators for interventional cardiologists',
  },
  nav: {
    home: 'Home',
    calculators: 'Calculators',
    switchLocale: 'Русский',
  },
  footer: {
    disclaimer:
      'This tool is under development and has not undergone clinical ' +
      'verification. Not intended for clinical decision-making. ' +
      'All calculations run locally in your browser — no data is transmitted.',
    madeFor: 'Built for interventional cardiologists',
  },
  home: {
    title: 'Visual clinical calculators',
    subtitle:
      'Interactive tools for interventional cardiology: fast scoring, ' +
      'visualization, and interpretation based on current risk scales.',
    openCalculator: 'Open calculator',
    comingSoon: 'Coming soon',
    offlineReady: 'Works offline',
  },
  calc: {
    result: 'Result',
    category: 'Category',
    explanation: 'How this was calculated',
    formula: 'Formula',
    reset: 'Reset',
    share: 'Copy link',
    shared: 'Link copied',
    enterValues: 'Enter values',
    invalidInput: 'Check the entered values',
    notForClinicalUse: 'Not for clinical decisions',
    provenanceTitle: 'Source & verification',
    sources: 'Sources',
    reviewedBy: 'Clinical review',
    notReviewed: 'Not verified by a practicing physician',
    statusDraft: 'Draft — pending physician verification',
    statusVerified: 'Physician-verified',
    version: 'Version',
    unverifiedNote:
      'Coefficients are placeholders pending verification by a practicing ' +
      'physician. Do not use for clinical decisions.',
  },
  units: {
    'mg/dL': 'mg/dL',
    'µmol/L': 'µmol/L',
    kg: 'kg',
    lb: 'lb',
    'ml/min': 'mL/min',
  },
  calculators: {
    syntax: {
      title: 'SYNTAX Score',
      shortDescription:
        'Anatomical complexity assessment of coronary artery disease',
      seoTitle: 'SYNTAX Score Calculator | Cardex',
      seoDescription:
        'Interactive SYNTAX Score calculator: mark diseased segments on the ' +
        'coronary tree diagram and get the score with interpretation ' +
        '(low, intermediate, high risk).',
      intro:
        'The SYNTAX Score grades the anatomical complexity of coronary ' +
        'artery disease and informs the choice of revascularization strategy ' +
        '(PCI vs CABG). Mark diseased segments on the interactive diagram — ' +
        'the score and interpretation update automatically.',
      notes:
        'Adverse lesion characteristics (bifurcation, calcification, ' +
        'tortuosity, thrombus, chronic total occlusion details) are not yet ' +
        'modeled.',
      bands: {
        low: {
          label: 'Low (≤ 22)',
          summary: 'Low anatomical complexity. PCI is usually considered.',
        },
        intermediate: {
          label: 'Intermediate (23–32)',
          summary: 'Intermediate complexity. Heart Team decision.',
        },
        high: {
          label: 'High (≥ 33)',
          summary: 'High complexity. CABG often preferred. Heart Team decision.',
        },
      },
    },
    creatinine: {
      title: 'Creatinine clearance (Cockcroft–Gault)',
      shortDescription:
        'Estimated creatinine clearance for dosing and risk assessment',
      seoTitle: 'Cockcroft–Gault Creatinine Clearance Calculator | Cardex',
      seoDescription:
        'Cockcroft–Gault creatinine clearance calculator: age, sex, body ' +
        'weight and serum creatinine. Unit switching (mg/dL ↔ µmol/L, ' +
        'kg ↔ lb).',
      intro:
        'The Cockcroft–Gault equation estimates creatinine clearance from ' +
        'age, sex, body weight and serum creatinine. Used for dose ' +
        'adjustment and contrast-induced nephropathy risk assessment.',
      fields: {
        age: 'Age (years)',
        sex: 'Sex',
        weight: 'Body weight',
        creatinine: 'Serum creatinine',
      },
      options: {
        male: 'Male',
        female: 'Female',
      },
      bands: {
        failure: {
          label: 'Kidney failure (< 15)',
          summary: 'Severe reduction in kidney function.',
        },
        severe: {
          label: 'Severe reduction (15–29)',
          summary: 'Markedly reduced clearance.',
        },
        moderate: {
          label: 'Moderate reduction (30–59)',
          summary: 'Moderately reduced kidney function.',
        },
        mild: {
          label: 'Mild reduction (60–89)',
          summary: 'Mildly reduced clearance.',
        },
        normal: {
          label: 'Normal (≥ 90)',
          summary: 'Normal kidney function.',
        },
      },
    },
  },
  syntaxCalc: {
    dominance: 'Dominance',
    dominanceRight: 'Right dominant',
    dominanceLeft: 'Left dominant',
    treeHint: 'Tap a segment to mark a lesion',
    selectedLesions: 'Marked lesions',
    noLesions: 'No segments marked',
    totalOcclusion: 'Total occlusion',
    remove: 'Remove',
    segments: {
      s1: 'RCA proximal',
      s2: 'RCA mid',
      s3: 'RCA distal',
      s4: 'Posterior descending artery (PDA)',
      s5: 'Left main',
      s6: 'LAD proximal',
      s7: 'LAD mid',
      s8: 'LAD apical',
      s9: 'First diagonal (D1)',
      s10: 'Second diagonal (D2)',
      s11: 'LCx proximal',
      s12: 'Obtuse marginal (OM)',
      s13: 'LCx distal',
      s14: 'Posterolateral branch of LCx',
      s15: 'PDA from LCx (left dominance)',
      s16: 'Posterolateral branch of RCA',
    },
  },
};
