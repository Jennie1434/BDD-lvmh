import React from 'react';
import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    hoverEffect?: boolean;
}

export const Card = ({ children, className, onClick, hoverEffect = false }: CardProps) => {
    return (
        <motion.div
            whileHover={hoverEffect ? { y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.08)" } : {}}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={onClick}
            className={cn(
                "bg-white rounded-2xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-gray-50",
                hoverEffect && "cursor-pointer",
                className
            )}
        >
            {children}
        </motion.div>
    );
};
