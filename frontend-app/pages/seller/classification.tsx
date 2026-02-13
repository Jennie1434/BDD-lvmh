import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { CockpitLayout } from '../../components/layout/CockpitLayout';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, Check, Share2, Info, Mic } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranscription } from '../../context/TranscriptionContext';

// Mock Data for Categories
const categoryData: Record<string, any> = {
    'sacs': {
        title: "Maroquinerie - Sacs",
        description: "L'excellence du savoir-faire maroquinier. Nos sacs incarnent l'élégance intemporelle et l'innovation créative de la Maison.",
        specs: [
            "Cuir pleine fleur tanné végétal",
            "Finitions métalliques laiton palladié",
            "Doublure textile résistante",
            "Cousu sellier main"
        ],
        image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=1000&auto=format&fit=crop"
    },
    'pap': {
        title: "Prêt-à-porter",
        description: "Des collections audacieuses alliant confort et sophistication. Des coupes modernes pour une silhouette affirmée.",
        specs: [
            "Tissus techniques italiens",
            "Coupes structurées",
            "Détails signature",
            "Fabrication européenne"
        ],
        image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop"
    },
    'joaillerie': {
        title: "Haute Joaillerie",
        description: "L'éclat des pierres les plus rares sublimées par nos maîtres joailliers. Des pièces uniques d'exception.",
        specs: [
            "Or 18 carats certifié éthique",
            "Diamants VVS1 minimum",
            "Sertissage invisible",
            "Certificat d'authenticité GIA"
        ],
        image: "https://images.unsplash.com/photo-1515562141207-7a88fb052571?q=80&w=1000&auto=format&fit=crop"
    },
    'default': {
        title: "Catégorie",
        description: "Sélectionnez une catégorie depuis l'arbre taxonomique pour voir les détails.",
        specs: ["Caractéristique 1", "Caractéristique 2"],
        image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1000&auto=format&fit=crop"
    }
};

export default function ClassificationPage() {
    const router = useRouter();
    const { category } = router.query;
    const { analysis } = useTranscription();

    // 1. Check if analysis exists
    if (!analysis) {
        return (
            <CockpitLayout>
                <Head>
                    <title>LVMH - Classification</title>
                </Head>
                <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 text-center">
                    <div className="bg-gray-50 p-8 rounded-3xl mb-6">
                        <Mic size={48} className="mx-auto text-gray-400 mb-4" />
                        <h2 className="text-xl font-serif font-bold mb-2">Aucune classification disponible</h2>
                        <p className="text-gray-500 max-w-md mx-auto mb-6">
                            Veuillez effectuer une analyse audio pour accéder aux détails de classification, ou naviguez depuis l'arbre taxonomique.
                        </p>
                        <Button onClick={() => router.push('/seller')}>
                            Aller à l'enregistrement
                        </Button>
                    </div>
                </div>
            </CockpitLayout>
        );
    }

    // 2. Determine Category strategy
    // Priority: URL Param > AI Analysis Deduction > Default
    let activeKey = category as string;

    const primaryPath = analysis.taxonomy_paths?.[0] || analysis.taxonomy_path;

    if (!activeKey && primaryPath) {
        const path = primaryPath.toLowerCase();
        if (path.includes('sac')) activeKey = 'sacs';
        else if (path.includes('porter') || path.includes('mode')) activeKey = 'pap';
        else if (path.includes('joaillerie') || path.includes('montre')) activeKey = 'joaillerie';
        else if (path.includes('parfum') || path.includes('cosm')) activeKey = 'default'; // Or add parfums to data
    }

    const data = categoryData[activeKey] || categoryData['default'];

    return (
        <CockpitLayout>
            <Head>
                <title>LVMH - Classification</title>
            </Head>

            <div className="max-w-6xl mx-auto p-8">
                {/* Back Button */}
                <Button
                    variant="ghost"
                    className="mb-8 pl-0 hover:bg-transparent hover:text-lvmh-gold"
                    onClick={() => router.push('/seller/taxonomy')}
                >
                    <ArrowLeft size={20} className="mr-2" /> Retour à la Taxonomie
                </Button>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Image Column */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="relative h-[600px] rounded-3xl overflow-hidden shadow-2xl"
                    >
                        <img
                            src={data.image}
                            alt={data.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                            <Badge variant="gold" className="text-sm px-4 py-2">
                                Classification {activeKey ? `#${activeKey}` : ''}
                            </Badge>
                        </div>
                    </motion.div>

                    {/* Content Column */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex flex-col justify-center"
                    >
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-4">Zoom avec infos</span>
                        <h1 className="font-serif text-5xl font-bold mb-6 text-gray-900 leading-tight">
                            {data.title}
                        </h1>
                        <p className="text-gray-600 text-lg leading-relaxed mb-8 border-l-4 border-lvmh-gold pl-6 py-2">
                            {data.description}
                        </p>

                        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm mb-8">
                            <h3 className="font-bold text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Info size={16} /> Caractéristiques Techniques
                            </h3>
                            <ul className="space-y-4">
                                {data.specs.map((spec: string, i: number) => (
                                    <li key={i} className="flex items-center gap-3 text-gray-700">
                                        <div className="w-6 h-6 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                                            <Check size={14} />
                                        </div>
                                        {spec}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="flex gap-4">
                            <Button className="flex-1 bg-black text-white h-12 text-sm uppercase tracking-widest">
                                Voir les produits liés
                            </Button>
                            <Button variant="outline" className="h-12 w-12 p-0 flex items-center justify-center">
                                <Share2 size={20} />
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </CockpitLayout>
    );
}
