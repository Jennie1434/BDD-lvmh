import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, User, Users } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function Alerts() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [alerts, setAlerts] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [clients, setClients] = useState([]);
  const [resolvingId, setResolvingId] = useState('');

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError('');

      const [{ data: alertsData, error: alertsError }, { data: sellersData }, { data: clientsData }] = await Promise.all([
        supabase.from('alerts').select('id,house_id,seller_id,client_id,type,severity,resolved,created_at').order('created_at', { ascending: false }),
        supabase.from('sellers').select('id,full_name,status'),
        supabase.from('clients').select('id,full_name,temperature'),
      ]);

      if (!alive) return;
      if (alertsError) {
        setError('Impossible de charger les alertes.');
        setLoading(false);
        return;
      }

      setAlerts(alertsData || []);
      setSellers(sellersData || []);
      setClients(clientsData || []);
      setLoading(false);
    };

    load();
    return () => {
      alive = false;
    };
  }, []);

  const sellerMap = useMemo(() => new Map(sellers.map((s) => [s.id, s])), [sellers]);
  const clientMap = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);

  const resolveAlert = async (id) => {
    setResolvingId(id);
    const { error: updateError } = await supabase.from('alerts').update({ resolved: true }).eq('id', id);
    if (updateError) {
      setError('Impossible de marquer comme traité (RLS).');
    } else {
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, resolved: true } : a)));
    }
    setResolvingId('');
  };

  const grouped = useMemo(() => {
    const list = [...alerts];
    list.sort((a, b) => {
      const sev = { high: 0, medium: 1, low: 2 };
      return (sev[a.severity] ?? 3) - (sev[b.severity] ?? 3);
    });
    return list;
  }, [alerts]);

  return (
    <div className="alerts-page">
      <div className="seller-header">
        <div>
          <p className="admin-eyebrow">Manager Console</p>
          <h1 className="admin-title">Alertes manager</h1>
          <p className="admin-subtitle">Priorités critiques, vendeurs surchargés, clients oubliés.</p>
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

      <div className="alerts-grid">
        <section className="panel">
          <div className="panel-header">
            <h2>Liste priorisée</h2>
            <span>{alerts.length} alertes</span>
          </div>
          <div className="alert-list">
            {loading && <div className="table-loading">Chargement...</div>}
            {!loading && grouped.length === 0 && (
              <div className="alert-card">
                <div className="alert-top">
                  <p>Aucune alerte</p>
                  <span>✔︎ Stable</span>
                </div>
                <p className="alert-detail">Tout est sous contrôle.</p>
              </div>
            )}
            {grouped.map((alert) => {
              const seller = sellerMap.get(alert.seller_id);
              const client = clientMap.get(alert.client_id);
              return (
                <div key={alert.id} className={`alert-card ${alert.resolved ? 'resolved' : ''}`}>
                  <div className="alert-top">
                    <p>{alert.type}</p>
                    <span>{alert.severity}</span>
                  </div>
                  <div className="alert-meta">
                    {seller && (
                      <span><Users size={14} /> {seller.full_name}</span>
                    )}
                    {client && (
                      <span><User size={14} /> {client.full_name}</span>
                    )}
                    <span>{new Date(alert.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="alert-actions">
                    <button className="btn btn-outline">Ouvrir vendeur</button>
                    <button className="btn btn-outline">Ouvrir client</button>
                    <button
                      className="btn btn-gold"
                      onClick={() => resolveAlert(alert.id)}
                      disabled={alert.resolved || resolvingId === alert.id}
                    >
                      {alert.resolved ? 'Traité' : resolvingId === alert.id ? '...' : 'Marquer traité'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="panel alerts-summary">
          <div className="panel-header">
            <h2>Focus rapide</h2>
            <span>Résumé</span>
          </div>
          <div className="summary-card">
            <AlertTriangle size={20} />
            <div>
              <strong>{alerts.filter((a) => !a.resolved && a.severity === 'high').length}</strong>
              <span>Alertes critiques</span>
            </div>
          </div>
          <div className="summary-card">
            <CheckCircle2 size={20} />
            <div>
              <strong>{alerts.filter((a) => a.resolved).length}</strong>
              <span>Traitées</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
