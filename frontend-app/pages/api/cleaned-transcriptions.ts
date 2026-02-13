import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

interface CleanedTranscription {
  id: string;
  transcription_id: string;
  raw_text: string;
  cleaned_text: string;
  after_parasites_removal: string;
  client_name?: string;
  client_email?: string;
  is_rgpd_compliant: boolean;
  violations_detected: string;
  processing_status: string;
  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  success: boolean;
  data?: CleanedTranscription[];
  count?: number;
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
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    const rgpdCompliant = req.query.rgpd_compliant;

    let query = supabase
      .from('cleaned_transcriptions')
      .select('*');

    // Filtrer par conformité RGPD si demandé
    if (rgpdCompliant === 'true') {
      query = query.eq('is_rgpd_compliant', true);
    } else if (rgpdCompliant === 'false') {
      query = query.eq('is_rgpd_compliant', false);
    }

    // Appliquer la pagination
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Erreur lors de la récupération:', error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      data: data || [],
      count: count || 0,
    });
  } catch (error) {
    console.error('Erreur serveur:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur',
    });
  }
}
