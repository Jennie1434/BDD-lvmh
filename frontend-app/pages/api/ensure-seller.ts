import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

interface ApiResponse {
  success: boolean;
  data?: {
    id: string;
    email: string;
  };
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const { userId, email } = req.body || {};

    if (!userId || typeof userId !== 'string' || !email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'userId and email are required',
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

    const { data: existingById, error: existingByIdError } = await supabase
      .from('sellers')
      .select('id, email')
      .eq('id', userId)
      .maybeSingle();

    if (existingByIdError) {
      return res.status(500).json({
        success: false,
        error: existingByIdError.message,
      });
    }

    if (existingById) {
      return res.status(200).json({
        success: true,
        data: {
          id: existingById.id,
          email: existingById.email,
        },
      });
    }

    const { data: existingByEmail, error: existingByEmailError } = await supabase
      .from('sellers')
      .select('id, email')
      .ilike('email', email)
      .maybeSingle();

    if (existingByEmailError) {
      return res.status(500).json({
        success: false,
        error: existingByEmailError.message,
      });
    }

    if (existingByEmail) {
      const { error: updateError } = await supabase
        .from('sellers')
        .update({ id: userId })
        .eq('id', existingByEmail.id);

      if (updateError) {
        return res.status(500).json({
          success: false,
          error: updateError.message,
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          id: userId,
          email: existingByEmail.email,
        },
      });
    }

    const emailPrefix = email.split('@')[0] || 'Vendeur';
    const fullName = emailPrefix.replace(/\./g, ' ');

    const { data: houseRow, error: houseError } = await supabase
      .from('sellers')
      .select('house_id')
      .not('house_id', 'is', null)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (houseError) {
      return res.status(500).json({
        success: false,
        error: houseError.message,
      });
    }

    if (!houseRow?.house_id) {
      return res.status(500).json({
        success: false,
        error: 'No house_id available to create seller.',
      });
    }

    const { data: inserted, error: insertError } = await supabase
      .from('sellers')
      .insert({
        id: userId,
        house_id: houseRow.house_id,
        email,
        full_name: fullName,
        role: 'vendeur',
        expertise: 'Expert',
        location: 'LVMH',
        status: 'active',
      })
      .select('id, email')
      .single();

    if (insertError || !inserted) {
      return res.status(500).json({
        success: false,
        error: insertError?.message || 'Failed to create seller.',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: inserted.id,
        email: inserted.email,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur',
    });
  }
}
