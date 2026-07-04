/**
 * schema.org JSON-LD builders for medical pages.
 * https://schema.org/MedicalWebPage, https://schema.org/MedicalRiskCalculator
 */

interface MedicalWebPageInput {
  url: string;
  name: string;
  description: string;
  inLanguage: string;
  medicalAudience?: string;
}

export function medicalWebPage(input: MedicalWebPageInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    url: input.url,
    name: input.name,
    description: input.description,
    inLanguage: input.inLanguage,
    audience: {
      '@type': 'MedicalAudience',
      audienceType: input.medicalAudience ?? 'Clinician',
    },
  };
}

interface MedicalRiskCalculatorInput extends MedicalWebPageInput {
  /** Condition the calculator estimates risk for, e.g. "Coronary artery disease". */
  estimatesRiskOf: string;
}

export function medicalRiskCalculator(input: MedicalRiskCalculatorInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalRiskCalculator',
    url: input.url,
    name: input.name,
    description: input.description,
    inLanguage: input.inLanguage,
    estimatesRiskOf: {
      '@type': 'MedicalCondition',
      name: input.estimatesRiskOf,
    },
  };
}

export type JsonLd =
  | ReturnType<typeof medicalWebPage>
  | ReturnType<typeof medicalRiskCalculator>;
