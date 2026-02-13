import { AnalysisResult } from '../lib/types';

export async function analyzeTranscription(text: string): Promise<AnalysisResult> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const lowerText = text.toLowerCase();

    // Heuristic Analysis (Mocking the python pipeline)

    // 1. Intention
    let intention: AnalysisResult['intention'] = 'Renseignement';
    if (/achat|prendre|commander|réserver|veux/.test(lowerText)) intention = 'Achat';
    if (/cadeau|offrir/.test(lowerText)) intention = 'Cadeau';
    if (/problème|cassé|réparer|déçu/.test(lowerText)) intention = 'Plainte';

    // 2. Phase
    let phase: AnalysisResult['phase'] = 'Découverte';
    if (/essayer|taille|porté/.test(lowerText)) phase = 'Essayage';
    if (/prix|coûte|cher/.test(lowerText)) phase = 'Objection';
    if (/prends|carte|payer/.test(lowerText)) phase = 'Closing';
    if (intention === 'Plainte') phase = 'SAV';

    // 3. Produits (Simple keyword extraction)
    const produits: string[] = [];
    if (/capucines/.test(lowerText)) produits.push('Capucines');
    if (/speedy/.test(lowerText)) produits.push('Speedy');
    if (/neverfull/.test(lowerText)) produits.push('Neverfull');
    if (/malle/.test(lowerText)) produits.push('Malle Courrier');
    if (/montre|tambour/.test(lowerText)) produits.push('Montre Tambour');

    // 4. Budget
    let budget: AnalysisResult['budget'] = 'Non précisé';
    if (/\d{3,4}/.test(lowerText)) { // Crude number detection
        const amount = parseInt(lowerText.match(/\d+/)?.[0] || '0');
        if (amount > 1000 && amount < 5000) budget = '1k-5k';
        if (amount >= 5000 && amount < 20000) budget = '5k-20k';
        if (amount >= 20000) budget = '20k+';
    }
    if (/illimité/.test(lowerText)) budget = '20k+';

    // 5. Emotion
    let emotion: AnalysisResult['emotion'] = 'Neutre';
    if (/adore|magnifique|superbe|aime/.test(lowerText)) emotion = 'Joie';
    if (/hésite|sais pas|doute/.test(lowerText)) emotion = 'Hésitation';
    if (/colère|inacceptable/.test(lowerText)) emotion = 'Colère';

    // 6. Timing
    let timing: AnalysisResult['timing'] = 'Indéfini';
    if (/maintenant|aujourd'hui|suite/.test(lowerText)) timing = 'Immédiat';
    if (/semaine/.test(lowerText)) timing = 'Cette semaine';

    // 7. Client Type (Mock)
    const type_client: AnalysisResult['type_client'] = 'VIP';

    // Score Calculation
    let intent_score = 50;
    if (intention === 'Achat') intent_score += 30;
    if (phase === 'Closing') intent_score += 15;
    if (emotion === 'Joie') intent_score += 5;
    if (budget === '20k+') intent_score += 10;
    if (budget === '5k-20k') intent_score += 5;

    return {
        type_client,
        phase,
        intention,
        produits,
        budget,
        timing,
        emotion,
        intent_score: Math.min(intent_score, 100)
    };
}
