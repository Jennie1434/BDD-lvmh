import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

type AnalysisResponse = {
    intention: string;
    phase: string;
    produits: string[];
    budget: string;
    emotion: string;
    timing: string;
    type_client: string;
    intent_score: number;
    taxonomy_path: string;
    taxonomy_paths: string[];
    tags: string[];
    next_contact_at?: string | null;
} | { error: string };

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<AnalysisResponse>
) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
        console.error("OPENAI_API_KEY is not defined");
        return res.status(500).json({ error: 'OpenAI API Key is missing on server.' });
    }

    try {
        const referenceDate = new Date().toISOString().slice(0, 10);
        const prompt = `
        Tu es un assistant expert pour la division "Fashion Leather Goods" de LVMH. Analyse la transcription suivante.
        Sois deterministe: pour un meme texte, donne toujours la meme reponse.
        Extraction au format JSON strict (sans markdown).
        
        Ta mission est de classifier selon la taxonomie client spécifique :
        
        1. **PRODUITS** (Arbre décisionnel) :
           - Maroquinerie (Sacs, Petite maroquinerie, Ceintures)
           - Prêt-à-Porter (Vestes, Robes, Pantalons, Jupes)
           - Chaussures (Escarpins, Bottines, Sneakers)
           - Accessoires (Foulards, Chapeaux, Lunettes)

        2. **PROFIL CLIENT** :
           - Type: "Acheteur", "Prospect"
           - Phase: "Découverte", "Essayage", "Objection", "Closing"
           - Intention: "Achat immédiat", "Cadeau", "Exploration", "Retour SAV", "Inspiration"
        
        3. **SIGNAUX BUSINESS** (Tags) :
           - Budget: "<1000€", "1000-5000€", ">5000€". IMPORTANT: Si aucun montant précis n'est mentionné, mettre "Non précisé".
           - Timing: "Immédiat", "<1 mois", "1-3 mois"
           - Émotion: "Enthousiaste", "Neutre", "Hésitant", "Frustré"

          4. **DATE DE RECONTACT** :
              - Extrait la date exacte de recontact depuis la transcription (souvent en fin de texte).
              - Si une date explicite est mentionnee, utilise-la.
              - Si une date relative est mentionnee (ex: "dans une semaine", "dans 3 mois"), calcule la date exacte.
              - Si un mois est mentionne sans jour (ex: "fin mars"), utilise le dernier jour du mois.
              - Si le jour est implicite (ex: "mi-mars"), utilise le 15 du mois.
              - Si le mois est passe par rapport a la date de reference, utilise l'annee suivante.
              - Date de reference (YYYY-MM-DD) : ${referenceDate}
              - Retourne la date au format ISO (YYYY-MM-DD) ou null si aucune date ne peut etre determinee.

        REGLES IMPORTANTES :
        - Si plusieurs produits sont cites (ex: portefeuille + sac weekend), retourne plusieurs chemins dans taxonomy_paths.
        - Sois precis: prefere la sous-categorie specifique (ex: "Accessoires > Portefeuilles") et n'ajoute pas la categorie parente si elle n'apporte rien.
        - taxonomy_path doit etre le premier element de taxonomy_paths.

        SORTIE JSON ATTENDUE :
        {
            "intention": string (ex: "Achat immédiat"),
            "phase": string (ex: "Essayage"),
            "produits": string[] (ex: ["Sac Capucines", "Escarpins"]),
            "budget": string (ex: ">5000€" ou "Non précisé"),
            "emotion": string (ex: "Enthousiaste"),
            "timing": string (ex: "Immédiat"),
            "type_client": string (ex: "Acheteur"),
            "intent_score": number (0-100),
            "taxonomy_paths": string[] (Format: ["Maroquinerie > Sacs > Sacs de weekend", "Accessoires > Portefeuilles"]),
            "taxonomy_path": string (Doit etre le premier element de taxonomy_paths),
            "tags": string[] (Combinaison des signaux detectes + Profil, ex: [">5000€", "Enthousiaste", "Achat immediat", "Recontact: 2026-02-20"]),
            "next_contact_at": string | null (Format: YYYY-MM-DD)
        }

        Transcription : "${text}"
        `;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "Tu es une API JSON qui retourne uniquement du JSON valide." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0,
        });

        const content = completion.choices[0].message.content;

        if (!content) {
            throw new Error("No content received from OpenAI");
        }

        const analysis = JSON.parse(content);
        return res.status(200).json(analysis);

    } catch (error: any) {
        console.error('Error in analyze API:', error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
