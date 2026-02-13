import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Sparkles, Users } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function Reattribution() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [clients, setClients] = useState([]);
    const [sellers, setSellers] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [selectedClients, setSelectedClients] = useState([]);
    const [targetSeller, setTargetSeller] = useState('');
    const [actionBusy, setActionBusy] = useState(false);

    useEffect(() => {
        let alive = true;
        const load = async () => {
            setLoading(true);
            setError('');

            const [{ data: sellersData, error: sellersError }, { data: clientsData, error: clientsError }, { data: assignmentsData, error: assignmentsError }] =
                await Promise.all([
                    supabase.from('sellers').select('id,full_name,status').order('created_at', { ascending: true }),
                    supabase.from('clients').select('id,full_name,intent_score,temperature,estimated_budget,last_interaction_at'),
                    supabase.from('client_assignments').select('id,client_id,seller_id,active,assigned_at'),
                ]);

            if (!alive) return;
            if (sellersError || clientsError || assignmentsError) {
                setError('Impossible de charger les données de réattribution.');
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

    const toggleSelect = (id) => {
        if (selectedClients.includes(id)) {
            setSelectedClients(selectedClients.filter((c) => c !== id));
            return;
        }
        setSelectedClients([...selectedClients, id]);
    };

    const activeAssignments = useMemo(() => assignments.filter((a) => a.active), [assignments]);

    const activeSellerMap = useMemo(() => {
        const map = new Map();
        activeAssignments.forEach((a) => map.set(a.client_id, a.seller_id));
        return map;
    }, [activeAssignments]);

    const sellerMap = useMemo(() => {
        const map = new Map();
        sellers.forEach((s) => map.set(s.id, s));
        return map;
    }, [sellers]);

    const sellerLoads = useMemo(() => {
        const loads = new Map();
        sellers.forEach((s) => loads.set(s.id, 0));
        activeAssignments.forEach((a) => {
            loads.set(a.seller_id, (loads.get(a.seller_id) || 0) + 1);
        });
        return loads;
    }, [sellers, activeAssignments]);

    const unassignedClients = useMemo(() => {
        return clients.filter((c) => !activeSellerMap.get(c.id));
    }, [clients, activeSellerMap]);

    const suggestionForClient = (clientId) => {
        const activeSellers = sellers.filter((s) => s.status === 'active');
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
                active: true,
            });

            if (insertError) {
                setError("Réattribution impossible (RLS ou données).");
                setActionBusy(false);
                return;
            }

            await supabase.from('reassignment_events').insert({
                client_id: clientId,
                from_seller_id: previousSellerId,
                to_seller_id: targetSeller,
                reason: 'manual_reassignment',
            });
        }

        setSelectedClients([]);
        setTargetSeller('');
        setActionBusy(false);
    };

    return (
        <div className="reattribution-page">
            <div className="seller-header">
                <div>
                    <p className="admin-eyebrow">Manager Console</p>
                    <h1 className="admin-title">Clients à réassigner</h1>
                    <p className="admin-subtitle">Réattribution manuelle avec suggestion IA.</p>
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
                                    <th>Température</th>
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
                                            <td>{sellerMap.get(activeSellerMap.get(client.id))?.full_name || '—'}</td>
                                            <td>{client.intent_score ?? '—'}</td>
                                            <td>{client.temperature ?? '—'}</td>
                                            <td>{client.estimated_budget ? `€${client.estimated_budget}` : '—'}</td>
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
                                        <td colSpan="8" className="empty-state">
                                            Aucun client à réassigner.
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
                        <h2>Réattribution</h2>
                        <span>Batch</span>
                    </div>
                    <div className="action-box">
                        <div className="action-row">
                            <div>
                                <p>Clients sélectionnés</p>
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
                            <select value={targetSeller} onChange={(e) => setTargetSeller(e.target.value)}>
                                <option value="">Sélectionner un vendeur...</option>
                                {sellers.filter((s) => s.status === 'active').map((s) => (
                                    <option key={s.id} value={s.id}>{s.full_name}</option>
                                ))}
                            </select>
                        </label>
                        <button
                            className="btn btn-gold"
                            onClick={handleReassign}
                            disabled={!targetSeller || selectedClients.length === 0 || actionBusy}
                        >
                            {actionBusy ? 'Réattribution...' : 'Confirmer le transfert'}
                        </button>
                        <div className="action-hint">
                            <Users size={16} />
                            <span>Le vendeur reçoit automatiquement une notification.</span>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
