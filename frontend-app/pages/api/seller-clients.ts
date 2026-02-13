import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

interface ClientData {
  id: string;
  full_name: string;
  estimated_budget?: number;
  last_interaction_at?: string;
  next_contact_at?: string;
  dominant_emotion?: string;
  purchase_probability?: number;
  intent_score?: number;
  analysis?: any;
}

interface ApiResponse {
  success: boolean;
  data?: {
    clients: ClientData[];
    total_count: number;
  };
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const { sellerId } = req.query;

    if (!sellerId || typeof sellerId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'sellerId parameter is required',
      });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !anonKey) {
      return res.status(500).json({
        success: false,
        error: 'Supabase anon key is missing on server.',
      });
    }

    const supabase = createClient(supabaseUrl, anonKey);

    // Récupérer les client_assignments actifs pour ce vendeur
    const { data: assignments, error: assignmentError } = await supabase
      .from('client_assignments')
      .select('client_id')
      .eq('seller_id', sellerId)
      .eq('active', true)
      .limit(100);

    if (assignmentError) {
      console.error(`Erreur récupération assignments:`, assignmentError);
      return res.status(500).json({
        success: false,
        error: assignmentError.message,
      });
    }

    const clientIds = (assignments || []).map(a => a.client_id);

    if (clientIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          clients: [],
          total_count: 0,
        },
      });
    }

    // Récupérer les données des clients
    const baseSelect = 'id, full_name, estimated_budget, last_interaction_at, dominant_emotion, purchase_probability, intent_score, analysis';
    const selectWithNext = `${baseSelect}, next_contact_at`;

    let clientsData: ClientData[] | null = null;
    let clientsError: { message?: string } | null = null;

    const withNextResponse = await supabase
      .from('clients')
      .select(selectWithNext)
      .in('id', clientIds)
      .order('last_interaction_at', { ascending: false })
      .limit(100);

    clientsData = withNextResponse.data as ClientData[] | null;
    clientsError = withNextResponse.error as { message?: string } | null;

    if (clientsError?.message && clientsError.message.includes('next_contact_at')) {
      const fallbackResponse = await supabase
        .from('clients')
        .select(baseSelect)
        .in('id', clientIds)
        .order('last_interaction_at', { ascending: false })
        .limit(100);

      clientsData = fallbackResponse.data as ClientData[] | null;
      clientsError = fallbackResponse.error as { message?: string } | null;
    }

    if (clientsError) {
      console.error('Erreur récupération clients:', clientsError);
      return res.status(500).json({
        success: false,
        error: clientsError.message || 'Erreur récupération clients',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        clients: clientsData || [],
        total_count: (clientsData || []).length,
      },
    });
  } catch (error) {
    console.error('Erreur serveur:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur',
    });
  }
}
