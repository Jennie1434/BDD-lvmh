import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

interface StatsResponse {
  success: boolean;
  total_transcriptions: number;
  processed_count: number;
  pending_count: number;
  rgpd_compliant_count: number;
  rgpd_non_compliant_count: number;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StatsResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      total_transcriptions: 0,
      processed_count: 0,
      pending_count: 0,
      rgpd_compliant_count: 0,
      rgpd_non_compliant_count: 0,
      error: 'Method not allowed',
    });
  }

  try {
    // Récupérer le nombre de transcriptions brutes
    const { count: totalTranscriptions } = await supabase
      .from('transcriptions')
      .select('*', { count: 'exact', head: true });

    // Récupérer le nombre de transcriptions traitées
    const { count: processedCount } = await supabase
      .from('cleaned_transcriptions')
      .select('*', { count: 'exact', head: true });

    // Récupérer le nombre en attente
    const { count: pendingCount } = await supabase
      .from('transcriptions')
      .select('*', { count: 'exact', head: true })
      .is('is_processed', false);

    // Récupérer le nombre conformes RGPD
    const { count: rgpdCompliant } = await supabase
      .from('cleaned_transcriptions')
      .select('*', { count: 'exact', head: true })
      .eq('is_rgpd_compliant', true);

    // Récupérer le nombre non conformes RGPD
    const { count: rgpdNonCompliant } = await supabase
      .from('cleaned_transcriptions')
      .select('*', { count: 'exact', head: true })
      .eq('is_rgpd_compliant', false);

    return res.status(200).json({
      success: true,
      total_transcriptions: totalTranscriptions || 0,
      processed_count: processedCount || 0,
      pending_count: pendingCount || 0,
      rgpd_compliant_count: rgpdCompliant || 0,
      rgpd_non_compliant_count: rgpdNonCompliant || 0,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des stats:', error);
    return res.status(500).json({
      success: false,
      total_transcriptions: 0,
      processed_count: 0,
      pending_count: 0,
      rgpd_compliant_count: 0,
      rgpd_non_compliant_count: 0,
      error: error instanceof Error ? error.message : 'Erreur serveur',
    });
  }
}
