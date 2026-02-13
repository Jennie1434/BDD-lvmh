import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ClientTwin as ClientTwinType } from '../../lib/types';
import { Heart, TrendingUp, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

// Mock data generator since we don't have real DB for twins yet
const mockTwin: ClientTwinType = {
    client_id: '1',
    life_moments: ['Anniversaire 12 Mai', 'Mariage 2024'],
    preferences: ['Or Rose', 'Cuir Exotique', 'Pas de logos'],
    purchase_probability: 85,
    next_best_action: 'Inviter Event Joaillerie',
    top_product_categories: ['Haute Joaillerie', 'Maroquinerie', 'Souliers'],
    emotion_trend: 'happy'
};

export const ClientTwin = ({ clientId }: { clientId?: string }) => {
    const [twin, setTwin] = useState<ClientTwinType | null>(null);

    useEffect(() => {
        // Simulate fetch
        setTimeout(() => setTwin(mockTwin), 500);
    }, [clientId]);

    if (!twin) return <div className="h-64 bg-gray-50 rounded-2xl animate-pulse" />;

    return (
        <div className="grid grid-cols-1 gap-4">
            <Card className="bg-[#FDFBF7] border-lvmh-gold/20">
                <h4 className="font-serif text-lg font-bold mb-4 flex items-center gap-2">
                    Digital Client Twin <Badge variant="gold">VIP</Badge>
                </h4>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="space-y-1">
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest">Probabilité Achat</span>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${twin.purchase_probability}%` }}
                                    className="h-full bg-green-500"
                                />
                            </div>
                            <span className="text-sm font-bold">{twin.purchase_probability}%</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest">Tendance Émotion</span>
                        <div className="flex items-center gap-2 text-green-600 font-bold text-sm">
                            <TrendingUp size={16} /> Positive
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <span className="flex items-center gap-2 text-xs font-bold uppercase text-gray-400 mb-2">
                            <Heart size={12} /> Préférences
                        </span>
                        <div className="flex flex-wrap gap-2">
                            {twin.preferences.map(p => <Badge key={p} variant="neutral" className="bg-white">{p}</Badge>)}
                        </div>
                    </div>

                    <div>
                        <span className="flex items-center gap-2 text-xs font-bold uppercase text-gray-400 mb-2">
                            <Calendar size={12} /> Moments de vie
                        </span>
                        <div className="flex flex-wrap gap-2">
                            {twin.life_moments.map(m => <Badge key={m} variant="black" className="bg-gray-900">{m}</Badge>)}
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};
