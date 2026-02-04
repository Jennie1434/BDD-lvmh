import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

// Données initiales vides qui seront remplies par l'API
const INITIAL_DATA: any[] = [];

export default function Dashboard() {
    const [filter, setFilter] = useState('All');
    const [data, setData] = useState<any[]>([]);
    const [stats, setStats] = useState({ total: 0, cadeaux: 0, perso: 0 });
    const [isCleaning, setIsCleaning] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [cleanStatus, setCleanStatus] = useState<string | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const resp = await fetch('http://localhost:8000/api/transcriptions');
            if (resp.ok) {
                const realData = await resp.json();
                setData(realData);

                // Calculer les stats en temps réel
                const total = realData.length;
                const cadeaux = realData.filter((d: any) => d.Intention === 'Cadeau').length;
                const perso = realData.filter((d: any) => d.Intention === 'Achat personnel').length;
                setStats({ total, cadeaux, perso });
            }
        } catch (err) {
            console.error("Failed to fetch data:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const runCleanup = async () => {
        setIsCleaning(true);
        setCleanStatus("Lancement du nettoyage...");
        try {
            const resp = await fetch('http://localhost:8000/api/run-cleanup', { method: 'POST' });
            const result = await resp.json();
            if (result.status === 'success') {
                setCleanStatus("✅ Nettoyage terminé !");
                await fetchData(); // Refresh data after cleaning
            } else {
                setCleanStatus("❌ Erreur : " + (result.error || "Script failed"));
            }
        } catch (err) {
            setCleanStatus("❌ Erreur de connexion au serveur Python");
        } finally {
            setIsCleaning(false);
            setTimeout(() => setCleanStatus(null), 5000);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans p-4 md:p-8">
            <Head>
                <title>Insights Dashboard | LVMH</title>
            </Head>

            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tighter text-white uppercase mb-2">
                            Insights <span className="text-lvmh-gold">Dashboard</span>
                        </h1>
                        <p className="text-gray-400 font-light">Analyse des transcriptions clients en temps réel</p>
                    </div>
                    <div className="flex gap-4 items-center">
                        {cleanStatus && (
                            <span className="text-xs font-medium animate-pulse text-lvmh-gold">{cleanStatus}</span>
                        )}
                        <button
                            onClick={runCleanup}
                            disabled={isCleaning}
                            className={`px-8 py-3 bg-lvmh-gold text-black font-bold rounded-full hover:scale-105 active:scale-95 transition-all uppercase text-xs tracking-widest shadow-[0_0_20px_rgba(201,166,100,0.3)] ${isCleaning ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isCleaning ? 'Nettoyage en cours...' : 'Lancer le Nettoyage'}
                        </button>
                        <Link href="/">
                            <button className="px-6 py-2 border border-lvmh-gold/30 text-lvmh-gold rounded-full hover:bg-lvmh-gold/10 transition-all uppercase text-xs tracking-widest">
                                Retour au Slider
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-gray-900/50 border border-white/10 p-6 rounded-2xl backdrop-blur-xl">
                        <h3 className="text-gray-500 text-xs uppercase tracking-widest mb-2 font-semibold">Total Transcriptions</h3>
                        <p className="text-4xl font-bold">{stats.total}</p>
                    </div>
                    <div className="bg-gray-900/50 border border-white/10 p-6 rounded-2xl backdrop-blur-xl">
                        <h3 className="text-gray-500 text-xs uppercase tracking-widest mb-2 font-semibold">Intentions Cadeaux</h3>
                        <p className="text-4xl font-bold text-lvmh-gold">{stats.cadeaux}</p>
                    </div>
                    <div className="bg-gray-900/50 border border-white/10 p-6 rounded-2xl backdrop-blur-xl">
                        <h3 className="text-gray-500 text-xs uppercase tracking-widest mb-2 font-semibold">Achat Personnel</h3>
                        <p className="text-4xl font-bold text-white">{stats.perso}</p>
                    </div>
                </div>

                {/* Filters & Table */}
                <div className="bg-gray-900/30 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-md">
                    <div className="p-6 border-b border-white/5 flex gap-4">
                        {['All', 'Cadeau', 'Achat personnel'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-1.5 rounded-full text-xs transition-all ${filter === f ? 'bg-lvmh-gold text-black font-bold' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    <div className="overflow-x-auto">
                        {isLoading ? (
                            <div className="p-12 text-center text-gray-500 animate-pulse uppercase tracking-widest text-xs">
                                Chargement des données LVMH...
                            </div>
                        ) : data.length === 0 ? (
                            <div className="p-12 text-center text-gray-500 uppercase tracking-widest text-xs">
                                Aucune donnée disponible. Cliquez sur "Lancer le Nettoyage" pour commencer.
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/5">
                                        <th className="p-4 text-xs uppercase tracking-widest text-gray-500 font-bold">ID</th>
                                        <th className="p-4 text-xs uppercase tracking-widest text-gray-500 font-bold">Date</th>
                                        <th className="p-4 text-xs uppercase tracking-widest text-gray-500 font-bold">Transcription Nettoyée</th>
                                        <th className="p-4 text-xs uppercase tracking-widest text-gray-500 font-bold">Intention</th>
                                        <th className="p-4 text-xs uppercase tracking-widest text-gray-500 font-bold">Budget</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.filter(d => filter === 'All' || d.Intention === filter).map((row, idx) => (
                                        <tr key={row.ID || idx} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                            <td className="p-4 text-gray-500 text-sm">#{row.ID}</td>
                                            <td className="p-4 text-gray-400 text-sm whitespace-nowrap">{row.Date}</td>
                                            <td className="p-4 text-white font-medium text-sm leading-relaxed">{row.Clean_Transcription}</td>
                                            <td className="p-4">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${row.Intention === 'Cadeau' ? 'bg-lvmh-gold/20 text-lvmh-gold' : 'bg-blue-500/20 text-blue-400'
                                                    }`}>
                                                    {row.Intention}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`text-sm ${row.Budget === '20K+' ? 'text-green-400 font-bold' : 'text-gray-400'
                                                    }`}>
                                                    {row.Budget}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        body { font-family: 'Inter', sans-serif; background: #000; }
        .text-lvmh-gold { color: #C9A664; }
        .bg-lvmh-gold { background-color: #C9A664; }
        .border-lvmh-gold { border-color: #C9A664; }
      `}</style>
        </div>
    );
}
