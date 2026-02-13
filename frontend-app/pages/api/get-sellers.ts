import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

interface ClientData {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  estimated_budget?: number;
  tags?: string[];
  last_interaction_at?: string;
}

interface SellersData {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  role: string;
  clients: ClientData[];
}

interface ApiResponse {
  success: boolean;
  data?: {
    sellers: SellersData[];
    total_sellers: number;
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
    // Récupérer tous les vendeurs (sellers table)
    const { data: sellers, error: sellerError } = await supabase
      .from('sellers')
      .select('*')
      .limit(100);

    if (sellerError) {
      console.error('Erreur récupération sellers:', sellerError);
      return res.status(500).json({
        success: false,
        error: sellerError.message,
      });
    }

    if (!sellers || sellers.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          sellers: [],
          total_sellers: 0,
        },
      });
    }

    // Pour chaque vendeur, récupérer ses clients via client_assignments
    const sellersWithClients: SellersData[] = [];

    for (const seller of sellers) {
      // Récupérer les client_assignments actifs pour ce vendeur
      const { data: assignments, error: assignmentError } = await supabase
        .from('client_assignments')
        .select('client_id')
        .eq('seller_id', seller.id)
        .eq('active', true)
        .limit(100);

      if (assignmentError) {
        console.error(`Erreur récupération assignments pour ${seller.id}:`, assignmentError);
        continue;
      }

      // Pour chaque client assigné, récupérer les données du client
      const clientIds = (assignments || []).map(a => a.client_id);
      let clients: ClientData[] = [];

      if (clientIds.length > 0) {
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('id, full_name, estimated_budget, last_interaction_at')
          .in('id', clientIds)
          .limit(100);

        if (!clientsError && clientsData) {
          clients = clientsData.map(c => ({
            id: c.id,
            full_name: c.full_name,
            estimated_budget: c.estimated_budget,
            last_interaction_at: c.last_interaction_at,
          })) as ClientData[];
        }
      }

      sellersWithClients.push({
        id: seller.id,
        email: seller.email || '',
        full_name: seller.full_name || '',
        first_name: seller.first_name || '',
        last_name: seller.last_name || '',
        role: seller.role || 'seller',
        clients,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        sellers: sellersWithClients,
        total_sellers: sellersWithClients.length,
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
