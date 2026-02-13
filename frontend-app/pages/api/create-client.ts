import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

type CreateClientBody = {
    full_name: string;
    estimated_budget?: number;
    last_interaction_at?: string;
    dominant_emotion?: string;
    purchase_probability?: number;
    intent_score?: number;
    seller_id?: string;
    analysis?: any;
    next_contact_at?: string;
};

type ApiResponse =
    | { success: true; client_id: string }
    | { success: false; error: string };

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ApiResponse>
) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    if (!supabaseUrl || !anonKey) {
        return res.status(500).json({
            success: false,
            error: 'Supabase configuration is missing on server.'
        });
    }

    const body = req.body as CreateClientBody;

    if (!body?.full_name) {
        return res.status(400).json({ success: false, error: 'full_name is required' });
    }

    const supabase = createClient(supabaseUrl, anonKey);
    const nextContactAt = body.next_contact_at || body.analysis?.next_contact_at || null;

    try {
        const { data: existingClient, error: existingError } = await supabase
            .from('clients')
            .select('id')
            .eq('full_name', body.full_name)
            .maybeSingle();

        if (existingError) {
            return res.status(500).json({ success: false, error: existingError.message });
        }

        let clientId = existingClient?.id || '';

        if (!clientId) {
            const { data: createdClient, error: createError } = await supabase
                .from('clients')
                .insert({
                    full_name: body.full_name,
                    estimated_budget: body.estimated_budget || 0,
                    last_interaction_at: body.last_interaction_at || new Date().toISOString(),
                    dominant_emotion: body.dominant_emotion,
                    purchase_probability: body.purchase_probability,
                    intent_score: body.intent_score,
                    analysis: body.analysis || null,
                    next_contact_at: nextContactAt
                })
                .select('id')
                .single();

            if (createError) {
                return res.status(500).json({ success: false, error: createError.message });
            }

            clientId = createdClient?.id || '';
        } else if (body.analysis || body.next_contact_at) {
            const { error: updateError } = await supabase
                .from('clients')
                .update({
                    analysis: body.analysis || null,
                    next_contact_at: nextContactAt
                })
                .eq('id', clientId);

            if (updateError) {
                console.error('Failed to update client analysis:', updateError);
            }
        }

        if (body.seller_id && clientId) {
            const { error: assignmentError } = await supabase
                .from('client_assignments')
                .insert(
                    { client_id: clientId, seller_id: body.seller_id, active: true }
                );

            if (assignmentError) {
                console.error('Assignment error:', assignmentError);
                // Ne pas retourner d'erreur, l'assignation est facultative
            }
        }

        return res.status(200).json({ success: true, client_id: clientId });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal Server Error'
        });
    }
}
