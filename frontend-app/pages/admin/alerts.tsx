import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { AlertTriangle, CheckCircle2, User, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/layout/AdminLayout';

interface Alert {
  id: string;
  house_id?: string | null;
  seller_id: string | null;
  client_id: string | null;
  type: string;
  severity: 'high' | 'medium' | 'low';
  resolved: boolean;
  created_at: string;
}

interface Seller {
  id: string;
  full_name: string;
  status: 'active' | 'inactive';
}

interface Client {
  id: string;
  full_name: string;
  temperature: 'HOT' | 'WARM' | 'COLD' | null;
}

export default function Alerts() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [resolvingId, setResolvingId] = useState('');

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError('');

      const [
        { data: alertsData, error: alertsError },
        { data: sellersData },
        { data: clientsData }
      ] = await Promise.all([
        supabase.from('alerts').select('id,house_id,seller_id,client_id,type,severity,resolved,created_at').order('created_at', { ascending: false }),
        supabase.from('sellers').select('id,full_name,status'),
        supabase.from('clients').select('id,full_name,temperature')
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

  const sellerMap = useMemo(() => new Map(sellers.map((seller) => [seller.id, seller])), [sellers]);
  const clientMap = useMemo(() => new Map(clients.map((client) => [client.id, client])), [clients]);

  const resolveAlert = async (id: string) => {
    setResolvingId(id);
    const { error: updateError } = await supabase.from('alerts').update({ resolved: true }).eq('id', id);
    if (updateError) {
      setError('Impossible de marquer comme traite (RLS).');
    } else {
      setAlerts((prev) => prev.map((alert) => (alert.id === id ? { ...alert, resolved: true } : alert)));
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
    <AdminLayout>
      <Head>
        <title>Alerts - LVMH</title>
      </Head>
      <div className="alerts-page">
        <div className="seller-header">
          <div>
            <p className="admin-eyebrow">Manager Console</p>
            <h1 className="admin-title">Alertes manager</h1>
            <p className="admin-subtitle">Priorites critiques, vendeurs surcharges, clients oublies.</p>
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
              <h2>Liste priorisee</h2>
              <span>{alerts.length} alertes</span>
            </div>
            <div className="alert-list">
              {loading && <div className="table-loading">Chargement...</div>}
              {!loading && grouped.length === 0 && (
                <div className="alert-card">
                  <div className="alert-top">
                    <p>Aucune alerte</p>
                    <span>OK</span>
                  </div>
                  <p className="alert-detail">Tout est sous controle.</p>
                </div>
              )}
              {grouped.map((alert) => {
                const seller = sellerMap.get(alert.seller_id || '');
                const client = clientMap.get(alert.client_id || '');
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
                        {alert.resolved ? 'Traite' : resolvingId === alert.id ? '...' : 'Marquer traite'}
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
              <span>Resume</span>
            </div>
            <div className="summary-card">
              <AlertTriangle size={20} />
              <div>
                <strong>{alerts.filter((alert) => !alert.resolved && alert.severity === 'high').length}</strong>
                <span>Alertes critiques</span>
              </div>
            </div>
            <div className="summary-card">
              <CheckCircle2 size={20} />
              <div>
                <strong>{alerts.filter((alert) => alert.resolved).length}</strong>
                <span>Traitees</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}
