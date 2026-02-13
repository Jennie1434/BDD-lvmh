import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { processTranscriptionPipeline } from '@/utils/transcriptionCleaner';

interface ProcessedTranscription {
  id: string;
  original_text: string;
  cleaned_text: string;
  client_name?: string;
  client_email?: string;
  is_rgpd_compliant: boolean;
  violations_detected: string[];
  processing_status: string;
  updated_at: string;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: {
    processed_count: number;
    skipped_count: number;
    results: ProcessedTranscription[];
  };
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  // Accepter GET et POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    // Récupérer les transcriptions non traitées
    const { data: transcriptions, error: fetchError } = await supabase
      .from('transcriptions')
      .select('*')
      .eq('is_processed', false)
      .limit(100);

    if (fetchError) {
      console.error('Erreur lors de la récupération:', fetchError);
      return res.status(500).json({
        success: false,
        error: `Erreur lors de la récupération: ${fetchError.message}`,
      });
    }

    if (!transcriptions || transcriptions.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Aucune transcription à traiter',
        data: {
          processed_count: 0,
          skipped_count: 0,
          results: [],
        },
      });
    }

    const results: ProcessedTranscription[] = [];

    // Traiter chaque transcription
    for (const transcription of transcriptions) {
      try {
        const rawText = transcription.text || transcription.raw_text || '';
        
        // Pipeline de nettoyage
        const cleaned = processTranscriptionPipeline(rawText);

        // Insérer dans cleaned_transcriptions
        const { error: insertError } = await supabase
          .from('cleaned_transcriptions')
          .insert({
            transcription_id: transcription.id,
            raw_text: cleaned.original,
            cleaned_text: cleaned.finalCleaned,
            client_name: transcription.client_name,
            client_email: transcription.client_email,
            is_rgpd_compliant: cleaned.isRGPDCompliant,
            violations_detected: cleaned.violationsDetected,
            processing_status: 'completed',
          });

        if (insertError) {
          console.error(`Erreur pour transcription ${transcription.id}:`, insertError);
          continue;
        }

        // Marquer comme traitée dans la table d'origine
        await supabase
          .from('transcriptions')
          .update({
            is_processed: true,
            status: 'processed',
          })
          .eq('id', transcription.id);

        results.push({
          id: transcription.id,
          original_text: cleaned.original,
          cleaned_text: cleaned.finalCleaned,
          client_name: transcription.client_name,
          client_email: transcription.client_email,
          is_rgpd_compliant: cleaned.isRGPDCompliant,
          violations_detected: cleaned.violationsDetected,
          processing_status: 'completed',
          updated_at: new Date().toISOString(),
        });
      } catch (error) {
        console.error(`Erreur lors du traitement de ${transcription.id}:`, error);
        continue;
      }
    }

    return res.status(200).json({
      success: true,
      message: `${results.length} transcription(s) traitée(s) avec succès`,
      data: {
        processed_count: results.length,
        skipped_count: transcriptions.length - results.length,
        results,
      },
    });
  } catch (error) {
    console.error('Erreur serveur:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur inconnue',
    });
  }
}
