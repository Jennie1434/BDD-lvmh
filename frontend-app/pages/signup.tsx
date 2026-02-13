import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight } from 'lucide-react';

export default function SignupPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            if (data.session) {
                router.replace('/seller');
            }
        });
    }, [router]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('Mot de passe trop court (6 caracteres minimum).');
            return;
        }

        if (password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }

        setLoading(true);

        try {
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (signUpError) {
                setError(signUpError.message || 'Inscription impossible.');
                return;
            }

            const authUser = signUpData.user;
            if (authUser?.id && authUser.email) {
                await fetch('/api/ensure-seller', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: authUser.id,
                        email: authUser.email,
                    }),
                });
            }

            router.replace('/seller');
        } catch (e) {
            setError('Inscription impossible.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F7F4F1] text-[#1A1A1A]">
            <Head>
                <title>LVMH - Creer un compte</title>
                <meta name="description" content="Sign up access to LVMH cockpit." />
            </Head>

            <div className="min-h-screen flex">
                <div className="hidden lg:flex w-1/2 p-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="max-w-lg"
                    >
                        <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-4">LVMH</p>
                        <h1 className="text-4xl font-serif font-bold leading-tight mb-6">
                            Executive excellence cockpit
                        </h1>
                        <p className="text-gray-600 leading-relaxed">
                            Creez un compte interne pour acceder sans email de confirmation.
                        </p>
                        <div className="mt-10 flex items-center gap-4 text-xs uppercase tracking-widest text-gray-400">
                            <span className="w-10 h-px bg-gray-300"></span>
                            secure access
                        </div>
                    </motion.div>
                </div>

                <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="w-full max-w-md bg-white border border-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-3xl p-10"
                    >
                        <div className="mb-8">
                            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Inscription</p>
                            <h2 className="text-2xl font-serif font-bold mt-2">Creer un compte</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">Email</label>
                                <div className="flex items-center gap-3 border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-black transition-colors">
                                    <Mail size={16} className="text-gray-400" />
                                    <input
                                        type="email"
                                        className="w-full bg-transparent outline-none text-sm"
                                        placeholder="prenom.nom@lvmh.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">Mot de passe</label>
                                <div className="flex items-center gap-3 border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-black transition-colors">
                                    <Lock size={16} className="text-gray-400" />
                                    <input
                                        type="password"
                                        className="w-full bg-transparent outline-none text-sm"
                                        placeholder="********"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">Confirmer</label>
                                <div className="flex items-center gap-3 border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-black transition-colors">
                                    <Lock size={16} className="text-gray-400" />
                                    <input
                                        type="password"
                                        className="w-full bg-transparent outline-none text-sm"
                                        placeholder="********"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {error ? (
                                <p className="text-sm text-red-500">{error}</p>
                            ) : null}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-black text-white text-xs uppercase tracking-widest py-4 transition hover:bg-gray-900 disabled:opacity-60"
                            >
                                {loading ? 'Creation...' : 'Creer le compte'}
                                <ArrowRight size={14} />
                            </button>
                        </form>

                        <div className="mt-8 text-xs text-gray-400 flex items-center justify-between">
                            <button
                                type="button"
                                className="text-gray-500 hover:text-black transition-colors"
                                onClick={() => router.push('/login')}
                            >
                                Deja un compte
                            </button>
                            <button
                                type="button"
                                className="text-gray-500 hover:text-black transition-colors"
                                onClick={() => router.push('/')}
                            >
                                Retour au site
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
