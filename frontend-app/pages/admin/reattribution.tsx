import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { ArrowRight, Sparkles, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/layout/AdminLayout';

type SellerStatus = 'active' | 'inactive';
type ClientTemperature = 'HOT' | 'WARM' | 'COLD';

interface Client {
  id: string;
  full_name: string;
  intent_score: number | null;
  temperature: ClientTemperature | null;
  estimated_budget: number | null;
  last_interaction_at: string | null;
}

interface Seller {
  id: string;
  full_name: string;
  status: SellerStatus;
}

interface Assignment {
  id: string;
  client_id: string;
  seller_id: string;
  active: boolean;
  assigned_at: string | null;
}

export default function Reattribution() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [targetSeller, setTargetSeller] = useState('');
  const [actionBusy, setActionBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError('');

      const [
        { data: sellersData, error: sellersError },
        { data: clientsData, error: clientsError },
        { data: assignmentsData, error: assignmentsError }
      ] = await Promise.all([
        supabase.from('sellers').select('id,full_name,status').order('created_at', { ascending: true }),
        supabase.from('clients').select('id,full_name,intent_score,temperature,estimated_budget,last_interaction_at'),
        supabase.from('client_assignments').select('id,client_id,seller_id,active,assigned_at')
      ]);

      if (!alive) return;
      if (sellersError || clientsError || assignmentsError) {
        setError('Impossible de charger les donnees de reattribution.');
        setLoading(false);
        return;
      }

      setSellers(sellersData || []);
      setClients(clientsData || []);
      setAssignments(assignmentsData || []);
      setLoading(false);
    };

    load();
    return () => {
      alive = false;
    };
  }, []);

  const toggleSelect = (id: string) => {
    if (selectedClients.includes(id)) {
      setSelectedClients(selectedClients.filter((clientId) => clientId !== id));
      return;
    }
    setSelectedClients([...selectedClients, id]);
  };

  const activeAssignments = useMemo(() => assignments.filter((assignment) => assignment.active), [assignments]);

  const activeSellerMap = useMemo(() => {
    const map = new Map<string, string>();
    activeAssignments.forEach((assignment) => map.set(assignment.client_id, assignment.seller_id));
    return map;
  }, [activeAssignments]);

  const sellerMap = useMemo(() => {
    const map = new Map<string, Seller>();
    sellers.forEach((seller) => map.set(seller.id, seller));
    return map;
  }, [sellers]);

  const sellerLoads = useMemo(() => {
    const loads = new Map<string, number>();
    sellers.forEach((seller) => loads.set(seller.id, 0));
    activeAssignments.forEach((assignment) => {
      loads.set(assignment.seller_id, (loads.get(assignment.seller_id) || 0) + 1);
    });
    return loads;
  }, [sellers, activeAssignments]);

  const unassignedClients = useMemo(() => {
    return clients.filter((client) => !activeSellerMap.get(client.id));
  }, [clients, activeSellerMap]);

  const suggestionForClient = (clientId: string) => {
    const activeSellers = sellers.filter((seller) => seller.status === 'active');
    if (!activeSellers.length) return null;
    const sorted = [...activeSellers].sort((a, b) => (sellerLoads.get(a.id) || 0) - (sellerLoads.get(b.id) || 0));
    return sorted[0];
  };

  const handleReassign = async () => {
    if (!targetSeller || selectedClients.length === 0) return;
    setActionBusy(true);
    setError('');

    for (const clientId of selectedClients) {
      const previousSellerId = activeSellerMap.get(clientId) || null;

      await supabase
        .from('client_assignments')
        .update({ active: false })
        .eq('client_id', clientId)
        .eq('active', true);

      const { error: insertError } = await supabase.from('client_assignments').insert({
        client_id: clientId,
        seller_id: targetSeller,
        active: true
      });

      if (insertError) {
        setError('Reattribution impossible (RLS ou donnees).');
        setActionBusy(false);
        return;
      }

      await supabase.from('reassignment_events').insert({
        client_id: clientId,
        from_seller_id: previousSellerId,
        to_seller_id: targetSeller,
        reason: 'manual_reassignment'
      });
    }

    setSelectedClients([]);
    setTargetSeller('');
    setActionBusy(false);
  };

  return (
    <AdminLayout>
      <Head>
        <title>Reattribution - LVMH</title>
      </Head>
      <div className="reattribution-page">
        <div className="seller-header">
          <div>
            <p className="admin-eyebrow">Manager Console</p>
            <h1 className="admin-title">Clients a reassigner</h1>
            <p className="admin-subtitle">Reattribution manuelle avec suggestion IA.</p>
          </div>
        </div>

        {error && (
          <div className="alert-card" style={{ marginTop: '1rem' }}>
            <div className="alert-top">
              <p>Erreur</p>
              <span>Action requise</span>
            </div>
            <p className="alert-detail">{error}</p>
          </div>
        )}

        <div className="reattribution-grid">
          <section className="panel reassign-table">
            <div className="panel-header">
              <h2>Clients en attente</h2>
              <span>{unassignedClients.length} clients</span>
            </div>
            <div className="table-wrap">
              <table className="seller-table-inner">
                <thead>
                  <tr>
                    <th></th>
                    <th>Client</th>
                    <th>Ancien vendeur</th>
                    <th>Intent</th>
                    <th>Temperature</th>
                    <th>Budget</th>
                    <th>Dernier contact</th>
                    <th>Suggestion IA</th>
                  </tr>
                </thead>
                <tbody>
                  {unassignedClients.map((client) => {
                    const suggestion = suggestionForClient(client.id);
                    const last = client.last_interaction_at
                      ? new Date(client.last_interaction_at).toLocaleDateString()
                      : '—';
                    return (
                      <tr
                        key={client.id}
                        onClick={() => toggleSelect(client.id)}
                        className={selectedClients.includes(client.id) ? 'active' : ''}
                      >
                        <td>
                          <div className={`checkbox ${selectedClients.includes(client.id) ? 'checked' : ''}`} />
                        </td>
                        <td>{client.full_name}</td>
                        <td>{sellerMap.get(activeSellerMap.get(client.id) || '')?.full_name || '—'}</td>
                        <td>{client.intent_score ?? '—'}</td>
                        <td>{client.temperature ?? '—'}</td>
                        <td>{client.estimated_budget ? `EUR ${client.estimated_budget}` : '—'}</td>
                        <td>{last}</td>
                        <td>
                          <span className="ai-pill">
                            <Sparkles size={12} />
                            {suggestion ? suggestion.full_name : 'Aucune'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {!loading && unassignedClients.length === 0 && (
                    <tr>
                      <td colSpan={8} className="empty-state">
                        Aucun client a reassigner.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {loading && <div className="table-loading">Chargement...</div>}
            </div>
          </section>

          <section className="panel reassign-action">
            <div className="panel-header">
              <h2>Reattribution</h2>
              <span>Batch</span>
            </div>
            <div className="action-box">
              <div className="action-row">
                <div>
                  <p>Clients selectionnes</p>
                  <strong>{selectedClients.length}</strong>
                </div>
                <ArrowRight size={18} />
                <div>
                  <p>Vendeur cible</p>
                  <strong>{targetSeller ? sellerMap.get(targetSeller)?.full_name : '—'}</strong>
                </div>
              </div>
              <label>
                Nouveau vendeur
                <select value={targetSeller} onChange={(event) => setTargetSeller(event.target.value)}>
                  <option value="">Selectionner un vendeur...</option>
                  {sellers.filter((seller) => seller.status === 'active').map((seller) => (
                    <option key={seller.id} value={seller.id}>{seller.full_name}</option>
                  ))}
                </select>
              </label>
              <button
                className="btn btn-gold"
                onClick={handleReassign}
                disabled={!targetSeller || selectedClients.length === 0 || actionBusy}
              >
                {actionBusy ? 'Reattribution...' : 'Confirmer le transfert'}
              </button>
              <div className="action-hint">
                <Users size={16} />
                <span>Le vendeur recoit automatiquement une notification.</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}
