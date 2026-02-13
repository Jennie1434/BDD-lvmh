import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Mic, Mail } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Interaction } from '../../lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface InteractionListProps {
    limit?: number;
    clientId?: string;
}

export const InteractionList = ({ limit = 5, clientId }: InteractionListProps) => {
    const [interactions, setInteractions] = useState<Interaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInteractions = async () => {
            let query = supabase
                .from('interactions')
                .select('*')
                .order('date', { ascending: false })
                .limit(limit);

            if (clientId) {
                query = query.eq('client_id', clientId);
            }

            const { data, error } = await query;

            if (error) {
                // console.error('Error fetching interactions:', error);
                // MOCK DATA
                setInteractions([
                    { id: '1', client_id: '1', seller_id: 'me', date: new Date().toISOString(), type: 'voice', intent_score: 85, summary: 'Client intéressé par Capucines BB', ai_analysis: { intention: 'Achat', phase: 'Closing', produits: ['Capucines'], budget: '5k-20k', emotion: 'Joie', type_client: 'VIP', timing: 'Cette semaine', intent_score: 85 } },
                    { id: '2', client_id: '1', seller_id: 'me', date: '2023-10-20T10:00:00Z', type: 'email', intent_score: 40, summary: 'Demande de catalogue', ai_analysis: { intention: 'Renseignement', phase: 'Découverte', produits: [], budget: 'Non précisé', emotion: 'Neutre', type_client: 'VIP', timing: 'Indéfini', intent_score: 40 } },
                ]);
            } else {
                setInteractions(data as Interaction[]);
            }
            setLoading(false);
        };

        fetchInteractions();
    }, [clientId, limit]);

    if (loading) return <div className="animate-pulse h-20 bg-gray-100 rounded-xl mb-2"></div>;

    return (
        <div className="space-y-4">
            {interactions.map((interaction) => (
                <Card key={interaction.id} className="p-4 flex gap-4 items-start" hoverEffect>
                    <div className={`p-3 rounded-full ${interaction.type === 'voice' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                        {interaction.type === 'voice' ? <Mic size={18} /> : <Mail size={18} />}
                    </div>

                    <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-sm text-gray-900 line-clamp-1">
                                {interaction.summary || 'Nouvelle interaction'}
                            </h4>
                            <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                {format(new Date(interaction.date), 'dd MMM', { locale: fr })}
                            </span>
                        </div>

                        <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                            {interaction.ai_analysis?.phase} • {interaction.ai_analysis?.intention}
                        </p>

                        <div className="flex gap-2">
                            {interaction.ai_analysis?.produits.map(p => (
                                <Badge key={p} variant="neutral" className="text-[9px] py-0.5 px-2">{p}</Badge>
                            ))}
                            {interaction.intent_score > 70 && (
                                <Badge variant="red" className="text-[9px] py-0.5 px-2">HOT {interaction.intent_score}</Badge>
                            )}
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
};
