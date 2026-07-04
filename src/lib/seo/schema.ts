/**
 * schema.org JSON-LD builders for medical pages.
 * https://schema.org/MedicalWebPage, https://schema.org/MedicalRiskCalculator
 */
import type { Citation } from '../calculators/types';

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

function citationToSchema(c: Citation) {
  return {
    '@type': 'ScholarlyArticle',
    name: c.title,
    ...(c.authors ? { author: c.authors } : {}),
    ...(c.journal ? { isPartOf: { '@type': 'Periodical', name: c.journal } } : {}),
    datePublished: String(c.year),
    ...(c.doi ? { sameAs: `https://doi.org/${c.doi}` } : c.url ? { sameAs: c.url } : {}),
  };
}

interface MedicalRiskCalculatorInput extends MedicalWebPageInput {
  /** Condition the calculator estimates risk for, e.g. "Coronary artery disease". */
  estimatesRiskOf: string;
  citations?: Citation[];
  version?: string;
  /** ISO date of the last physician review, if any. */
  lastReviewed?: string;
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
    ...(input.version ? { version: input.version } : {}),
    ...(input.lastReviewed ? { lastReviewed: input.lastReviewed } : {}),
    ...(input.citations && input.citations.length
      ? { citation: input.citations.map(citationToSchema) }
      : {}),
  };
}

export type JsonLd =
  | ReturnType<typeof medicalWebPage>
  | ReturnType<typeof medicalRiskCalculator>;
