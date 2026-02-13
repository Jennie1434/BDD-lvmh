import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Sparkles } from 'lucide-react';
import { AnalysisResult } from '../../lib/types';

interface RecommendationBoxProps {
    analysis?: AnalysisResult;
}

export const RecommendationBox = ({ analysis }: RecommendationBoxProps) => {
    if (!analysis) return null;

    const getRecommendation = () => {
        if (analysis.intention === 'Cadeau') return "Proposer l'emballage personnalisé et la carte manuscrite.";
        if (analysis.phase === 'Closing') return "Proposer un verre de champagne et vérifier le profil client sur l'iPad.";
        if (analysis.budget === '20k+') return "Inviter au salon privé pour une expérience exclusive.";
        return "Proposer de découvrir la nouvelle collection en lien avec ses goûts.";
    };

    return (
        <Card className="bg-gradient-to-r from-gray-900 to-black text-white border-none relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles size={100} />
            </div>

            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3 text-lvmh-gold">
                    <Sparkles size={16} />
                    <span className="text-xs font-bold uppercase tracking-widest">Recommandation IA</span>
                </div>

                <p className="font-serif text-lg leading-relaxed mb-6">
                    "{getRecommendation()}"
                </p>

                <div className="flex gap-3">
                    <Button size="sm" className="bg-white text-black hover:bg-gray-200">
                        Suivre l'action
                    </Button>
                    <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10 hover:border-white">
                        Ignorer
                    </Button>
                </div>
            </div>
        </Card>
    );
};
