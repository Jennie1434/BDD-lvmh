import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { cleanTranscription } from '../utils/textCleaner';
import { UserProfile, Client, Interaction } from '../lib/types';
import { Session } from '@supabase/supabase-js';

interface SupabaseContextType {
    user: UserProfile | null;
    session: Session | null;
    loading: boolean;
    myClients: Client[];
    myInteractions: Interaction[];
    colleagues: UserProfile[];
    loadingClients: boolean;
    refreshClients: () => Promise<void>;
    signOut: () => Promise<void>;
    addInteraction: (interaction: Interaction) => Promise<void>;
    saveTranscription: (text: string) => Promise<void>;
    checkLastTranscription: () => Promise<any>;
}

const SupabaseContext = createContext<SupabaseContextType>({
    user: null,
    session: null,
    loading: true,
    myClients: [],
    myInteractions: [],
    colleagues: [],
    loadingClients: false,
    refreshClients: async () => { },
    signOut: async () => { },
    addInteraction: async () => { },
    saveTranscription: async () => { },
    checkLastTranscription: async () => null,
});

export const SupabaseProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [myClients, setMyClients] = useState<Client[]>([]);
    const [myInteractions, setMyInteractions] = useState<Interaction[]>([]);
    const [colleagues, setColleagues] = useState<UserProfile[]>([]);
    const [loadingClients, setLoadingClients] = useState(false);

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) fetchUserProfile(session.user.id);
            else setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) fetchUserProfile(session.user.id);
            else {
                setUser(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchUserProfile = async (userId: string) => {
        try {
            const sessionEmail = session?.user?.email || '';

            if (sessionEmail) {
                const { data: sellerByEmail, error: sellerByEmailError } = await supabase
                    .from('sellers')
                    .select('*')
                    .eq('email', sessionEmail)
                    .single();

                if (!sellerByEmailError && sellerByEmail) {
                    setUser(sellerByEmail as UserProfile);
                    return;
                }
            }

            const { data: sellerById, error: sellerByIdError } = await supabase
                .from('sellers')
                .select('*')
                .eq('id', userId)
                .single();

            if (!sellerByIdError && sellerById) {
                setUser(sellerById as UserProfile);
                return;
            }

            // MOCK USER FOR DEMO
            console.warn('No seller match for this auth user');
            setUser({
                id: userId,
                email: sessionEmail || 'demo@lvmh.com',
                role: 'vendeur',
                first_name: sessionEmail ? sessionEmail.split('@')[0] : 'Vendeur',
                last_name: '',
            });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchClientsAndInteractions = async () => {
        if (!user) return;
        setLoadingClients(true);
        try {
            // Charger les vrais clients depuis l'API
            const response = await fetch(`/api/seller-clients?sellerId=${user.id}`);
            
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data.clients) {
                    const clients: Client[] = result.data.clients.map((c: any) => ({
                        id: c.id,
                        full_name: c.full_name,
                        first_name: c.full_name?.split(' ')[0] || c.full_name || 'Client',
                        last_name: c.full_name?.split(' ').slice(1).join(' ') || '',
                        total_spent: c.estimated_budget || 0,
                        last_interaction_date: c.last_interaction_at || new Date().toISOString(),
                        next_contact_at: c.next_contact_at || c.analysis?.next_contact_at || null,
                        tags: c.dominant_emotion ? [c.dominant_emotion] : [],
                        assigned_to: user.id,
                        analysis: c.analysis || null
                    }));
                    setMyClients(clients);
                }
            } else {
                console.error('Erreur API seller-clients');
                setMyClients([]);
            }

            // Charger les interactions depuis la vraie table
            const { data: interactionsData, error: interactionsError } = await supabase
                .from('interactions')
                .select('*')
                .eq('seller_id', user.id)
                .limit(20);

            if (!interactionsError && interactionsData) {
                setMyInteractions(interactionsData as Interaction[]);
            }

        } catch (e) {
            console.error('Erreur fetchClientsAndInteractions:', e);
            setMyClients([]);
        } finally {
            setLoadingClients(false);
        }
    };

    useEffect(() => {
        if (user) fetchClientsAndInteractions();
    }, [user]);

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    const addInteraction = async (interaction: Interaction) => {
        try {
            // 1. Optimistic UI Update
            setMyInteractions(prev => [interaction, ...prev]);

            // 2. Persist to Supabase
            const { error } = await supabase
                .from('interactions') // Keep this for normal interactions if needed, but user wants specific behavior for batch
                .insert([interaction]);

            if (error) {
                console.error('Error adding interaction to Supabase:', error);
            }
        } catch (e) {
            console.error('Exception adding interaction:', e);
        }
    };

    const saveTranscription = async (text: string) => {
        try {
            const cleanedText = cleanTranscription(text).trim();
            if (!cleanedText) {
                return;
            }
            const { error } = await supabase
                .from('transcriptions')
                .insert([{ raw_text: cleanedText }]);

            if (error) {
                console.error('Error saving transcription:', error);
            } else {
                console.log('Transcription saved successfully to Supabase!');
            }
        } catch (e) {
            console.error('Exception saving transcription:', e);
        }
    };

    const checkLastTranscription = async () => {
        try {
            const { data, error } = await supabase
                .from('transcriptions')
                .select('*')
                .order('created_at', { ascending: false }) // Assuming created_at exists, or just grab any
                .limit(1);

            if (error) {
                console.error('Check failed:', error);
                return null;
            }
            return data?.[0];
        } catch (e) {
            console.error('Check exception:', e);
            return null;
        }
    };

    return (
        <SupabaseContext.Provider value={{
            user,
            session,
            loading,
            myClients,
            myInteractions,
            colleagues,
            loadingClients,
            refreshClients: fetchClientsAndInteractions,
            signOut,
            addInteraction,
            saveTranscription,
            checkLastTranscription
        }}>
            {children}
        </SupabaseContext.Provider>
    );
};

export const useSupabase = () => useContext(SupabaseContext);
