import React, { useEffect, useMemo, useState } from 'react';
import { Search, Users, Flame, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function Advisors() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sellers, setSellers] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [clients, setClients] = useState([]);
    const [metrics, setMetrics] = useState([]);
    const [selectedId, setSelectedId] = useState('');
    const [toggleBusy, setToggleBusy] = useState(false);

    useEffect(() => {
        let alive = true;
        const load = async () => {
            setLoading(true);
            setError('');

            const [{ data: sellersData, error: sellersError }, { data: assignmentsData }, { data: clientsData }, { data: alertsData }, { data: metricsData }] =
                await Promise.all([
                    supabase.from('sellers').select('id,full_name,email,status,created_at').order('created_at', { ascending: false }),
                    supabase.from('client_assignments').select('client_id,seller_id,active').eq('active', true),
                    supabase.from('clients').select('id,temperature,estimated_budget'),
                    supabase.from('alerts').select('id,seller_id,type,severity,resolved,created_at').order('created_at', { ascending: false }),
                    supabase.from('seller_metrics_daily').select('seller_id,date,conversion_rate,avg_basket,closings').order('date', { ascending: false }),
                ]);

            if (!alive) return;

            if (sellersError) {
                setError('Accès refusé ou données indisponibles.');
                setLoading(false);
                return;
            }

            setSellers(sellersData || []);
            setAssignments(assignmentsData || []);
            setClients(clientsData || []);
            setAlerts(alertsData || []);
            setMetrics(metricsData || []);

            if ((sellersData || []).length && !selectedId) {
                setSelectedId(sellersData[0].id);
            }

            setLoading(false);
        };

        load();
        return () => {
            alive = false;
        };
    }, []);

    const clientMap = useMemo(() => {
        const map = new Map();
        clients.forEach((c) => map.set(c.id, c));
        return map;
    }, [clients]);

    const assignmentsBySeller = useMemo(() => {
        const map = new Map();
        assignments.forEach((a) => {
            if (!map.has(a.seller_id)) map.set(a.seller_id, []);
            map.get(a.seller_id).push(a.client_id);
        });
        return map;
    }, [assignments]);

    const latestMetricsBySeller = useMemo(() => {
        const map = new Map();
        metrics.forEach((m) => {
            if (!map.has(m.seller_id)) map.set(m.seller_id, m);
        });
        return map;
    }, [metrics]);

    const alertsBySeller = useMemo(() => {
        const map = new Map();
        alerts.forEach((a) => {
            if (!a.seller_id) return;
            if (!map.has(a.seller_id)) map.set(a.seller_id, []);
            map.get(a.seller_id).push(a);
        });
        return map;
    }, [alerts]);

    const sellerRows = useMemo(() => {
        return sellers.map((s) => {
            const assignedClients = assignmentsBySeller.get(s.id) || [];
            const hotClients = assignedClients.filter((id) => clientMap.get(id)?.temperature === 'HOT').length;
            const metric = latestMetricsBySeller.get(s.id);
            return {
                ...s,
                totalClients: assignedClients.length,
                hotClients,
                performance: metric?.conversion_rate ?? null,
            };
        });
    }, [sellers, assignmentsBySeller, clientMap, latestMetricsBySeller]);

    const filteredRows = useMemo(() => {
        return sellerRows.filter((s) => {
            const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
            const matchesSearch = s.full_name.toLowerCase().includes(search.toLowerCase());
            return matchesStatus && matchesSearch;
        });
    }, [sellerRows, statusFilter, search]);

    const selectedSeller = sellerRows.find((s) => s.id === selectedId);
    const selectedAssignments = selectedSeller ? assignmentsBySeller.get(selectedSeller.id) || [] : [];
    const selectedAlerts = selectedSeller ? alertsBySeller.get(selectedSeller.id) || [] : [];

    const temperatureBreakdown = useMemo(() => {
        const breakdown = { HOT: 0, WARM: 0, COLD: 0 };
        selectedAssignments.forEach((id) => {
            const temp = clientMap.get(id)?.temperature;
            if (temp && breakdown[temp] !== undefined) breakdown[temp] += 1;
        });
        return breakdown;
    }, [selectedAssignments, clientMap]);

    const latestMetric = selectedSeller ? latestMetricsBySeller.get(selectedSeller.id) : null;

    const toggleStatus = async () => {
        if (!selectedSeller) return;
        setToggleBusy(true);
        const nextStatus = selectedSeller.status === 'active' ? 'inactive' : 'active';
        const { error: updateError } = await supabase
            .from('sellers')
            .update({ status: nextStatus })
            .eq('id', selectedSeller.id);

        if (updateError) {
            setError("Impossible de modifier le statut (RLS).");
        } else {
            setSellers((prev) => prev.map((s) => (s.id === selectedSeller.id ? { ...s, status: nextStatus } : s)));
        }
        setToggleBusy(false);
    };

    return (
        <div className="seller-page">
            <div className="seller-header">
                <div>
                    <p className="admin-eyebrow">Manager Console</p>
                    <h1 className="admin-title">Vendeurs</h1>
                    <p className="admin-subtitle">Performance et gestion des vendeurs de la maison.</p>
                </div>
                <div className="seller-actions">
                    <button className="btn btn-outline">Importer</button>
                    <button className="btn btn-gold">Ajouter vendeur</button>
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

            <div className="seller-topbar">
                <div className="search-field">
                    <Search size={16} />
                    <input
                        placeholder="Rechercher un vendeur..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    {['all', 'active', 'inactive'].map((status) => (
                        <button
                            key={status}
                            className={`filter-pill ${statusFilter === status ? 'active' : ''}`}
                            onClick={() => setStatusFilter(status)}
                        >
                            {status === 'all' ? 'Tous' : status === 'active' ? 'Actifs' : 'Inactifs'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="seller-grid">
                <section className="seller-table panel">
                    <div className="panel-header">
                        <h2>Liste des vendeurs</h2>
                        <span>{filteredRows.length} vendeurs</span>
                    </div>
                    <div className="table-wrap">
                        <table className="seller-table-inner">
                            <thead>
                                <tr>
                                    <th>Nom</th>
                                    <th>Statut</th>
                                    <th>Clients</th>
                                    <th>HOT</th>
                                    <th>Performance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRows.map((row) => (
                                    <tr
                                        key={row.id}
                                        className={row.id === selectedId ? 'active' : ''}
                                        onClick={() => setSelectedId(row.id)}
                                    >
                                        <td>
                                            <div className="seller-name">
                                                <span>{row.full_name}</span>
                                                <small>{row.email || '—'}</small>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`status-pill ${row.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                                                {row.status}
                                            </span>
                                        </td>
                                        <td>{row.totalClients}</td>
                                        <td className="hot">{row.hotClients}</td>
                                        <td>
                                            {row.performance === null ? '—' : `${row.performance.toFixed(1)}%`}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {loading && <div className="table-loading">Chargement...</div>}
                    </div>
                </section>

                <section className="seller-detail panel">
                    <div className="panel-header">
                        <h2>Fiche vendeur</h2>
                        <span>Détails</span>
                    </div>

                    {!selectedSeller ? (
                        <p className="empty-state">Sélectionne un vendeur pour afficher la fiche.</p>
                    ) : (
                        <div className="seller-detail-content">
                            <div className="seller-detail-header">
                                <div>
                                    <h3>{selectedSeller.full_name}</h3>
                                    <p>{selectedSeller.email || 'email indisponible'}</p>
                                </div>
                                <button
                                    className={`toggle-status ${selectedSeller.status === 'active' ? 'on' : 'off'}`}
                                    onClick={toggleStatus}
                                    disabled={toggleBusy}
                                >
                                    {selectedSeller.status === 'active' ? 'Actif' : 'Inactif'}
                                </button>
                            </div>

                            <div className="detail-block">
                                <div className="detail-title">
                                    <TrendingUp size={18} />
                                    <span>Performance</span>
                                </div>
                                <div className="detail-grid">
                                    <div>
                                        <strong>{latestMetric?.conversion_rate ?? '—'}%</strong>
                                        <span>Conversion</span>
                                    </div>
                                    <div>
                                        <strong>{latestMetric?.avg_basket ?? '—'}</strong>
                                        <span>Panier moyen</span>
                                    </div>
                                    <div>
                                        <strong>{latestMetric?.closings ?? '—'}</strong>
                                        <span>Closings récents</span>
                                    </div>
                                </div>
                            </div>

                            <div className="detail-block">
                                <div className="detail-title">
                                    <Users size={18} />
                                    <span>Portefeuille</span>
                                </div>
                                <div className="detail-grid">
                                    <div>
                                        <strong>{selectedAssignments.length}</strong>
                                        <span>Total clients</span>
                                    </div>
                                    <div>
                                        <strong>{temperatureBreakdown.HOT}</strong>
                                        <span>HOT</span>
                                    </div>
                                    <div>
                                        <strong>{temperatureBreakdown.WARM}</strong>
                                        <span>WARM</span>
                                    </div>
                                    <div>
                                        <strong>{temperatureBreakdown.COLD}</strong>
                                        <span>COLD</span>
                                    </div>
                                </div>
                            </div>

                            <div className="detail-block">
                                <div className="detail-title">
                                    <Flame size={18} />
                                    <span>Alertes</span>
                                </div>
                                <div className="alert-list">
                                    {selectedAlerts.length === 0 ? (
                                        <div className="alert-card">
                                            <div className="alert-top">
                                                <p>Aucune alerte</p>
                                                <span>✔︎</span>
                                            </div>
                                            <p className="alert-detail">Rien à signaler.</p>
                                        </div>
                                    ) : (
                                        selectedAlerts.slice(0, 4).map((a) => (
                                            <div key={a.id} className="alert-card">
                                                <div className="alert-top">
                                                    <p>{a.type}</p>
                                                    <span>{a.severity}</span>
                                                </div>
                                                <p className="alert-detail">{new Date(a.created_at).toLocaleDateString()}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
