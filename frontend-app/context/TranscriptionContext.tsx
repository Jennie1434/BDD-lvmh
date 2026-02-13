import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AnalysisResult, BatchItem } from '../lib/types';

interface TranscriptionContextType {
    transcript: string;
    setTranscript: (text: string) => void;
    analysis: AnalysisResult | null;
    setAnalysis: (result: AnalysisResult | null) => void;

    // Batch Mode
    batchMode: boolean;
    setBatchMode: (mode: boolean) => void;
    batchItems: BatchItem[];
    setBatchItems: (items: BatchItem[]) => void;
}

const TranscriptionContext = createContext<TranscriptionContextType | undefined>(undefined);

export function TranscriptionProvider({ children }: { children: ReactNode }) {
    const [transcript, setTranscript] = useState('');
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

    // Batch Mode State
    const [batchMode, setBatchMode] = useState(false);
    const [batchItems, setBatchItems] = useState<BatchItem[]>([]);

    return (
        <TranscriptionContext.Provider value={{
            transcript, setTranscript,
            analysis, setAnalysis,
            batchMode, setBatchMode,
            batchItems, setBatchItems
        }}>
            {children}
        </TranscriptionContext.Provider>
    );
}

export function useTranscription() {
    const context = useContext(TranscriptionContext);
    if (context === undefined) {
        throw new Error('useTranscription must be used within a TranscriptionProvider');
    }
    return context;
}
