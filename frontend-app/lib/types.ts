export type Role = 'vendeur' | 'manager' | 'siege';

export interface UserProfile {
    id: string;
    email: string;
    role: Role;
    first_name: string;
    last_name: string;
    shop_id?: string;
}

export interface Client {
    id: string;
    full_name?: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    assigned_to: string; // seller_id
    total_spent: number;
    last_interaction_date: string;
    next_contact_at?: string | null;
    tags: string[];
    analysis?: AnalysisResult | null;
}

export interface ClientTwin {
    client_id: string;
    life_moments: string[];
    preferences: string[];
    purchase_probability: number; // 0-100
    next_best_action: string;
    top_product_categories: string[];
    emotion_trend: 'happy' | 'neutral' | 'frustrated';
}

export interface Interaction {
    id: string;
    client_id: string;
    seller_id: string;
    date: string;
    type: 'voice' | 'email' | 'meeting';
    transcription?: string;
    summary?: string;
    intent_score: number;
    ai_analysis?: AnalysisResult;
}

export interface AnalysisResult {
    type_client: 'Nouveau' | 'Fidèle' | 'VIP' | 'Dormant';
    phase: 'Découverte' | 'Essayage' | 'Objection' | 'Closing' | 'SAV';
    intention: 'Achat' | 'Renseignement' | 'Cadeau' | 'Plainte';
    produits: string[];
    budget: 'Non précisé' | '1k-5k' | '5k-20k' | '20k+';
    timing: 'Immédiat' | 'Cette semaine' | 'Mois prochain' | 'Indéfini';
    emotion: 'Joie' | 'Hésitation' | 'Colère' | 'Neutre';
    intent_score: number;
    taxonomy_path?: string;
    taxonomy_paths?: string[];
    tags?: string[];
    next_contact_at?: string | null;
}

export interface BatchItem {
    id: string;
    text: string;
    status: 'pending' | 'analyzing' | 'done' | 'error';
    result?: AnalysisResult;
}
