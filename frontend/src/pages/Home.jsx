import React from 'react';
import { TrendingUp, ShoppingBag, Users, Globe } from 'lucide-react';

const StatCard = ({ title, value, sub, icon: Icon }) => (
    <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textTransform: 'uppercase' }}>{title}</span>
            <Icon size={20} color="var(--color-primary)" opacity={0.6} />
        </div>
        <div style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)', marginBottom: '0.5rem' }}>{value}</div>
        <div style={{ fontSize: '0.875rem', color: 'var(--color-success)' }}>{sub}</div>
    </div>
);

export default function Home() {
    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Tableau de Bord</h1>
                    <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Vue d'ensemble de la performance globale.</p>
                </div>
                <button className="btn">Exporter le rapport</button>
            </div>

            <div className="grid-3">
                <StatCard title="Chiffre d'Affaires" value="12.4M €" sub="+12% vs N-1" icon={TrendingUp} />
                <StatCard title="Clients Actifs" value="3,450" sub="+5% ce mois" icon={Users} />
                <StatCard title="Ventes Croisées" value="28%" sub="Objectif: 30%" icon={ShoppingBag} />
            </div>

            <div style={{ marginTop: '3rem' }}>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '1.5rem' }}>Performance par Maison</h2>
                <div className="card">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Maison</th>
                                <th>Région</th>
                                <th>Ventes (YTD)</th>
                                <th>Progression</th>
                                <th>Top Catégorie</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>Louis Vuitton</strong></td>
                                <td>Global</td>
                                <td>8.2M €</td>
                                <td><span className="status-badge status-high">+15%</span></td>
                                <td>Maroquinerie</td>
                            </tr>
                            <tr>
                                <td><strong>Dior</strong></td>
                                <td>EMEA</td>
                                <td>3.1M €</td>
                                <td><span className="status-badge status-med">+8%</span></td>
                                <td>Prêt-à-Porter</td>
                            </tr>
                            <tr>
                                <td><strong>Fendi</strong></td>
                                <td>APAC</td>
                                <td>1.1M €</td>
                                <td><span className="status-badge status-med">+4%</span></td>
                                <td>Accessoires</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
