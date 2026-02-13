import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { CockpitLayout } from '../../components/layout/CockpitLayout';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Phone, Mail, Calendar, MapPin, ShoppingBag, Clock, Search, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSupabase } from '../../hooks/useSupabase';
import { AnalysisResult } from '../../lib/types';
import { ClientTaxonomyTree } from '../../components/features/ClientTaxonomyTree';
import { useRouter } from 'next/router';

// Helper to get initials
const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
};

// Helper to get color based on index or name
const getColor = (index: number) => {
    const colors = [
        'bg-emerald-100 text-emerald-700',
        'bg-blue-100 text-blue-700',
        'bg-purple-100 text-purple-700',
        'bg-rose-100 text-rose-700',
        'bg-yellow-100 text-yellow-700'
    ];
    return colors[index % colors.length];
};

export default function ClientsPage() {
    const router = useRouter();
    const { myClients, loadingClients } = useSupabase();
    const [selectedClientId, setSelectedClientId] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState("");
    const [clientAnalysisById, setClientAnalysisById] = useState<Record<string, AnalysisResult>>({});
    const [showTaxonomy, setShowTaxonomy] = useState(false);

    const CLIENT_ANALYSIS_CACHE_KEY = 'client_analysis_cache_v1';

    // Initialize selection when clients load
    useEffect(() => {
        if (myClients.length === 0) return;

        const queryClientId = typeof router.query.clientId === 'string' ? router.query.clientId : '';
        const matchingClient = queryClientId ? myClients.find(c => c.id === queryClientId) : null;

        if (matchingClient) {
            setSelectedClientId(matchingClient.id);
            return;
        }

        if (!selectedClientId) {
            setSelectedClientId(myClients[0].id);
        }
    }, [myClients, selectedClientId, router.query.clientId]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const raw = localStorage.getItem(CLIENT_ANALYSIS_CACHE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                setClientAnalysisById(parsed || {});
            }
        } catch {
            setClientAnalysisById({});
        }
    }, []);

    const selectedClient = myClients.find(c => c.id === selectedClientId) || myClients[0];

    const filteredClients = myClients.filter(client => {
        const fullName = `${client.first_name} ${client.last_name}`.toLowerCase();
        return fullName.includes(searchTerm.toLowerCase()) ||
            (client.tags && client.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
    });

    if (loadingClients && myClients.length === 0) {
        return (
            <CockpitLayout>
                <div className="flex items-center justify-center h-screen">
                    <p className="font-serif text-xl animate-pulse">Chargement de vos clients...</p>
                </div>
            </CockpitLayout>
        );
    }

    if (!selectedClient) {
        return (
            <CockpitLayout>
                <div className="flex items-center justify-center h-screen">
                    <p className="font-serif text-xl">Aucun client trouvé.</p>
                </div>
            </CockpitLayout>
        );
    }

    const selectedClientAnalysis = selectedClient?.analysis
        || (selectedClientId ? clientAnalysisById[selectedClientId] : undefined)
        || (selectedClient?.full_name ? clientAnalysisById[selectedClient.full_name] : undefined);
    const primaryTaxonomyPath = selectedClientAnalysis?.taxonomy_paths?.[0] || selectedClientAnalysis?.taxonomy_path;
    const tagsToDisplay = selectedClientAnalysis?.tags?.length
        ? selectedClientAnalysis.tags
        : (selectedClient.tags || []);
    const nextContactAt = selectedClient.next_contact_at || selectedClientAnalysis?.next_contact_at || null;

    return (
        <CockpitLayout>
            <Head>
                <title>LVMH - Suivi Client</title>
            </Head>

            <div className="max-w-7xl mx-auto h-[calc(100vh-100px)] flex gap-6 p-6">

                {/* Main Content (Left ~75%) */}
                <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col order-1 md:order-1">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedClient.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                            className="h-full flex flex-col"
                        >
                            {/* Header Profile */}
                            <div className="p-8 border-b border-gray-100 flex justify-between items-start bg-gray-50/30">
                                <div className="flex gap-6">
                                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-serif border-4 border-white shadow-sm">
                                        {getInitials(selectedClient.first_name, selectedClient.last_name)}
                                    </div>
                                    <div className="pt-2">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h1 className="font-serif text-3xl font-bold">{selectedClient.first_name} {selectedClient.last_name}</h1>
                                            {selectedClient.tags && selectedClient.tags.length > 0 && (
                                                <Badge variant="neutral">{selectedClient.tags[0]}</Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <span className="flex items-center gap-1"><MapPin size={14} /> Paris, France</span>
                                            <span className="flex items-center gap-1"><Clock size={14} /> Local: 14:32</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant={showTaxonomy ? 'primary' : 'outline'}
                                        className="text-xs uppercase tracking-widest"
                                        onClick={() => setShowTaxonomy(prev => !prev)}
                                    >
                                        {showTaxonomy ? 'Masquer taxonomie' : 'Voir taxonomie'}
                                    </Button>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="flex-1 overflow-y-auto p-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                    <Card className="bg-gray-50 border-none p-4">
                                        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Dépenses Totales</p>
                                        <p className="text-2xl font-serif font-bold">{selectedClient.total_spent.toLocaleString()}€</p>
                                    </Card>
                                    <Card className="bg-gray-50 border-none p-4">
                                        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Dernière Visite</p>
                                        <p className="text-2xl font-serif font-bold">{new Date(selectedClient.last_interaction_date).toLocaleDateString()}</p>
                                    </Card>
                                    <Card className="bg-gray-50 border-none p-4">
                                        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Préférence</p>
                                        <p className="text-2xl font-serif font-bold">Maroquinerie</p>
                                    </Card>
                                    <Card className="bg-gray-50 border-none p-4">
                                        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Prochain Contact</p>
                                        <p className="text-2xl font-serif font-bold">
                                            {nextContactAt ? new Date(nextContactAt).toLocaleDateString('fr-FR') : 'Non défini'}
                                        </p>
                                    </Card>
                                </div>

                                {/* Intelligence Section */}
                                <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                    <h3 className="font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2 text-slate-500">
                                        <ShoppingBag size={16} /> Intelligence Client
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-xs text-gray-400 mb-2">Chemin Taxonomique</p>
                                            {primaryTaxonomyPath ? (
                                                <button
                                                    type="button"
                                                    className="bg-white px-3 py-2 rounded-lg border border-gray-200 inline-flex items-center text-sm font-medium text-gray-700 hover:border-black transition-colors"
                                                    onClick={() => setShowTaxonomy(true)}
                                                >
                                                    <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></span>
                                                    {primaryTaxonomyPath}
                                                </button>
                                            ) : (
                                                <div className="text-xs text-gray-400 italic">Aucune taxonomie liée à cet import.</div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 mb-2">Tags Détectés</p>
                                            <div className="flex flex-wrap gap-2">
                                                {tagsToDisplay.length > 0 ? (
                                                    tagsToDisplay.map((tag, i) => (
                                                        <Badge key={i} variant="outline" className="bg-white border-gray-200 text-gray-600">
                                                            #{tag}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">Aucun tag détecté.</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {showTaxonomy ? (
                                        <div className="mt-6">
                                            <ClientTaxonomyTree analysis={selectedClientAnalysis} />
                                        </div>
                                    ) : null}
                                </div>

                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <Calendar size={20} /> Historique Récent
                                </h3>
                                <div className="space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex border-l-2 border-gray-200 pl-4 py-1">
                                            <div className="w-32 text-xs text-gray-400 pt-1">12 Oct 2023</div>
                                            <div>
                                                <p className="font-bold text-sm">Visite Boutique Montaigne</p>
                                                <p className="text-sm text-gray-600">Essayage collection Printemps. Intérêt pour le sac Capucines Mini.</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Sidebar Navigation */}
                <div className="w-80 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col order-2 md:order-2 overflow-hidden h-full">
                    <div className="p-6 border-b border-gray-100 bg-white z-10 sticky top-0">
                        <h2 className="font-serif text-xl font-bold mb-4">Mes Clients</h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Rechercher..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-gray-50 rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-black transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-1">
                        {filteredClients.length > 0 ? filteredClients.map((client, index) => (
                            <motion.button
                                key={client.id}
                                whileHover={{ scale: 1.02, backgroundColor: 'rgba(249, 250, 251, 1)' }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedClientId(client.id)}
                                className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all border ${selectedClientId === client.id
                                        ? 'bg-black text-white border-black shadow-md'
                                        : 'bg-white text-gray-700 border-transparent hover:border-gray-100'
                                    }`}
                            >
                                <div className={`w-10 h-10 min-w-[2.5rem] rounded-full flex items-center justify-center text-xs font-bold ${selectedClientId === client.id
                                        ? 'bg-white text-black'
                                        : getColor(index)
                                    }`}>
                                    {getInitials(client.first_name, client.last_name)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-sm truncate">{client.first_name} {client.last_name}</h4>
                                    <p className={`text-xs truncate ${selectedClientId === client.id ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {client.tags && client.tags.length > 0 ? client.tags[0] : 'Client'}
                                    </p>
                                </div>
                                {selectedClientId === client.id && (
                                    <ChevronRight size={16} className="text-gray-400" />
                                )}
                            </motion.button>
                        )) : (
                            <div className="p-8 text-center text-gray-400 text-sm">
                                Aucun client trouvé
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-gray-100 bg-gray-50 text-center text-xs text-gray-400">
                        {filteredClients.length} client{filteredClients.length > 1 ? 's' : ''} affiché{filteredClients.length > 1 ? 's' : ''}
                    </div>
                </div>

            </div>
        </CockpitLayout>
    );
}
