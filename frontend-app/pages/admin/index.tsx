import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/layout/AdminLayout';

interface NetworkPoint {
    id: string;
    x: number;
    y: number;
    t: 'cold' | 'warm' | 'hot';
}

interface Stats {
    activeSellers: number;
    inactiveSellers: number;
    hotClients: number;
    warmClients: number;
    coldClients: number;
    pipeline: number;
    criticalAlerts: number;
}

interface Alert {
    id: string;
    type: string;
    severity: string;
    resolved: boolean;
    created_at: string;
}

interface TimelineItem {
    id: string;
    label: string;
    detail: string;
    date: string;
}

const networkPoints: NetworkPoint[] = [
    { id: 'n1', x: 8, y: 24, t: 'cold' },
    { id: 'n2', x: 22, y: 40, t: 'warm' },
    { id: 'n3', x: 33, y: 18, t: 'warm' },
    { id: 'n4', x: 46, y: 55, t: 'hot' },
    { id: 'n5', x: 55, y: 22, t: 'cold' },
    { id: 'n6', x: 68, y: 44, t: 'warm' },
    { id: 'n7', x: 82, y: 28, t: 'hot' },
    { id: 'n8', x: 90, y: 56, t: 'cold' },
];

const networkLinks: [string, string][] = [
    ['n1', 'n2'], ['n2', 'n4'], ['n3', 'n5'], ['n5', 'n7'], ['n4', 'n6'], ['n6', 'n8'], ['n2', 'n3'], ['n4', 'n7'],
];

