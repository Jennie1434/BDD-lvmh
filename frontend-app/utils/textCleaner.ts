/**
 * Nettoyage de la transcription (Portage de main.py)
 */
export const cleanTranscription = (text: string): string => {
    if (!text) return "";

    let cleaned = text.toString();

    // 0. RGPD / PII CLEANING (Avant suppression des parasites pour utiliser le contexte)
    // Emails
    cleaned = cleaned.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');

    // Numéros de téléphone (Format FR loose : 06 12 34 56 78, 06.12.34.56.78, 0612345678)
    cleaned = cleaned.replace(/(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}/g, '[TELEPHONE]');

    // Cartes Bancaires (16 chiffres, avec ou sans espaces)
    cleaned = cleaned.replace(/\b(?:\d[ -]*?){13,16}\b/g, '[CARTE_BANCAIRE]');

    // Sécurité Sociale (13 ou 15 chiffres)
    cleaned = cleaned.replace(/\b[12]\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{3}\s?\d{3}(?:\s?\d{2})?\b/g, '[SECU]');

    // Tentative de détection de noms propres après "je m'appelle" (avant lowerCase)
    // On cherche "Je m'appelle X Y"
    cleaned = cleaned.replace(/(je m['’]\s*appelle\s+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g, '$1[NOM]');
    cleaned = cleaned.replace(/(je suis\s+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)(?=\s+enchanté|\s+et toi|\s*,|\s*\.)/g, '$1[NOM]');

    // 1. Mise en minuscule pour le traitement
    // On gardera une version avec casse pour la fin si possible, mais le script python mettait tout en lower au début.
    // Pour respecter la logique python :
    cleaned = cleaned.toLowerCase();

    // 2. SUPPRIMER TOUTES LES EXPRESSIONS PARASITES
    const expressionsASupprimer = [
        // Expressions longues
        /\\ben quelque (sorte|manière)\\b/gi,
        /\\beuh\\b/gi,
        /\\bpour ainsi dire\\b/gi,
        /\\bplus ou moins\\b/gi,
        /\\bsi je puis dire\\b/gi,
        /\\bcomme qui dirait\\b/gi,
        /\\bje veux dire\\b/gi,
        /\\bje dirais?\\b/gi,
        /\\bcomment dire\\b/gi,
        /\\bc'?est[- ]à[- ]dire\\b/gi,
        /\\bde toute (façon|manière)\\b/gi,
        /\\bpour le coup\\b/gi,
        /\\bdu coup\\b/gi,
        /\\bau coup\\b/gi,

        // Expressions moyennes
        /\\bon va dire\\b/gi,
        /\\bsi vous voulez\\b/gi,
        /\\bsi tu veux\\b/gi,
        /\\btu (sais|vois)\\b/gi,
        /\\bvous (savez|voyez)\\b/gi,
        /\\ben (gros|fait|effet|réalité|tout cas|fin de compte)\\b/gi,
        /\\bpar (exemple|contre|hasard|ailleurs|conséquent|truc)\\b/gi,
        /\\bdisons que\\b/gi,
        /\\bje pense que\\b/gi,
        /\\bje crois que\\b/gi,

        // Expressions de remplissage
        /\\beh bien\\.?\\b/gi,
        /\\bet ben\\b/gi,
        /\\bet euh\\b/gi,
        /\\bet donc\\b/gi,
        /\\bet alors\\b/gi,
        /\\bet puis\\b/gi,
    ];

    expressionsASupprimer.forEach(expr => {
        cleaned = cleaned.replace(expr, ' ');
    });

    // 3. SUPPRIMER TOUS LES MOTS PARASITES SEULS
    const motsASupprimer = [
        // Hésitations
        /\\be+u+h+\\b/gi,
        /\\bh+u+m+\\b/gi,
        /\\bh+m+\\b/gi,
        /\\ba+h+\\b/gi,
        /\\bo+h+\\b/gi,
        /\\bb+a+h+\\b/gi,
        /\\bb+e+n+\\b/gi,
        /\\bh+e+i+n+\\b/gi,

        // Mots de liaison inutiles
        /\\bvoilà+\\b/gi,
        /\\bquoi+\\b/gi,
        /\\balors+\\b/gi,
        /\\bdonc+\\b/gi,
        /\\benfin+\\b/gi,
        /\\bbref+\\b/gi,
        /\\bpuis+\\b/gi,
        /\\bpis+\\b/gi,

        // Mots vagues
        /\\bmachin+\\b/gi,
        /\\btruc+\\b/gi,
        /\\bchose+\\b/gi,
        /\\bbidule+\\b/gi,

        // Interjections
        /\\blà+\\b/gi,
        /\\bhop+\\b/gi,
        /\\ballez+\\b/gi,
        /\\btiens+\\b/gi,
        /\\bdis+\\b/gi,
        /\\bécoute+\\b/gi,
        /\\bregarde+\\b/gi,

        // Autres
        /\\bgenre+\\b/gi,
        /\\bstyle+\\b/gi,
        /\\bcomme+\\b(?=\\s*[,.])/gi,
        /\\bbon+\\b(?=\\s*[,.])/gi,
    ];

    motsASupprimer.forEach(mot => {
        cleaned = cleaned.replace(mot, ' ');
    });

    // 4. NETTOYER LA PONCTUATION
    cleaned = cleaned.replace(/^\\s*[,;.]+\\s*/, ''); // Début de phrase
    cleaned = cleaned.replace(/\\s*[,.]\\s*[,.]/g, '.'); // Doubles ponctuations
    cleaned = cleaned.replace(/\\.{2,}/g, '.');
    cleaned = cleaned.replace(/,{2,}/g, ',');
    cleaned = cleaned.replace(/\\s+([,.;!?])/g, '$1'); // Espace avant ponctuation
    cleaned = cleaned.replace(/([,.;!?])(?=[^\\s])/g, '$1 '); // Espace après ponctuation
    cleaned = cleaned.replace(/\\.\\s*,/g, ','); // ". ," -> ","
    cleaned = cleaned.replace(/,\\s*\\./g, '.'); // ", ." -> "."

    // 5. NETTOYER LES ESPACES
    cleaned = cleaned.replace(/\\s+/g, ' ');
    cleaned = cleaned.trim();
    cleaned = cleaned.replace(/\\s+-\\s+/g, ' ');

    // 6. CORRECTIONS GRAMMATICALES
    const corrections: { [key: string]: string } = {
        "sais pas": "ne sais pas",
        "j'?ai pas": "je n'ai pas",
        "c'?est pas": "ce n'est pas",
        "y'?a": "il y a",
        "parceque": "parce que",
    };

    // Note: JS regex key iteration is a bit strict, we used simple strings above for keys
    // We need to construct RegExp from them
    Object.keys(corrections).forEach(pattern => {
        const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
        cleaned = cleaned.replace(regex, corrections[pattern]);
    });

    // Cas spécial 'puisque '
    cleaned = cleaned.replace(/\\bpuisque\\b(?=\\s)/gi, 'puisque ');


    // 7. CAPITALISATION INTELLIGENTE
    if (cleaned.length > 0) {
        // Première lettre majuscule
        cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);

        // Majuscule après point
        cleaned = cleaned.replace(/(\.\s+)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());

        // Majuscule après point d'exclamation/interrogation
        cleaned = cleaned.replace(/([!?]\s+)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());
    }

    // 8. TERMINER PAR UN POINT
    if (cleaned.length > 0 && !/[.!?]$/.test(cleaned)) {
        cleaned += '.';
    }

    // 9. NETTOYER LES VIRGULES EN DÉBUT DE PHRASE (Post-traitement)
    cleaned = cleaned.replace(/\.\s*,/g, '.');
    cleaned = cleaned.replace(/^,\s*/g, '');

    // 10. SUPPRIMER PHRASES VIDES
    cleaned = cleaned.replace(/\s*[,.;]+\s*\./g, '.');
    cleaned = cleaned.replace(/\.\s*\./g, '.');

    return cleaned;
};
