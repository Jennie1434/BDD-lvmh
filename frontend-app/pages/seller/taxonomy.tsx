import React from 'react';
import Head from 'next/head';
import { CockpitLayout } from '../../components/layout/CockpitLayout';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { useTranscription } from '../../context/TranscriptionContext';
import { Button } from '../../components/ui/Button';
import { Mic } from 'lucide-react';

// Custom Taxonomy Data based on User Request
const taxonomyData = {
    name: "LVMH Fashion",
    children: [
        {
            name: "Maroquinerie",
            id: "maroquinerie",
            children: [
                { name: "Sacs", id: "sacs" },
                { name: "Petite Maro.", id: "slg" }, // Shortened for UI
            ]
        },
        {
            name: "Prêt-à-Porter",
            id: "pap",
            children: [
                { name: "Vestes", id: "vestes" },
                { name: "Robes", id: "robes" },
            ]
        },
        {
            name: "Chaussures",
            id: "chaussures",
            children: [
                { name: "Escarpins", id: "escarpins" },
                { name: "Sneakers", id: "sneakers" },
            ]
        },
        {
            name: "Accessoires",
            id: "accessoires",
            children: [
                { name: "Foulards", id: "foulards" },
                { name: "Lunettes", id: "lunettes" },
            ]
        }
    ]
};

export default function TaxonomyPage() {
    const router = useRouter();
    const { analysis } = useTranscription();

    const handleNodeClick = (node: any) => {
        if (!node.children) {
            // Leaf node -> Go to Classification
            router.push(`/seller/classification?category=${node.id}`);
        }
    };

    // Dynamic Data Merging
    const dynamicData = React.useMemo(() => {
        const primaryPath = analysis?.taxonomy_paths?.[0] || analysis?.taxonomy_path;
        if (!analysis || !primaryPath || !analysis.produits) return taxonomyData;

        // Deep copy
        const newData = JSON.parse(JSON.stringify(taxonomyData));

        // Normalize for matching
        const normalize = (s: string) => s.toLowerCase().trim();
        const rawPath = primaryPath;
        // Handle " > " or ">" or just separate words if needed
        const pathParts = rawPath.includes('>') ? rawPath.split('>').map(normalize) : [normalize(rawPath)];

        console.log("Taxonomy Parsing:", { rawPath, pathParts });

        // Helper to find node case-insensitively
        const findNode = (nodes: any[], name: string) => {
            return nodes.find((n: any) => normalize(n.name).includes(name) || name.includes(normalize(n.name)));
        };

        // 1. Try to find the category (Level 1)
        let categoryNode = null;
        for (const part of pathParts) {
            categoryNode = findNode(newData.children, part);
            if (categoryNode) break;
        }

        if (categoryNode) {
            console.log("Found Category:", categoryNode.name);
            // 2. Try to find the sub-category (Level 2)
            let subNode = null;
            if (categoryNode.children) {
                for (const part of pathParts) {
                    subNode = findNode(categoryNode.children, part);
                    if (subNode) break;
                }
            }

            // If no subnode found, it might be because the path is just "Maroquinerie > Sacs" and we matched Maroquinerie, 
            // so we look for "Sacs" in the remaining parts.
            // Or if the AI just gave "Sacs", we might have found it as a category if we were lucky, but "Sacs" is a child.

            // Simplified logic: If we have a category, look for a child that matches any other part of the path
            if (!subNode && categoryNode.children) {
                // Try to match any child with any part of the path
                for (const child of categoryNode.children) {
                    for (const part of pathParts) {
                        if (normalize(child.name).includes(part) || part.includes(normalize(child.name))) {
                            subNode = child;
                            break;
                        }
                    }
                    if (subNode) break;
                }
            }

            if (subNode) {
                console.log("Found SubCategory:", subNode.name);
                const existingNames = subNode.children ? subNode.children.map((c: any) => normalize(c.name)) : [];

                const newProducts = analysis.produits
                    .filter((prod: string) => !existingNames.includes(normalize(prod)))
                    .map((prod: string, idx: number) => ({
                        name: prod,
                        id: `prod-${Date.now()}-${idx}`,
                        isNew: true // Flag to highlight
                    }));

                if (newProducts.length > 0) {
                    if (!subNode.children) subNode.children = [];
                    subNode.children = [...subNode.children, ...newProducts];
                }
            }
        } else {
            console.warn("Could not match category for path:", primaryPath);
        }
        return newData;
    }, [analysis]);

    if (!analysis) {
        return (
            <CockpitLayout>
                <Head>
                    <title>LVMH - Taxonomie</title>
                </Head>
                <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 text-center">
                    <div className="bg-gray-50 p-8 rounded-3xl mb-6">
                        <Mic size={48} className="mx-auto text-gray-400 mb-4" />
                        <h2 className="text-xl font-serif font-bold mb-2">Aucune analyse en cours</h2>
                        <p className="text-gray-500 max-w-md mx-auto mb-6">
                            Veuillez effectuer une analyse audio depuis la page d'accueil pour visualiser la taxonomie correspondante.
                        </p>
                        <Button onClick={() => router.push('/seller')}>
                            Aller à l'enregistrement
                        </Button>
                    </div>
                </div>
            </CockpitLayout>
        )
    }

    return (
        <CockpitLayout>
            <Head>
                <title>LVMH - Taxonomie</title>
            </Head>
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-8">
                <div className="text-center mb-12">
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Navigation</span>
                    <h1 className="font-serif text-4xl font-bold mt-2">Exploration du Catalogue</h1>
                    {(analysis.taxonomy_paths?.length || analysis.taxonomy_path) && (
                        <div className="mt-4 inline-flex items-center px-4 py-2 bg-black text-white rounded-full text-sm">
                            <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                            Détecté : {(analysis.taxonomy_paths?.length ? analysis.taxonomy_paths.join(' | ') : analysis.taxonomy_path)}
                        </div>
                    )}
                </div>

                {/* Organic Tree Container */}
                <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-sm p-12 border border-gray-100 min-h-[600px] flex items-center justify-center overflow-hidden">
                    <TreeVisualization data={dynamicData} onNodeClick={handleNodeClick} activePath={analysis.taxonomy_paths?.[0] || analysis.taxonomy_path} />
                </div>
            </div>
        </CockpitLayout>
    );
}

