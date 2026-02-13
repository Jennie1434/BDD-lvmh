/**
 * Service de nettoyage RGPD en TypeScript
 * Suppression des mots parasites et validation RGPD
 */

// Mots parasites à supprimer
const PARASITIC_EXPRESSIONS = [
  // Expressions longues
  /\ben quelque (sorte|manière)\b/gi,
  /\bpour ainsi dire\b/gi,
  /\bplus ou moins\b/gi,
  /\bsi je puis dire\b/gi,
  /\bcomme qui dirait\b/gi,
  /\bje veux dire\b/gi,
  /\bje dirais?\b/gi,
  /\bcomment dire\b/gi,
  /\bc\'?est[- ]à[- ]dire\b/gi,
  /\bde toute (façon|manière)\b/gi,
  /\bpour le coup\b/gi,
  /\bdu coup\b/gi,
  /\bau coup\b/gi,

  // Expressions moyennes
  /\bon va dire\b/gi,
  /\bsi vous voulez\b/gi,
  /\bsi tu veux\b/gi,
  /\btu (sais|vois)\b/gi,
  /\bvous (savez|voyez)\b/gi,
  /\ben (gros|fait|effet|réalité|tout cas|fin de compte)\b/gi,
  /\bpar (exemple|contre|hasard|ailleurs|conséquent|truc)\b/gi,
  /\bdisons que\b/gi,
  /\bje pense que\b/gi,
  /\bje crois que\b/gi,

  // Expressions de remplissage
  /\beh bien\.?\b/gi,
  /\bet ben\b/gi,
  /\bet euh\b/gi,
  /\bet donc\b/gi,
  /\bet alors\b/gi,
  /\bet puis\b/gi,
];

const PARASITIC_WORDS = [
  // Hésitations
  /\be+u+h+\b/gi,  // euh, euuh
  /\bh+u+m+\b/gi,  // hum, humm
  /\bh+m+\b/gi,    // hm, hmm
  /\ba+h+\b/gi,    // ah, ahh
  /\bo+h+\b/gi,    // oh, ohh
  /\bb+a+h+\b/gi,  // bah
  /\bb+e+n+\b/gi,  // ben
  /\bh+e+i+n+\b/gi, // hein

  // Mots de liaison inutiles
  /\bvoilà+\b/gi,
  /\bquoi+\b/gi,
  /\balors+\b/gi,
  /\bdonc+\b/gi,
  /\benfin+\b/gi,
  /\bbref+\b/gi,
  /\bpuis+\b/gi,
  /\bpis+\b/gi,
];

/**
 * Supprime les mots parasites du texte
 */
export function cleanParasiticWords(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  let cleaned = text.toLowerCase();

  // Supprimer les expressions longues
  PARASITIC_EXPRESSIONS.forEach(expr => {
    cleaned = cleaned.replace(expr, ' ');
  });

  // Supprimer les mots parasites
  PARASITIC_WORDS.forEach(word => {
    cleaned = cleaned.replace(word, ' ');
  });

  // Normaliser les espaces multiples
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

/**
 * Détecte les violations RGPD dans le texte
 */
export function detectRGPDViolations(text: string): {
  violations: string[];
  hasViolations: boolean;
  cleanedText: string;
} {
  if (!text || typeof text !== 'string') {
    return {
      violations: [],
      hasViolations: false,
      cleanedText: text || '',
    };
  }

  const violations: string[] = [];
  let cleanedText = text;

  // Détecte les noms propres (capitalisation)
  if (/\b[A-ZÀ-ÿ][a-zà-ÿ]+ [A-ZÀ-ÿ][a-zà-ÿ]+\b/.test(text)) {
    violations.push('Nom_propre');
    cleanedText = cleanedText.replace(/\b[A-ZÀ-ÿ][a-zà-ÿ]+ [A-ZÀ-ÿ][a-zà-ÿ]+\b/g, '[NOM]');
  }

  // Détecte les emails
  if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g.test(text)) {
    violations.push('Email');
    cleanedText = cleanedText.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');
  }

  // Détecte les téléphones (formats français)
  if (/(0\d{1,2}|33[1-9])\s?(\d{2}\s?)*\d{2}\s?\d{2}|06\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}|07\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}/g.test(text)) {
    violations.push('Telephone');
    cleanedText = cleanedText.replace(/(0\d{1,2}|33[1-9])\s?(\d{2}\s?)*\d{2}\s?\d{2}|06\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}|07\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}/g, '[PHONE]');
  }

  // Détecte les IBAN
  if (/[A-Z]{2}\d{2}[A-Z0-9]{1,30}/g.test(text)) {
    violations.push('IBAN');
    cleanedText = cleanedText.replace(/[A-Z]{2}\d{2}[A-Z0-9]{1,30}/g, '[IBAN]');
  }

  // Détecte les numéros de carte (visa, mastercard, etc)
  if (/\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/g.test(text)) {
    violations.push('Carte_bancaire');
    cleanedText = cleanedText.replace(/\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/g, '[CARD]');
  }

  // Détecte les numéros de sécurité sociale
  if (/\d{1,2}\s?\d{2}\s?\d{2}\s?\d{3}\s?\d{3}\s?\d{2}/g.test(text)) {
    violations.push('Securite_sociale');
    cleanedText = cleanedText.replace(/\d{1,2}\s?\d{2}\s?\d{2}\s?\d{3}\s?\d{3}\s?\d{2}/g, '[SSN]');
  }

  return {
    violations,
    hasViolations: violations.length > 0,
    cleanedText,
  };
}

/**
 * Pipeline complet de nettoyage
 */
export function processTranscriptionPipeline(rawText: string): {
  original: string;
  afterParasites: string;
  finalCleaned: string;
  isRGPDCompliant: boolean;
  violationsDetected: string[];
} {
  // Étape 1: Nettoyage parasites
  const afterParasites = cleanParasiticWords(rawText);

  // Étape 2: Vérification RGPD
  const rgpdResult = detectRGPDViolations(afterParasites);

  return {
    original: rawText,
    afterParasites,
    finalCleaned: rgpdResult.cleanedText,
    isRGPDCompliant: !rgpdResult.hasViolations,
    violationsDetected: rgpdResult.violations,
  };
}