export default function AdminHome() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [needsAuth, setNeedsAuth] = useState(false);
    const [stats, setStats] = useState<Stats>({
        activeSellers: 0,
        inactiveSellers: 0,
        hotClients: 0,
        warmClients: 0,
        coldClients: 0,
        pipeline: 0,
        criticalAlerts: 0,
    });
    const [alerts, setAlerts] = useState<Alert[]>([]);

    useEffect(() => {
        let alive = true;

        const load = async () => {
            setLoading(true);
            setError('');

            const { data: sessionData } = await supabase.auth.getSession();
            if (!sessionData?.session) {
                setNeedsAuth(true);
                setLoading(false);
                return;
            }

            const [{ data: sellers, error: sellersError }, { data: clients, error: clientsError }, { data: alertsData, error: alertsError }] =
                await Promise.all([
                    supabase.from('sellers').select('id,status'),
                    supabase.from('clients').select('id,temperature,estimated_budget'),
                    supabase.from('alerts').select('id,type,severity,resolved,created_at').order('created_at', { ascending: false }).limit(8),
                ]);

            if (!alive) return;

            if (sellersError || clientsError || alertsError) {
                setError('Connexion Supabase: accès refusé ou données indisponibles.');
                setLoading(false);
                return;
            }

            setStats({
                activeSellers: sellers?.filter((s: any) => s.status === 'active').length || 0,
                inactiveSellers: sellers?.filter((s: any) => s.status === 'inactive').length || 0,
                hotClients: clients?.filter((c: any) => c.temperature === 'HOT').length || 0,
                warmClients: clients?.filter((c: any) => c.temperature === 'WARM').length || 0,
                coldClients: clients?.filter((c: any) => c.temperature === 'COLD').length || 0,
                pipeline: (clients || []).reduce((sum: number, c: any) => sum + (Number(c.estimated_budget) || 0), 0),
                criticalAlerts: (alertsData || []).filter((a: Alert) => !a.resolved && a.severity === 'high').length,
            });
            setAlerts(alertsData || []);
            setLoading(false);
        };

        load();
        return () => {
            alive = false;
        };
    }, []);

    const tensionValue = useMemo(() => {
        const tension = (stats.hotClients * 2) + (stats.criticalAlerts * 4) + stats.inactiveSellers;
        if (!tension) return '62';
        return String(Math.min(99, Math.max(28, tension)));
    }, [stats]);

    const pipelineValue = useMemo(() => {
        if (!stats.pipeline) return '4,8M';
        const million = stats.pipeline / 1_000_000;
        return million.toFixed(1).replace('.', ',') + 'M';
    }, [stats.pipeline]);

    const riskValue = useMemo(() => {
        if (stats.criticalAlerts >= 5) return 'Élevé';
        if (stats.criticalAlerts >= 2) return 'Modéré';
        return 'Modéré';
    }, [stats.criticalAlerts]);

    const recommendation = useMemo(() => {
        if (stats.criticalAlerts >= 4) {
            return {
                title: 'RECOMMANDATION STRATÉGIQUE',
                text: 'Rééquilibrer la disponibilité vendeurs sur zone Est.',
                priority: 'Haute',
                impact: '+18% fluidité client',
            };
        }

        return {
            title: 'RECOMMANDATION STRATÉGIQUE',
            text: 'Rééquilibrer la disponibilité vendeurs sur zone Est.',
            priority: 'Moyenne',
            impact: '+12% fluidité client',
        };
    }, [stats.criticalAlerts]);

    const timeline = useMemo<TimelineItem[]>(() => {
        const fromAlerts = alerts.slice(0, 5).map((alert) => ({
            id: alert.id,
            label: alert.type,
            detail: alert.severity === 'high' ? 'Priorité élevée' : 'Signal modéré',
            date: new Date(alert.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
        }));

        if (fromAlerts.length) return fromAlerts;

        return [
            { id: 't-1', label: 'Pipeline consolidé', detail: 'Projection budgétaire mise à jour', date: 'Aujourd\'hui' },
            { id: 't-2', label: 'Zone Est observée', detail: 'Tension client en hausse discrète', date: 'Aujourd\'hui' },
            { id: 't-3', label: 'Matrice vendeurs', detail: 'Stabilité maintenue', date: 'Hier' },
        ];
    }, [alerts]);

    const pointsMap = useMemo(() => {
        const pointById = Object.fromEntries(networkPoints.map((p) => [p.id, p]));
        return { pointById };
    }, []);

    return (
        <AdminLayout>
            <Head>
                <title>Salle de pilotage | LVMH</title>
                <meta
                    name="description"
                    content="Salle de pilotage stratégique - Maison Montaigne"
                />
            </Head>

            <div className="maison-editorial">
                <header className="editorial-header">
                    <p className="header-maison">MAISON MONTAIGNE</p>
                    <h1 className="header-title">Salle de pilotage stratégique</h1>
                </header>

                <section className="plan plan-situation" aria-label="Situation">
                    <p className="situation-lead">La tension client est maîtrisée. Deux zones requièrent attention.</p>

                    <div className="situation-metrics">
                        <div>
                            <p>Tension globale</p>
                            <strong>{loading ? '62' : tensionValue}</strong>
                        </div>
                        <div>
                            <p>Pipeline estimé</p>
                            <strong>{loading ? '4,8M' : pipelineValue}</strong>
                        </div>
                        <div>
                            <p>Risque prioritaire</p>
                            <strong>{loading ? 'Modéré' : riskValue}</strong>
                        </div>
                    </div>
                </section>

                <section className="plan plan-map" aria-label="Cartographie immersive">
                    <div className="map-surface">
                        <svg viewBox="0 0 100 70" preserveAspectRatio="none" className="map-svg" role="img" aria-label="Réseau relationnel">
                            {networkLinks.map(([from, to], index) => {
                                const a = pointsMap.pointById[from];
                                const b = pointsMap.pointById[to];
                                return (
                                    <line
                                        key={`${from}-${to}`}
                                        x1={a.x}
                                        y1={a.y}
                                        x2={b.x}
                                        y2={b.y}
                                        className="map-link"
                                        style={{ animationDelay: `${index * 0.2}s` }}
                                    />
                                );
                            })}

                            {networkPoints.map((point, index) => (
                                <circle
                                    key={point.id}
                                    cx={point.x}
                                    cy={point.y}
                                    r={point.t === 'hot' ? 1.15 : 0.85}
                                    className={`map-point map-point-${point.t}`}
                                    style={{ animationDelay: `${index * 0.28}s` }}
                                />
                            ))}
                        </svg>
                    </div>
                </section>

                <div className="plan-row">
                    <section className="plan plan-decision" aria-label="Plan décision IA">
                        <p className="decision-heading">{recommendation.title}</p>
                        <p className="decision-body">{recommendation.text}</p>
                        <p className="decision-meta">Priorité : {recommendation.priority}. Impact estimé : {recommendation.impact}.</p>
                    </section>

                    <aside className="plan plan-feed" aria-label="Fil d'activité">
                        <p className="feed-title">Fil d'activité</p>
                        <div className="feed-list">
                            {timeline.map((item) => (
                                <article key={item.id} className="feed-line">
                                    <p>{item.label}</p>
                                    <span>{item.detail}</span>
                                    <em>{item.date}</em>
                                </article>
                            ))}
                        </div>
                    </aside>
                </div>

                {(needsAuth || error) && (
                    <section className="plan plan-note" aria-label="Informations système">
                        {needsAuth && <p>Connexion requise: ouvre /admin/login pour activer le flux.</p>}
                        {error && <p>{error}</p>}
                    </section>
                )}
            </div>
        </AdminLayout>
    );
}
