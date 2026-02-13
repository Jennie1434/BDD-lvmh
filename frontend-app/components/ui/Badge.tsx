import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'gold' | 'black' | 'green' | 'red' | 'neutral' | 'outline';
    className?: string;
}

export const Badge = ({ children, variant = 'neutral', className }: BadgeProps) => {
    const variants = {
        gold: "bg-yellow-50 text-yellow-700 border-yellow-200",
        black: "bg-gray-900 text-white border-transparent",
        green: "bg-emerald-50 text-emerald-700 border-emerald-200",
        red: "bg-rose-50 text-rose-700 border-rose-200",
        outline: "bg-transparent border-gray-200 text-gray-600",
        neutral: "bg-gray-50 text-gray-600 border-gray-200",
    };

    return (
        <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border", variants[variant], className)}>
            {children}
        </span>
    );
};
