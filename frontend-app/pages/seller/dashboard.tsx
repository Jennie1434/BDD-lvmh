import React from 'react';
import Head from 'next/head';
import { CockpitLayout } from '../../components/layout/CockpitLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ArrowUpRight, TrendingUp, Users, ShoppingBag, Sparkles } from 'lucide-react';
import { TaskCard } from '../../components/dashboard/TaskCard';
import { useSupabase } from '../../hooks/useSupabase';

export default function DashboardSimplePage() {
    const { myClients, loadingClients } = useSupabase();

    // Calculate KPIs from real data
    const totalClients = myClients.length;
    const totalSpent = myClients.reduce((acc, client) => acc + client.total_spent, 0);
    const averageBasket = totalClients > 0 ? Math.round(totalSpent / totalClients / 100) * 100 : 0; // Round to nearest 100

    // Filter for "Today" tasks (Mock logic based on tags for demo)
    const rappelClients = myClients.filter(c => c.tags && c.tags.includes('VIP')).slice(0, 2);
    const closingClients = myClients.filter(c => c.tags && c.tags.includes('Potentiel')).slice(0, 1);
    const dormantClients = myClients.filter(c => c.tags && c.tags.includes('Occasionnel')).slice(0, 1);

    return (
        <CockpitLayout>
            <Head>
                <title>LVMH - Mon Dashboard</title>
            </Head>

            <div className="max-w-7xl mx-auto p-6 md:p-8 h-[calc(100vh-80px)] overflow-y-auto">

                <h1 className="font-serif text-3xl font-bold mb-8">Bonjour, voici vos priorités</h1>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left Column: Aujourd'hui (Main Focus) - Span 7 */}
                    <div className="lg:col-span-7 flex flex-col gap-6">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-black"></span>
                                Aujourd'hui
                            </h2>
                            <span className="text-sm text-gray-400 font-mono">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                        </div>

                        {/* Section: Clients à rappeler */}
                        <div className="space-y-3">
                            <h3 className="text-xs uppercase tracking-widest text-gray-500 font-bold ml-1">Clients à rappeler</h3>
                            {loadingClients ? (
                                <p className="text-sm text-gray-400">Chargement...</p>
                            ) : rappelClients.length > 0 ? (
                                rappelClients.map(client => (
                                    <TaskCard
                                        key={client.id}
                                        type="rappel"
                                        clientName={`${client.first_name} ${client.last_name}`}
                                        details={`Dernier achat: ${new Date(client.last_interaction_date).toLocaleDateString()}`}
                                        priority="high"
                                        date="10:00"
                                    />
                                ))
                            ) : (
                                <p className="text-sm text-gray-400">Aucun rappel pour le moment.</p>
                            )}
                        </div>

                        {/* Section: Closings Probables */}
                        <div className="space-y-3 mt-4">
                            <h3 className="text-xs uppercase tracking-widest text-gray-500 font-bold ml-1">Closings Probables</h3>
                            {loadingClients ? (
                                <p className="text-sm text-gray-400">Chargement...</p>
                            ) : closingClients.length > 0 ? (
                                closingClients.map(client => (
                                    <TaskCard
                                        key={client.id}
                                        type="closing"
                                        clientName={`${client.first_name} ${client.last_name}`}
                                        details="Intéressé par nouvelle collection"
                                        date="Hier"
                                    />
                                ))
                            ) : (
                                <p className="text-sm text-gray-400">Aucun closing probable.</p>
                            )}
                        </div>

                        {/* Section: Clients Froids */}
                        <div className="space-y-3 mt-4">
                            <h3 className="text-xs uppercase tracking-widest text-gray-500 font-bold ml-1">Clients Dormants</h3>
                            {loadingClients ? (
                                <p className="text-sm text-gray-400">Chargement...</p>
                            ) : dormantClients.length > 0 ? (
                                dormantClients.map(client => (
                                    <TaskCard
                                        key={client.id}
                                        type="froid"
                                        clientName={`${client.first_name} ${client.last_name}`}
                                        details="Inactif depuis 3 mois"
                                    />
                                ))
                            ) : (
                                <p className="text-sm text-gray-400">Aucun client dormant.</p>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Ce mois (KPIs) - Span 5 */}
                    <div className="lg:col-span-5 flex flex-col gap-6">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                                Ce mois
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {/* KPI 1: Taux de conversion (Mock static for now) */}
                            <Card className="p-6 relative overflow-hidden group">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Taux de conversion</p>
                                        <h3 className="text-4xl font-serif font-bold group-hover:scale-105 transition-transform">28%</h3>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-full">
                                        <TrendingUp size={24} className="text-black" />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-2">
                                    <Badge variant="green">+3.2 pts</Badge>
                                    <span className="text-xs text-gray-400">vs objectif</span>
                                </div>
                            </Card>

                            {/* KPI 2: Panier Moyen (Calculated) */}
                            <Card className="p-6 relative overflow-hidden group">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Panier Moyen</p>
                                        <h3 className="text-4xl font-serif font-bold group-hover:scale-105 transition-transform">
                                            {averageBasket > 0 ? `${(averageBasket / 1000).toFixed(1)}K€` : '0€'}
                                        </h3>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-full">
                                        <ShoppingBag size={24} className="text-black" />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-2">
                                    <Badge variant="outline">Stable</Badge>
                                    <span className="text-xs text-gray-400">vs mois dernier</span>
                                </div>
                            </Card>

                            {/* KPI 3: Clients Actifs (Calculated) */}
                            <Card className="p-6 relative overflow-hidden group">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Clients Portefeuille</p>
                                        <h3 className="text-4xl font-serif font-bold group-hover:scale-105 transition-transform">
                                            {totalClients}
                                        </h3>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-full">
                                        <Users size={24} className="text-black" />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-2">
                                    <span className="text-xs text-gray-400">Total assigné</span>
                                </div>
                            </Card>
                        </div>

                    </div>

                </div>
            </div>
        </CockpitLayout>
    );
}
