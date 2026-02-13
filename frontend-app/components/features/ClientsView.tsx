import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Search, Filter, MoreHorizontal, Phone, Mail, Calendar, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

// Mock Data
const MOCK_CLIENTS = [
    { id: '1', name: 'Mme. Al-Thani', segment: 'VIP', location: 'Doha, Qatar', totalSpent: '450k€', lastVisit: '10 fév.', avatar: 'MA' },
    { id: '2', name: 'M. Bernard', segment: 'Fidèle', location: 'Paris, France', totalSpent: '125k€', lastVisit: 'Hier', avatar: 'MB' },
    { id: '3', name: 'Sarah Connor', segment: 'Nouveau', location: 'Los Angeles, USA', totalSpent: '12k€', lastVisit: 'Il y a 3 jours', avatar: 'SC' },
    { id: '4', name: 'Jean Dupont', segment: 'Dormant', location: 'Lyon, France', totalSpent: '5k€', lastVisit: 'Il y a 2 mois', avatar: 'JD' },
    { id: '5', name: 'Elena Fisher', segment: 'VIP', location: 'London, UK', totalSpent: '280k€', lastVisit: '15 jan.', avatar: 'EF' },
    { id: '6', name: 'Nathen Drake', segment: 'Occasionnel', location: 'Unknown', totalSpent: '2k€', lastVisit: 'Il y a 6 mois', avatar: 'ND' },
];

export const ClientsView = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSegment, setFilterSegment] = useState('All');

    const filteredClients = MOCK_CLIENTS.filter(client => {
        const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterSegment === 'All' || client.segment === filterSegment;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="max-w-7xl mx-auto pb-24">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="font-serif text-3xl font-bold mb-2">Mes Clients</h2>
                    <p className="text-gray-500 text-sm">Gérez votre portefeuille client et vos relances.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" size="sm" className="gap-2">
                        <Filter size={16} /> Filtrer
                    </Button>
                    <Button size="sm" className="bg-black text-white gap-2">
                        + Nouveau Client
                    </Button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Rechercher un client (nom, ville...)"
                    className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black transition-all shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Client Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClients.map((client, index) => (
                    <motion.div
                        key={client.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <Card hoverEffect className="group cursor-pointer">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center font-serif text-lg font-bold text-gray-600 group-hover:bg-black group-hover:text-white transition-colors">
                                        {client.avatar}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{client.name}</h3>
                                        <div className="flex items-center gap-1 text-xs text-gray-400">
                                            <MapPin size={10} /> {client.location}
                                        </div>
                                    </div>
                                </div>
                                <button className="text-gray-400 hover:text-black">
                                    <MoreHorizontal size={20} />
                                </button>
                            </div>

                            <div className="flex gap-2 mb-4">
                                <Badge variant={client.segment === 'VIP' ? 'gold' : 'neutral'}>
                                    {client.segment}
                                </Badge>
                                <Badge variant="green" className="bg-green-50 text-green-700 border-none">
                                    {client.totalSpent}
                                </Badge>
                            </div>

                            <div className="border-t border-gray-100 pt-4 flex justify-between items-center text-sm text-gray-500">
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} />
                                    <span>{client.lastVisit}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="Appeler">
                                        <Phone size={16} />
                                    </button>
                                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="Email">
                                        <Mail size={16} />
                                    </button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
