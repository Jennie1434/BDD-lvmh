import React from 'react';
import { motion } from 'framer-motion';
import { AnalysisResult } from '../../lib/types';

const taxonomyData = {
    name: 'LVMH Fashion',
    children: [
        {
            name: 'Maroquinerie',
            id: 'maroquinerie',
            children: [
                { name: 'Sacs', id: 'sacs' },
                { name: 'Petite Maro.', id: 'slg' },
            ]
        },
        {
            name: 'Prêt-à-Porter',
            id: 'pap',
            children: [
                { name: 'Vestes', id: 'vestes' },
                { name: 'Robes', id: 'robes' },
            ]
        },
        {
            name: 'Chaussures',
            id: 'chaussures',
            children: [
                { name: 'Escarpins', id: 'escarpins' },
                { name: 'Sneakers', id: 'sneakers' },
            ]
        },
        {
            name: 'Accessoires',
            id: 'accessoires',
            children: [
                { name: 'Foulards', id: 'foulards' },
                { name: 'Lunettes', id: 'lunettes' },
            ]
        }
    ]
};

const normalize = (value: string) => value.toLowerCase().trim();

const buildDynamicTaxonomy = (analysis?: AnalysisResult | null) => {
    const primaryPath = analysis?.taxonomy_paths?.[0] || analysis?.taxonomy_path;
    if (!analysis || !primaryPath || !analysis.produits || analysis.produits.length === 0) {
        return taxonomyData;
    }

    const newData = JSON.parse(JSON.stringify(taxonomyData));
    const pathParts = primaryPath.includes('>')
        ? primaryPath.split('>').map(part => normalize(part))
        : [normalize(primaryPath)];

    const findNode = (nodes: any[], name: string) => {
        return nodes.find((node: any) => normalize(node.name).includes(name) || name.includes(normalize(node.name)));
    };

    let categoryNode = null;
    for (const part of pathParts) {
        categoryNode = findNode(newData.children, part);
        if (categoryNode) break;
    }

    if (!categoryNode) {
        return newData;
    }

    let subNode = null;
    if (categoryNode.children) {
        for (const part of pathParts) {
            subNode = findNode(categoryNode.children, part);
            if (subNode) break;
        }
    }

    if (!subNode && categoryNode.children) {
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

    if (!subNode) {
        return newData;
    }

    const existingNames = subNode.children ? subNode.children.map((child: any) => normalize(child.name)) : [];

    const newProducts = analysis.produits
        .filter((product) => !existingNames.includes(normalize(product)))
        .map((product: string, idx: number) => ({
            name: product,
            id: `prod-${Date.now()}-${idx}`,
            isNew: true
        }));

    if (newProducts.length > 0) {
        if (!subNode.children) subNode.children = [];
        subNode.children = [...subNode.children, ...newProducts];
    }

    return newData;
};

const TreeVisualization = ({ data, activePath }: { data: any; activePath?: string }) => {
    const isActive = (label: string) => (activePath ? activePath.includes(label) : false);

    const rootX = 90;
    const rootY = 210;
    const level1X = 260;
    const level2X = 520;
    const level1Ys = [60, 150, 240, 330];

    const branches: React.ReactNode[] = [];
    const nodes: React.ReactNode[] = [];

    nodes.push(
        <Node key="root" x={rootX} y={rootY} label={data.name || 'LVMH Fashion'} isRoot />
    );

    data.children.forEach((child: any, i: number) => {
        const childY = level1Ys[i];
        const childLabel = child?.name || child?.id || `Categorie ${i + 1}`;

        branches.push(
            <Branch
                key={`branch-l1-${i}`}
                start={{ x: rootX, y: rootY }}
                end={{ x: level1X, y: childY }}
                active={isActive(childLabel)}
            />
        );
        nodes.push(
            <Node
                key={`node-l1-${i}`}
                x={level1X}
                y={childY}
                label={childLabel}
                active={isActive(childLabel)}
            />
        );

        if (child.children) {
            child.children.forEach((leaf: any, j: number) => {
                const leafCount = child.children.length;
                const leafOffset = (leafCount - 1) / 2;
                const leafY = childY + (j - leafOffset) * 24;
                const leafLabel = leaf?.name || leaf?.id || `Element ${j + 1}`;

                branches.push(
                    <Branch
                        key={`branch-l2-${i}-${j}`}
                        start={{ x: level1X, y: childY }}
                        end={{ x: level2X, y: leafY }}
                        active={isActive(leafLabel)}
                    />
                );
                nodes.push(
                    <Node
                        key={`node-l2-${i}-${j}`}
                        x={level2X}
                        y={leafY}
                        label={leafLabel}
                        isLeaf
                        active={isActive(leafLabel)}
                        isNew={leaf.isNew}
                    />
                );
            });
        }
    });

    return (
        <svg width="760" height="420" viewBox="0 0 760 420" className="w-full h-full">
            <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#000" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#C9A664" stopOpacity="0.5" />
                </linearGradient>
            </defs>
            {branches}
            {nodes}
        </svg>
    );
};

const Branch = ({ start, end, active, dashed }: { start: { x: number; y: number }; end: { x: number; y: number }; active?: boolean; dashed?: boolean }) => {
    const midX = (start.x + end.x) / 2;
    const path = `M ${start.x} ${start.y} C ${midX} ${start.y}, ${midX} ${end.y}, ${end.x} ${end.y}`;

    return (
        <motion.path
            d={path}
            fill="none"
            stroke={active ? '#000' : '#E5E7EB'}
            strokeWidth={active ? '3' : '2'}
            strokeDasharray={dashed ? '5,5' : 'none'}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: 'easeInOut' }}
        />
    );
};

const Node = ({ x, y, label, isRoot, isLeaf, active, isNew }: any) => {
    const fillColor = isRoot ? '#000' : (isNew ? '#10B981' : (active ? '#000' : (isLeaf ? '#C9A664' : '#fff')));
    const safeLabel = label && String(label).trim() ? String(label) : 'Non defini';
    const textFill = active ? '#111' : '#374151';
    const labelX = x + 14;
    const labelY = y;
    const labelAnchor = 'start';

    return (
        <g>
            <motion.circle
                cx={x}
                cy={y}
                r={isRoot ? 7 : (isNew ? 6 : 4)}
                fill={fillColor}
                stroke={isRoot ? 'none' : (isLeaf && !isNew ? 'none' : '#E5E7EB')}
                strokeWidth="2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
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
                x={labelX}
                y={labelY}
                textAnchor={labelAnchor}
                fill={textFill}
                stroke="#ffffff"
                strokeWidth="3"
                paintOrder="stroke"
                fontSize="10"
                fontWeight={active || isRoot ? 700 : 600}
                className={isRoot ? 'uppercase tracking-widest' : ''}
                dominantBaseline="middle"
                initial={{ opacity: 0, y: labelY - 4 }}
                animate={{ opacity: 1, y: labelY }}
                transition={{ delay: 0.4 }}
            >
                {safeLabel}
            </motion.text>
        </g>
    );
};

export const ClientTaxonomyTree = ({ analysis }: { analysis?: AnalysisResult | null }) => {
    const activePath = analysis?.taxonomy_paths?.[0] || analysis?.taxonomy_path;
    const dynamicData = React.useMemo(() => buildDynamicTaxonomy(analysis), [analysis]);

    if (!analysis || !activePath) {
        return (
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-500">
                Aucune taxonomie associee a ce client via l'import CSV.
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Taxonomie visuelle</div>
            <div className="h-[320px] w-full">
                <TreeVisualization data={dynamicData} activePath={activePath} />
            </div>
        </div>
    );
};
