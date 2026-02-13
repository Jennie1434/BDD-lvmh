import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface SellerInfo {
    id?: string;
    name: string;
    role: string;
    boutique?: string;
    avatarInitials: string;
    email?: string;
}

interface SellerContextType {
    seller: SellerInfo;
    updateSeller: (info: Partial<SellerInfo>) => Promise<void>;
    loading: boolean;
}

const defaultSeller: SellerInfo = {
    name: '',
    role: '',
    boutique: '',
    avatarInitials: '--'
};

const SellerContext = createContext<SellerContextType | undefined>(undefined);

export function SellerProvider({ children }: { children: ReactNode }) {
    const [seller, setSeller] = useState<SellerInfo>(defaultSeller);
    const [loading, setLoading] = useState(true);

    // Load from Supabase on mount
    useEffect(() => {
        let isMounted = true;

        const loadSellerData = async (authUser: { id: string; email?: string | null } | null) => {
            try {
                if (!authUser?.id) {
                    if (isMounted) {
                        setSeller(defaultSeller);
                    }
                    return;
                }

                if (authUser.email) {
                    await fetch('/api/ensure-seller', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: authUser.id,
                            email: authUser.email,
                        }),
                    });
                }

                const emailParam = authUser.email ? `email=${encodeURIComponent(authUser.email)}` : '';
                const idParam = `sellerId=${authUser.id}`;
                const query = emailParam || idParam;
                const response = await fetch(`/api/seller-profile?${query}`);

                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.data && isMounted) {
                        const sellerData = result.data;
                        const names = sellerData.full_name?.split(' ') || ['V'];
                        const initials = names.length > 1
                            ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
                            : (sellerData.full_name?.substring(0, 2) || 'AV').toUpperCase();

                        setSeller({
                            id: sellerData.id,
                            name: sellerData.full_name || 'Vendeur',
                            role: sellerData.expertise || sellerData.role || 'Expert',
                            boutique: sellerData.location || 'LVMH',
                            avatarInitials: initials,
                            email: sellerData.email
                        });
                        return;
                    }
                }

                if (isMounted) {
                    const emailPrefix = authUser.email ? authUser.email.split('@')[0] : 'Utilisateur';
                    const initials = emailPrefix.substring(0, 2).toUpperCase();
                    setSeller({
                        id: authUser.id,
                        name: emailPrefix,
                        role: '',
                        boutique: '',
                        avatarInitials: initials,
                        email: authUser.email || undefined,
                    });
                }
            } catch (e) {
                console.error("Failed to load seller data", e);
            }
        };

        supabase.auth.getSession().then(({ data }) => {
            if (!isMounted) return;
            loadSellerData(data.session?.user ?? null).finally(() => {
                if (isMounted) setLoading(false);
            });
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!isMounted) return;
            setLoading(true);
            loadSellerData(session?.user ?? null).finally(() => {
                if (isMounted) setLoading(false);
            });
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const updateSeller = async (info: Partial<SellerInfo>) => {
        if (!seller.id) {
            return;
        }

        const updates = {
            full_name: info.name ?? seller.name,
            expertise: info.role ?? seller.role,
            location: info.boutique ?? seller.boutique,
        };

        const { error } = await supabase
            .from('sellers')
            .update(updates)
            .eq('id', seller.id);

        if (error) {
            console.error('Failed to update seller:', error);
            return;
        }

        const names = (info.name ?? seller.name).split(' ');
        const initials = names.length > 1
            ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
            : (info.name ?? seller.name).substring(0, 2).toUpperCase();

        setSeller({
            ...seller,
            ...info,
            avatarInitials: initials,
        });
    };

    return (
        <SellerContext.Provider value={{ seller, updateSeller, loading }}>
            {children}
        </SellerContext.Provider>
    );
}

export function useSeller() {
    const context = useContext(SellerContext);
    if (context === undefined) {
        throw new Error('useSeller must be used within a SellerProvider');
    }
    return context;
}