// Organic Tree Component adapted for 4 branches
const TreeVisualization = ({ data, onNodeClick, activePath }: { data: any, onNodeClick: (n: any) => void, activePath?: string }) => {

    // Helper to check if a node is part of the active path
    const isActive = (label: string) => activePath ? activePath.includes(label) : false;

    // Coordinates configuration
    const rootX = 100;
    const rootY = 250;
    const level1X = 300;
    const level2X = 600;

    // Spread branches vertically
    const level1Ys = [100, 200, 300, 400];

    return (
        <svg width="900" height="550" viewBox="0 0 900 550" className="w-full h-full">
            <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#000" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#C9A664" stopOpacity="0.5" />
                </linearGradient>
            </defs>

            {/* Root */}
            <Node x={rootX} y={rootY} label={data.name} onClick={() => { }} isRoot />

            {/* Dynamic Rendering based on Data Index (assuming 4 children) */}
            {data.children.map((child: any, i: number) => {
                const childY = level1Ys[i];
                return (
                    <React.Fragment key={child.name}>
                        {/* Branch to Level 1 */}
                        <Branch start={{ x: rootX, y: rootY }} end={{ x: level1X, y: childY }} active={isActive(child.name)} />

                        {/* Level 1 Node */}
                        <Node x={level1X} y={childY} label={child.name} onClick={() => { }} active={isActive(child.name)} />

                        {/* Level 2 Children (Leaves) */}
                        {child.children && child.children.map((leaf: any, j: number) => {
                            // Slight offset for leaves
                            const leafY = childY + (j === 0 ? -25 : 25);
                            return (
                                <React.Fragment key={leaf.name}>
                                    <Branch start={{ x: level1X, y: childY }} end={{ x: level2X, y: leafY }} active={isActive(leaf.name)} />
                                    <Node x={level2X} y={leafY} label={leaf.name} onClick={() => onNodeClick(leaf)} isLeaf active={isActive(leaf.name)} />
                                </React.Fragment>
                            )
                        })}
                    </React.Fragment>
                );
            })}

        </svg>
    );
};

const Branch = ({ start, end, active, dashed }: { start: { x: number, y: number }, end: { x: number, y: number }, active?: boolean, dashed?: boolean }) => {
    // Benzier curve for organic look
    const midX = (start.x + end.x) / 2;
    const path = `M ${start.x} ${start.y} C ${midX} ${start.y}, ${midX} ${end.y}, ${end.x} ${end.y}`;

    return (
        <motion.path
            d={path}
            fill="none"
            stroke={active ? "#000" : "#E5E7EB"}
            strokeWidth={active ? "3" : "2"}
            strokeDasharray={dashed ? "5,5" : "none"}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: "easeInOut" }}
        />
    );
}

const Node = ({ x, y, label, onClick, isRoot, isLeaf, active, isNew }: any) => {
    const fillColor = isRoot ? "black" : (isNew ? "#10B981" : (active ? "black" : (isLeaf ? "#C9A664" : "white")));
    const textColor = active ? "font-bold fill-black" : (isLeaf ? "font-medium fill-gray-900" : "font-semibold fill-gray-800");

    return (
        <g onClick={onClick} style={{ cursor: isLeaf ? 'pointer' : 'default' }}>
            <motion.circle
                cx={x}
                cy={y}
                r={isRoot ? 8 : (isNew ? 6 : 4)}
                fill={fillColor}
                stroke={isRoot ? "none" : (isLeaf && !isNew ? "none" : "#E5E7EB")}
                strokeWidth="2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={isLeaf ? { scale: 1.5 } : {}}
            />
            {isNew && (
                <motion.circle
                    cx={x}
                    cy={y}
                    r={10}
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="1"
                    initial={{ scale: 1, opacity: 1 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                />
            )}
            <motion.text
                x={x}
                y={y - 15}
                textAnchor="middle"
                className={`text-xs ${isRoot ? 'font-bold uppercase tracking-widest' : textColor}`}
                initial={{ opacity: 0, y: y - 5 }}
                animate={{ opacity: 1, y: y - 15 }}
                transition={{ delay: 0.5 }}
            >
                {label}
            </motion.text>
        </g>
    );
}
