import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

interface SellerData {
  id: string;
  full_name: string;
  email: string;
  role: string;
  expertise?: string;
  location?: string;
  phone?: string;
}

interface ApiResponse {
  success: boolean;
  data?: SellerData;
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
    const { sellerId, email } = req.query;

    if ((!sellerId || typeof sellerId !== 'string') && (!email || typeof email !== 'string')) {
      return res.status(400).json({
        success: false,
        error: 'sellerId or email parameter is required',
      });
    }

    const sellerQuery = supabase.from('sellers').select('*');
    const { data: seller, error } = await (email && typeof email === 'string'
      ? sellerQuery.ilike('email', email).single()
      : sellerQuery.eq('id', sellerId as string).single());

    if (error) {
      console.error('Erreur récupération seller:', error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    if (!seller) {
      return res.status(404).json({
        success: false,
        error: 'Seller not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: seller.id,
        full_name: seller.full_name || '',
        email: seller.email || '',
        role: seller.role || 'seller',
        expertise: seller.expertise,
        location: seller.location,
        phone: seller.phone,
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
