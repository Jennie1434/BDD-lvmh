import React from 'react';
import { Badge } from '../ui/Badge';
import { Calendar, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';

interface TaskCardProps {
    type: 'rappel' | 'closing' | 'froid';
    clientName: string;
    details: string;
    date?: string;
    priority?: 'high' | 'medium' | 'low';
}

export const TaskCard = ({ type, clientName, details, date, priority }: TaskCardProps) => {

    const getIcon = () => {
        if (type === 'rappel') return <Calendar size={16} className="text-orange-500" />;
        if (type === 'closing') return <CheckCircle size={16} className="text-green-500" />;
        return <ArrowRight size={16} className="text-gray-400" />;
    };

    const getBadge = () => {
        if (type === 'closing') return <Badge variant="green" size="sm">Chaud</Badge>;
        if (priority === 'high') return <Badge variant="gold" size="sm">Urgent</Badge>;
        return null;
    };

    return (
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${type === 'closing' ? 'bg-green-50' : (type === 'rappel' ? 'bg-orange-50' : 'bg-gray-50')}`}>
                    {getIcon()}
                </div>
                <div>
                    <h4 className="font-serif font-bold text-gray-900">{clientName}</h4>
                    <p className="text-xs text-gray-500">{details}</p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {getBadge()}
                {date && <span className="text-xs font-mono text-gray-300">{date}</span>}
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                    <ArrowRight size={14} />
                </Button>
            </div>
        </div>
    );
};
