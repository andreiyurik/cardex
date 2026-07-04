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
    about: 'About',
    legal: 'Disclaimer',
    contact: 'Contact',
  },
  about: {
    title: 'About',
    lead:
      'Cardex offers visual clinical calculators for interventional ' +
      'cardiology — fast, clear, and grounded in sources.',
    missionTitle: 'Mission',
    mission:
      'Make everyday scoring fast and legible right at the bedside. Everything ' +
      'is computed locally in the browser — no patient data is transmitted or ' +
      'stored, and the app works offline.',
    methodTitle: 'How we ensure correctness',
    method:
      'All clinical logic lives in a single verifiable layer with cited ' +
      'sources and is covered by golden-case tests. Formulas and thresholds ' +
      'are verified by a practicing physician; each calculator shows its ' +
      'verification status, version and sources.',
    teamTitle: 'Team',
    team:
      'Built by an engineer together with a practicing interventional ' +
      'cardiologist responsible for clinical correctness.',
    statusNote:
      'Some calculators are currently drafts: their coefficients await ' +
      'physician verification and are labeled accordingly.',
  },
  disclaimer: {
    title: 'Disclaimer',
    p1:
      'Cardex is an educational and supportive tool. It does not replace the ' +
      'clinical judgment, diagnosis or treatment provided by a physician.',
    p2:
      'Use of this site does not create a doctor–patient relationship. ' +
      'Responsibility for any clinical decision remains with the treating ' +
      'physician.',
    p3:
      'Some calculators are under development: coefficients and thresholds may ' +
      'be placeholders pending verification. Do not use them for clinical ' +
      'decisions until they are marked "physician-verified".',
    p4:
      'Privacy: all calculations run locally in your browser. No patient data ' +
      'is transmitted or stored on servers.',
    p5: 'Found an error or inaccuracy? Let us know:',
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
    onReview: 'Under clinical verification',
    provenanceTitle: 'Source & verification',
    sources: 'Sources',
    reviewedBy: 'Clinical review',
    notReviewed: 'Not verified by a practicing physician',
    statusDraft: 'Draft — pending physician verification',
    statusVerified: 'Physician-verified',
    version: 'Version',
    unverifiedNote:
      'The numbers in this calculator are placeholders pending verification ' +
      'by a practicing physician. Do not use for clinical decisions.',
    draftNote:
      'Based on a published score but not yet signed off by a practicing ' +
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
    cha2ds2vasc: {
      title: 'CHA₂DS₂-VASc',
      shortDescription: 'Stroke risk in atrial fibrillation',
      seoTitle: 'CHA₂DS₂-VASc Stroke Risk Calculator | Cardex',
      seoDescription:
        'CHA₂DS₂-VASc calculator: estimate stroke and thromboembolism risk in ' +
        'non-valvular atrial fibrillation to guide anticoagulation.',
      intro:
        'CHA₂DS₂-VASc estimates the risk of stroke and systemic ' +
        'thromboembolism in non-valvular atrial fibrillation and guides the ' +
        'decision on anticoagulation.',
      fields: {
        age: 'Age (years)',
        sex: 'Sex',
        chf: 'CHF / LV dysfunction',
        hypertension: 'Hypertension',
        diabetes: 'Diabetes mellitus',
        stroke: 'Stroke / TIA / thromboembolism',
        vascular: 'Vascular disease',
      },
      options: { male: 'Male', female: 'Female' },
      bands: {
        low: { label: 'Low (0)', summary: 'Low risk. Anticoagulation usually not required.' },
        intermediate: { label: 'Intermediate (1)', summary: 'Intermediate risk. Consider anticoagulation.' },
        high: { label: 'High (≥ 2)', summary: 'High risk. Anticoagulation generally indicated.' },
      },
    },
    hasbled: {
      title: 'HAS-BLED',
      shortDescription: 'Bleeding risk on anticoagulation',
      seoTitle: 'HAS-BLED Bleeding Risk Calculator | Cardex',
      seoDescription:
        'HAS-BLED calculator: estimate major bleeding risk on anticoagulation ' +
        'in patients with atrial fibrillation.',
      intro:
        'HAS-BLED estimates major bleeding risk on anticoagulation in atrial ' +
        'fibrillation. A high score is a prompt to correct modifiable factors, ' +
        'not to withhold anticoagulation.',
      fields: {
        hypertension: 'Hypertension (SBP > 160)',
        renal: 'Abnormal renal function',
        liver: 'Abnormal liver function',
        stroke: 'Prior stroke',
        bleeding: 'Bleeding history / predisposition',
        labileInr: 'Labile INR',
        elderly: 'Age > 65',
        drugs: 'Drugs (antiplatelet / NSAID)',
        alcohol: 'Alcohol excess',
      },
      bands: {
        low: { label: 'Low (0–2)', summary: 'Low bleeding risk.' },
        high: { label: 'High (≥ 3)', summary: 'High risk. Manage modifiable factors.' },
      },
    },
    grace: {
      title: 'GRACE',
      shortDescription: 'Mortality risk in acute coronary syndrome',
      seoTitle: 'GRACE ACS Risk Calculator | Cardex',
      seoDescription:
        'GRACE calculator: risk stratification of mortality in acute coronary ' +
        'syndrome from clinical variables at admission.',
      intro:
        'GRACE stratifies the risk of death in acute coronary syndrome from ' +
        'variables at admission and helps guide the management strategy.',
      notes:
        'The point tables are placeholders pending transcription and ' +
        'verification of the original GRACE algorithm by a practicing physician.',
      fields: {
        age: 'Age (years)',
        heartRate: 'Heart rate (bpm)',
        systolicBp: 'Systolic BP (mmHg)',
        creatinine: 'Serum creatinine',
        killip: 'Killip class',
        cardiacArrest: 'Cardiac arrest at admission',
        stDeviation: 'ST-segment deviation',
        elevatedMarkers: 'Elevated cardiac markers',
      },
      options: {
        killipI: 'I (no HF)',
        killipII: 'II (rales / S3)',
        killipIII: 'III (pulmonary edema)',
        killipIV: 'IV (cardiogenic shock)',
      },
      bands: {
        low: { label: 'Low', summary: 'Low risk. Thresholds are placeholders pending verification.' },
        intermediate: { label: 'Intermediate', summary: 'Intermediate risk. Thresholds pending verification.' },
        high: { label: 'High', summary: 'High risk. Thresholds pending verification.' },
      },
    },
    mehran: {
      title: 'Mehran score',
      shortDescription: 'Contrast-induced nephropathy risk after PCI',
      seoTitle: 'Mehran Score — CI-AKI Risk After PCI | Cardex',
      seoDescription:
        'Mehran score calculator: risk of contrast-induced acute kidney injury ' +
        '(CI-AKI) after percutaneous coronary intervention.',
      intro:
        'The Mehran score estimates the risk of contrast-induced acute kidney ' +
        'injury (CI-AKI) after PCI. It pairs well with the creatinine clearance ' +
        'calculator.',
      notes:
        'Factor weights are placeholders pending verification by a practicing ' +
        'physician.',
      fields: {
        hypotension: 'Hypotension',
        iabp: 'Intra-aortic balloon pump',
        chf: 'Congestive heart failure',
        ageOver75: 'Age > 75',
        anemia: 'Anemia',
        diabetes: 'Diabetes mellitus',
        renal: 'Renal function (eGFR)',
        contrastVolume: 'Contrast volume (mL)',
      },
      options: {
        none: 'Normal (eGFR ≥ 60)',
        'egfr40-60': 'eGFR 40–60',
        'egfr20-40': 'eGFR 20–40',
        'egfr<20': 'eGFR < 20',
      },
      bands: {
        low: { label: 'Low (≤ 5)', summary: 'Low CI-AKI risk.' },
        moderate: { label: 'Moderate (6–10)', summary: 'Moderate CI-AKI risk.' },
        high: { label: 'High (11–15)', summary: 'High CI-AKI risk.' },
        veryHigh: { label: 'Very high (≥ 16)', summary: 'Very high CI-AKI risk.' },
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
