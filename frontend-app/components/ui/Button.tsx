import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'record';
    size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
        const variants = {
            primary: "bg-black text-white hover:bg-lvmh-gold hover:scale-[1.02] active:scale-[0.98]",
            secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
            outline: "border border-gray-200 bg-transparent hover:border-black hover:bg-gray-50",
            ghost: "bg-transparent hover:bg-gray-50 text-gray-600 hover:text-black",
            record: "bg-red-500 text-white rounded-full hover:bg-red-600 hover:scale-110 active:scale-90 shadow-lg shadow-red-200"
        };

        const sizes = {
            sm: "h-8 px-4 text-xs",
            md: "h-12 px-6 text-sm",
            lg: "h-14 px-8 text-base",
        };

        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center rounded-xl font-bold uppercase tracking-widest transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none",
                    variants[variant],
                    size !== 'md' && variant === 'record' ? '' : sizes[size], // Record button might have custom sizing logic
                    variant === 'record' && "w-16 h-16 p-0",
                    className
                )}
                {...props}
            />
        );
    }
);
