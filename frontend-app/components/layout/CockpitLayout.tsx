import React, { useEffect, useState } from 'react';
import { Mic, Network, FileText, MessageSquare, LayoutDashboard, Users, Bell, User, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
// import { useSupabase } from '../../hooks/useSupabase'; // Disable Supabase for demo profile
import { useSeller } from '../../context/SellerContext';
import { SellerProfileModal } from '../features/SellerProfileModal';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';

export const CockpitLayout = ({ children }: { children: React.ReactNode }) => {
    // const { user, signOut } = useSupabase();
    const { seller, loading } = useSeller();
    const router = useRouter();
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            if (!data.session) {
                router.replace('/login');
            }
        });
    }, [router]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.replace('/login');
    };

    const navItems = [
        { icon: Mic, label: 'Audio', path: '/seller' },
        { icon: Network, label: 'Taxonomie', path: '/seller/taxonomy' },
        { icon: FileText, label: 'Classification', path: '/seller/classification' },
        { icon: MessageSquare, label: 'Messagerie', path: '/seller/messages' },
        { icon: LayoutDashboard, label: 'Dashboard', path: '/seller/dashboard' },
        { icon: Users, label: 'Suivi Client', path: '/seller/clients' },
    ];

    const displayName = loading
        ? 'Chargement...'
        : (seller.name || seller.email || '');
    const displayRole = loading
        ? ''
        : (seller.role || '');
    const displayInitials = seller.avatarInitials !== '--'
        ? seller.avatarInitials
        : (displayName ? displayName.substring(0, 2).toUpperCase() : '--');

    return (
        <div className="min-h-screen bg-[#F7F7F7] text-[#1A1A1A] font-sans flex flex-col">
            {/* Top Navbar */}
            <header className="bg-white border-b border-gray-100 h-16 flex items-center justify-between px-8 sticky top-0 z-50 shadow-sm">
                {/* Logo */}
                <div className="flex items-center gap-8">
                    <h1 className="font-serif text-xl tracking-[0.2em] font-bold text-black">
                        LVMH
                    </h1>

                    {/* Navigation Links (Desktop) */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => {
                            const isActive = router.pathname === item.path;
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.path}
                                    href={item.path}
                                    className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${isActive
                                        ? 'text-black bg-gray-100'
                                        : 'text-gray-400 hover:text-black hover:bg-gray-50'
                                        }`}
                                >
                                    <Icon size={16} className={isActive ? 'text-black' : 'text-gray-400'} />
                                    <span>{item.label}</span>
                                    {isActive && (
                                        <motion.div
                                            layoutId="navbar-indicator"
                                            className="absolute bottom-0 left-0 w-full h-[2px] bg-black"
                                            initial={false}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-6">
                    <button className="relative p-2 text-gray-400 hover:text-black transition-colors">
                        <Link href="/seller/messages">
                            <MessageSquare size={20} />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse border border-white"></span>
                        </Link>
                    </button>

                    <button
                        className="p-2 text-gray-400 hover:text-black transition-colors"
                        onClick={handleSignOut}
                        aria-label="Se deconnecter"
                        title="Se deconnecter"
                        type="button"
                    >
                        <LogOut size={18} />
                    </button>

                    <div className="h-8 w-px bg-gray-200 mx-2"></div>

                    {/* Seller Profile Trigger */}
                    <div
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={() => setIsProfileOpen(true)}
                    >
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-bold text-black group-hover:text-lvmh-gold transition-colors">{displayName}</p>
                            {displayRole ? (
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest">{displayRole}</p>
                            ) : null}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-serif text-xs border border-gray-200 group-hover:scale-105 transition-transform">
                            {displayInitials}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#FAFAFA] relative">
                {children}
            </main>

            {/* Profile Modal */}
            <SellerProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
        </div>
    );
};
