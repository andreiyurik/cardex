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
    reset: 'Reset',
    score: 'SYNTAX Score',
    risk: {
      low: 'Low (≤ 22)',
      intermediate: 'Intermediate (23–32)',
      high: 'High (≥ 33)',
    },
    riskLabel: 'Category',
    unverifiedBadge: 'Coefficients not verified',
    unverifiedNote:
      'Segment weights and multipliers are placeholders pending verification ' +
      'by a practicing physician. Do not use for clinical decisions.',
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
