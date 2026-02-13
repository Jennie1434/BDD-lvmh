import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { CockpitLayout } from '../components/layout/CockpitLayout';
import { Mic, Square, Loader2, Sparkles, ArrowRight, Play, Upload, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { cleanTranscription } from '../utils/textCleaner';
import { AnalysisResult, BatchItem } from '../lib/types';
import { SupabaseProvider, useSupabase } from '../hooks/useSupabase';
import { useTranscription } from '../context/TranscriptionContext';
import { useTranscriptionCleaning } from '../hooks/useTranscriptionCleaning';
import { supabase } from '../lib/supabase';

export default function AudioPage() {
    return (
        <SupabaseProvider>
            <Head>
                <title>LVMH - Audio Enregistrement</title>
            </Head>
            <CockpitLayout>
                <AudioRecorder />
            </CockpitLayout>
        </SupabaseProvider>
    );
}

function AudioRecorder() {
    const router = useRouter();
    // Context
    const {
        transcript, setTranscript,
        analysis, setAnalysis,
        batchMode, setBatchMode,
        batchItems, setBatchItems
    } = useTranscription();
    const { user, saveTranscription, checkLastTranscription } = useSupabase();
    const { processingStatus, startCleaningPipeline } = useTranscriptionCleaning();

    // States
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isBatchProcessing, setIsBatchProcessing] = useState(false);
    const [analysisCache, setAnalysisCache] = useState<Record<string, AnalysisResult>>({});
    const [convertingClientIds, setConvertingClientIds] = useState<Record<string, boolean>>({});
    const [convertedClientIds, setConvertedClientIds] = useState<Record<string, boolean>>({});

    // Refs
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const analysisCacheRef = useRef<Record<string, AnalysisResult>>({});

    const ANALYSIS_CACHE_KEY = 'analysis_cache_v1';
    const CLIENT_ANALYSIS_CACHE_KEY = 'client_analysis_cache_v1';
    const normalizeAnalysisKey = (text: string) => cleanTranscription(text).trim().toLowerCase();

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const raw = localStorage.getItem(ANALYSIS_CACHE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                analysisCacheRef.current = parsed;
                setAnalysisCache(parsed);
            }
        } catch {
            // Ignore cache errors
        }
    }, []);

    const setCachedAnalysis = (text: string, result: AnalysisResult) => {
        const key = normalizeAnalysisKey(text);
        analysisCacheRef.current = { ...analysisCacheRef.current, [key]: result };
        setAnalysisCache(prev => {
            const next = { ...prev, [key]: result };
            if (typeof window !== 'undefined') {
                try {
                    localStorage.setItem(ANALYSIS_CACHE_KEY, JSON.stringify(next));
                } catch {
                    // Ignore cache errors
                }
            }
            return next;
        });
    };

    const getCachedAnalysis = (text: string) => {
        const key = normalizeAnalysisKey(text);
        return analysisCacheRef.current[key];
    };

    const setClientAnalysisCache = (clientId: string, result: AnalysisResult) => {
        if (!clientId || typeof window === 'undefined') return;

        try {
            const raw = localStorage.getItem(CLIENT_ANALYSIS_CACHE_KEY);
            const parsed = raw ? JSON.parse(raw) : {};
            const next = { ...parsed, [clientId]: result };
            localStorage.setItem(CLIENT_ANALYSIS_CACHE_KEY, JSON.stringify(next));
        } catch {
            // Ignore cache errors
        }
    };

    const parseEstimatedBudget = (budget?: string) => {
        if (!budget) return 0;
        const value = budget.toLowerCase();
        if (value.includes('20k') || value.includes('>5000')) return 20000;
        if (value.includes('5k-20k')) return 10000;
        if (value.includes('1000-5000') || value.includes('1k-5k')) return 3000;
        const numbers = value.match(/\d+/g);
        if (!numbers || numbers.length === 0) return 0;
        const parsed = parseInt(numbers[0], 10);
        return Number.isNaN(parsed) ? 0 : parsed;
    };

    const createClientFromItem = async (item: BatchItem) => {
        if (!item.result || !item.id) return;
        if (convertingClientIds[item.id]) return;

        setConvertingClientIds(prev => ({ ...prev, [item.id]: true }));

        try {
            const { data: authData } = await supabase.auth.getUser();
            const authUser = authData.user;
            let sellerId = user?.id;

            if (authUser?.id && authUser.email) {
                const ensureResponse = await fetch('/api/ensure-seller', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: authUser.id,
                        email: authUser.email,
                    }),
                });

                if (ensureResponse.ok) {
                    const ensureData = await ensureResponse.json();
                    sellerId = ensureData?.data?.id || sellerId;
                }
            }

            if (!sellerId) {
                alert('Aucun vendeur authentifie.');
                return;
            }
            console.log('Creating client with seller_id:', sellerId);

            const response = await fetch('/api/create-client', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: item.id,
                    estimated_budget: parseEstimatedBudget(item.result.budget),
                    last_interaction_at: new Date().toISOString(),
                    dominant_emotion: item.result.emotion,
                    purchase_probability: item.result.intent_score,
                    intent_score: item.result.intent_score,
                    seller_id: sellerId,
                    analysis: item.result
                })
            });

            const data = await response.json();

            if (!response.ok || !data?.success) {
                const errorMessage = data?.error || 'Erreur creation client.';
                console.error('Error creating client:', errorMessage);
                alert(`Erreur creation client: ${errorMessage}`);
                return;
            }

            // Fallback: Si le seller_id n'était pas envoyé, créer l'assignation ici
            const clientId = data.client_id;
            if (clientId && item.result) {
                setClientAnalysisCache(clientId, item.result);
                setClientAnalysisCache(item.id, item.result);
            }
            if (sellerId && clientId) {
                const { error: assignmentError } = await supabase
                    .from('client_assignments')
                    .insert({
                        client_id: clientId,
                        seller_id: sellerId,
                        active: true
                    });

                if (assignmentError) {
                    console.error('Error assigning client to seller:', assignmentError);
                }
            }

            setConvertedClientIds(prev => ({ ...prev, [item.id]: true }));
        } catch (e) {
            console.error('Exception creating client:', e);
            alert('Erreur creation client.');
        } finally {
            setConvertingClientIds(prev => ({ ...prev, [item.id]: false }));
        }
    };

    // Visualizer Logic
    const drawVisualizer = (analyser: AnalyserNode, dataArray: Uint8Array) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = 80;

        const render = () => {
            analyser.getByteFrequencyData(dataArray);
            ctx.clearRect(0, 0, width, height);

            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.strokeStyle = '#f3f4f6';
            ctx.lineWidth = 2;
            ctx.stroke();

            const bars = 60;
            const step = (Math.PI * 2) / bars;

            dataArray.forEach((value, i) => {
                if (i >= bars) return;

                const angle = i * step;
                const length = (value / 255) * 100;

                const x1 = centerX + Math.cos(angle) * radius;
                const y1 = centerY + Math.sin(angle) * radius;
                const x2 = centerX + Math.cos(angle) * (radius + length);
                const y2 = centerY + Math.sin(angle) * (radius + length);

                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.strokeStyle = isRecording ? '#000000' : '#e5e7eb';
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
                ctx.stroke();
            });

            animationRef.current = requestAnimationFrame(render);
        };
        render();
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            // Audio Context for Visualizer
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            drawVisualizer(analyser, dataArray);

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.start();
            setTranscript('');
            setAnalysis(null);
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Impossible d'acceder au microphone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (animationRef.current) cancelAnimationFrame(animationRef.current);

            // Clear canvas
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx?.clearRect(0, 0, canvas.width, canvas.height);
            }

            setTimeout(() => {
                handleTranscribeOnly();
            }, 500);
        }
    };

    const handleTranscribeOnly = async () => {
        setIsTranscribing(true);
        try {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
            const formData = new FormData();
            formData.append('file', audioBlob, 'recording.mp3');

            const response = await fetch('/api/transcribe', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Transcription failed');

            const data = await response.json();
            if (data.transcription) {
                setTranscript(cleanTranscription(data.transcription));
            }
        } catch (error) {
            console.error(error);
            setTranscript('Erreur de transcription.');
        } finally {
            setIsTranscribing(false);
            mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
        }
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            if (!text) return;

            // Simple CSV line splitter handling standard line breaks
            const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
            if (lines.length === 0) return;

            // Detect header
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
            const transcriptionIndex = headers.findIndex(h => h.includes('transcription') || h.includes('text') || h.includes('content'));

            // Iterate through ALL lines after header
            const newBatchItems: BatchItem[] = [];

            // Should always start from index 1 if there's a header, or 0 if not (but simplified logic)
            // If transcriptionIndex is found, use it for all lines.
            // If not, use first column for all lines.

            const startLine = (transcriptionIndex !== -1 || (headers.length === 1 && headers[0] === 'transcription')) ? 1 : 0;
            const targetColIndex = transcriptionIndex !== -1 ? transcriptionIndex : 0;
            // ID column detection (optional)
            const idIndex = headers.findIndex(h => h.includes('id') || h.includes('ref'));

            for (let i = startLine; i < lines.length; i++) {
                const line = lines[i];
                if (!line) continue;

                // Handle basic CSV splitting (simple comma split)
                // Note: This simple split fails on commas within quotes. For a robust solution, a library like papa-parse is better.
                const cells = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); // Split by comma outside quotes

                let cellText = cells[targetColIndex] || '';
                let cellId = (idIndex !== -1 && cells[idIndex]) ? cells[idIndex] : `row_${i}`;

                // Cleanup quotes
                cellText = cellText.replace(/^"|"$/g, '').replace(/""/g, '"').trim();
                cellId = cellId.replace(/^"|"$/g, '').trim();

                if (cellText) {
                    // NETTOYAGE RGPD ET PARASITES ICI
                    const cleanedText = cleanTranscription(cellText);

                    newBatchItems.push({
                        id: cellId,
                        text: cleanedText,
                        status: 'pending'
                    });
                }
            }

            if (newBatchItems.length > 0) {
                if (newBatchItems.length === 1) {
                    // Single item -> Standard Mode
                    setTranscript(cleanTranscription(newBatchItems[0].text));
                    setAnalysis(null);
                    setBatchMode(false);
                } else {
                    // Multiple items -> Batch Mode
                    setBatchItems(newBatchItems);
                    setBatchMode(true);
                    // Reset standard mode
                    setTranscript('');
                    setAnalysis(null);

                    // SAVE ALL IMPORTED TRANSCRIPTIONS TO SUPABASE IMMEDIATELY
                    (async () => {
                        try {
                            const transcriptionsToSave = newBatchItems.map(item => ({
                                raw_text: item.text,
                                status: 'pending',
                                is_processed: false,
                                language: 'fr'
                            }));

                            const { error } = await supabase.from('transcriptions').insert(transcriptionsToSave);

                            if (error) {
                                console.error('Error saving imported transcriptions:', error);
                                alert(`Erreur lors de la sauvegarde: ${error.message}`);
                            } else {
                                console.log(`✓ ${newBatchItems.length} transcriptions sauvegardées dans Supabase`);
                            }
                        } catch (e) {
                            console.error('Exception saving transcriptions:', e);
                            alert('Erreur lors de la sauvegarde des transcriptions');
                        }
                    })();
                }
            }
        };
        reader.readAsText(file);
    };

    const runBatchAnalysis = async () => {
        setIsBatchProcessing(true);

        // Process items sequentially to avoid ratelimits/overload
        const updatedItems = [...batchItems];

        for (let i = 0; i < updatedItems.length; i++) {
            if (updatedItems[i].status === 'done') continue;

            // Update status to analyzing
            updatedItems[i] = { ...updatedItems[i], status: 'analyzing' };
            setBatchItems([...updatedItems]);

            try {
                const cached = getCachedAnalysis(updatedItems[i].text);
                if (cached) {
                    updatedItems[i] = {
                        ...updatedItems[i],
                        status: 'done',
                        result: cached
                    };

                    setClientAnalysisCache(updatedItems[i].id, cached);
                    await saveTranscription(updatedItems[i].text);
                    setBatchItems([...updatedItems]);
                    await new Promise(r => setTimeout(r, 300));
                    continue;
                }

                // Real API Call
                const response = await fetch('/api/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: updatedItems[i].text }),
                });

                if (!response.ok) throw new Error('Analysis failed');

                const data = await response.json();
                updatedItems[i] = {
                    ...updatedItems[i],
                    status: 'done',
                    result: data
                };

                setCachedAnalysis(updatedItems[i].text, data);
                setClientAnalysisCache(updatedItems[i].id, data);

                // SAVE TO SUPABASE (Only Transcription)
                await saveTranscription(updatedItems[i].text);

            } catch (error) {
                console.error(`Error analyzing item ${updatedItems[i].id}`, error);
                updatedItems[i] = { ...updatedItems[i], status: 'error' };
            }

            // Update state after each item to show progress
            setBatchItems([...updatedItems]);

            // Small delay to be gentle on the "server" (or mock)
            await new Promise(r => setTimeout(r, 500));
        }

        setIsBatchProcessing(false);
    };

    const handleAnalyzeTest = async () => {
        if (!transcript) return;
        setIsAnalyzing(true);
        try {
            const cached = getCachedAnalysis(transcript);
            if (cached) {
                setAnalysis(cached);
                return;
            }
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: transcript }),
            });

            if (!response.ok) throw new Error('Analysis failed');

            const data = await response.json();
            setAnalysis(data);
            setCachedAnalysis(transcript, data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-2xl mx-auto px-4">
            {batchMode ? (
                <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl overflow-hidden min-h-[500px] flex flex-col">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <div>
                            <h2 className="text-xl font-serif font-bold">Analyse par Lots</h2>
                            <p className="text-sm text-gray-500">{batchItems.length} transcriptions chargees</p>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="ghost" onClick={() => setBatchMode(false)} disabled={isBatchProcessing || processingStatus.isProcessing}>
                                Annuler
                            </Button>
                            <Button
                                onClick={runBatchAnalysis}
                                disabled={isBatchProcessing || batchItems.every(i => i.status === 'done') || processingStatus.isProcessing}
                                className="bg-black text-white hover:bg-gray-800"
                            >
                                {isBatchProcessing ? (
                                    <><Loader2 className="animate-spin mr-2" size={16} /> Traitement...</>
                                ) : (
                                    <><Sparkles className="mr-2" size={16} /> Lancer l'Analyse</>
                                )}
                            </Button>
                            <Button
                                onClick={() => startCleaningPipeline()}
                                disabled={processingStatus.isProcessing || batchItems.length === 0}
                                className="bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                                {processingStatus.isProcessing ? (
                                    <><Loader2 className="animate-spin mr-2" size={16} /> Nettoyage...</>
                                ) : (
                                    <><Zap className="mr-2" size={16} /> Nettoyer RGPD</>
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto p-4">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-xs uppercase tracking-widest text-gray-400 border-b border-gray-100">
                                    <th className="p-3 font-medium">ID</th>
                                    <th className="p-3 font-medium w-1/3">Transcription</th>
                                    <th className="p-3 font-medium">Taxonomie</th>
                                    <th className="p-3 font-medium">Tags & Intention</th>
                                    <th className="p-3 font-medium">Actions</th>
                                    <th className="p-3 font-medium text-right">Statut</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-sm">
                                {batchItems.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                                        onClick={() => router.push(`/seller/clients?clientId=${encodeURIComponent(item.id)}`)}
                                    >
                                        <td className="p-3 font-mono text-gray-500 text-xs">{item.id}</td>
                                        <td className="p-3 text-gray-600 truncate max-w-[200px]" title={item.text}>
                                            {item.text}
                                        </td>
                                        <td className="p-3">
                                            {(() => {
                                                const taxonomyPaths = item.result?.taxonomy_paths?.length
                                                    ? item.result.taxonomy_paths
                                                    : item.result?.taxonomy_path
                                                        ? [item.result.taxonomy_path]
                                                        : [];

                                                if (taxonomyPaths.length === 0) return '-';

                                                return (
                                                    <div className="flex flex-wrap gap-1">
                                                        {taxonomyPaths.map((path, idx) => (
                                                            <Badge key={idx} variant="neutral" className="border-gray-200" title={path}>
                                                                {path.split('>').pop()?.trim()}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                        <td className="p-3">
                                            <div className="flex flex-wrap gap-1">
                                                {item.result?.intention && (
                                                    <Badge variant={item.result.intention === 'Achat' ? 'gold' : 'neutral'}>
                                                        {item.result.intention}
                                                    </Badge>
                                                )}
                                                {item.result?.tags?.map((tag, idx) => (
                                                    <Badge key={idx} variant="outline" className="text-[10px] px-1 py-0 h-5">
                                                        #{tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-xs"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    if (item.status === 'done') {
                                                        createClientFromItem(item);
                                                    }
                                                }}
                                                disabled={
                                                    item.status !== 'done' ||
                                                    convertingClientIds[item.id] ||
                                                    convertedClientIds[item.id]
                                                }
                                            >
                                                {convertedClientIds[item.id]
                                                    ? 'Client cree'
                                                    : convertingClientIds[item.id]
                                                        ? 'Creation...'
                                                        : item.status === 'done'
                                                            ? 'Creer client'
                                                            : 'Analyser d\'abord'}
                                            </Button>
                                        </td>
                                        <td className="p-3 text-right">
                                            {item.status === 'pending' && <span className="text-gray-300">En attente</span>}
                                            {item.status === 'analyzing' && <Loader2 className="animate-spin ml-auto text-lvmh-gold" size={16} />}
                                            {item.status === 'done' && <span className="text-green-600 font-bold">Termine</span>}
                                            {item.status === 'error' && <span className="text-red-500">Erreur</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Processing Status Message */}
                    {processingStatus.isProcessing && (
                        <div className="w-full p-4 bg-blue-50 border border-blue-200 rounded-lg mt-4">
                            <div className="flex items-center gap-3">
                                <Loader2 className="animate-spin text-blue-600" size={20} />
                                <div>
                                    <p className="font-bold text-blue-900">Nettoyage RGPD en cours...</p>
                                    <p className="text-sm text-blue-700">
                                        {processingStatus.processed} / {processingStatus.total} transcriptions traitées
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {processingStatus.error && (
                        <div className="w-full p-4 bg-red-50 border border-red-200 rounded-lg mt-4">
                            <p className="font-bold text-red-900">Erreur lors du nettoyage</p>
                            <p className="text-sm text-red-700">{processingStatus.error}</p>
                        </div>
                    )}

                    {processingStatus.message && !processingStatus.isProcessing && !processingStatus.error && (
                        <div className="w-full p-4 bg-green-50 border border-green-200 rounded-lg mt-4">
                            <p className="font-bold text-green-900">✓ Nettoyage terminé</p>
                            <p className="text-sm text-green-700">{processingStatus.message}</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center w-full max-w-2xl">
                    {/* Visualizer & Record Button */}
                    <div className="relative mb-12 flex items-center justify-center">
                        {/* Visualizer Canvas */}
                        <canvas
                            ref={canvasRef}
                            width={400}
                            height={400}
                            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-50"
                        />

                        {/* Main Button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={isRecording ? stopRecording : startRecording}
                            disabled={isTranscribing || isAnalyzing}
                            className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 ${isRecording
                                ? 'bg-red-500 text-white shadow-red-200'
                                : 'bg-black text-white hover:bg-gray-900 shadow-gray-200'
                                } ${isTranscribing || isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isRecording ? (
                                <Square fill="currentColor" size={32} />
                            ) : (
                                <Mic size={40} />
                            )}
                        </motion.button>

                        {/* Pulse Ring when inactive to invite interaction */}
                        {!isRecording && !isTranscribing && !isAnalyzing && (
                            <div className="absolute inset-0 border border-gray-100 rounded-full scale-150 animate-pulse pointer-events-none"></div>
                        )}
                    </div>

                    {/* Import CSV Button - Visibly placed below the mic */}
                    <div className="mb-12">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept=".csv"
                            className="hidden"
                        />
                        <div className="flex gap-2 justify-center">
                            <Button
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 border-gray-200 hover:bg-black hover:text-white hover:border-black transition-colors"
                            >
                                <Upload size={16} /> Importer un fichier CSV (Batch possible)
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={async () => {
                                    const last = await checkLastTranscription();
                                    if (last) {
                                        alert(`Derniere sauvegarde trouvee dans 'transcription' :\nID: ${last.id}\nTexte: ${last.raw_text?.substring(0, 50)}...`);
                                    } else {
                                        alert('Aucune transcription trouvee ou erreur de connexion.');
                                    }
                                }}
                                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-200"
                            >
                                Check DB
                            </Button>
                        </div>
                    </div>

                    {/* Status Text */}
                    <div className="h-8 mb-8 text-center">
                        <AnimatePresence mode="wait">
                            {isRecording && (
                                <motion.p
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                    className="text-red-500 font-bold uppercase tracking-widest text-sm"
                                >
                                    Enregistrement en cours...
                                </motion.p>
                            )}
                            {isTranscribing && (
                                <motion.p
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                    className="text-gray-400 font-medium flex items-center gap-2"
                                >
                                    <Loader2 className="animate-spin" size={16} /> Transcription...
                                </motion.p>
                            )}
                            {isAnalyzing && (
                                <motion.p
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                    className="text-lvmh-gold font-medium flex items-center gap-2"
                                >
                                    <Sparkles className="animate-pulse" size={16} /> Analyse IA en cours...
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>


                    {/* Transcript & Analysis Result */}
                    <AnimatePresence>
                        {(transcript || isAnalyzing) && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                className="w-full"
                            >
                                <Card className="w-full bg-white border border-gray-100 shadow-sm overflow-hidden">

                                    {/* Actions Header */}
                                    {!isRecording && !isTranscribing && transcript && !analysis && !isAnalyzing && (
                                        <div className="p-4 border-b border-gray-50 flex justify-center bg-gray-50/50">
                                            <Button onClick={handleAnalyzeTest} className="bg-black text-white hover:bg-gray-800 gap-2">
                                                <Sparkles size={16} /> Analyser
                                            </Button>
                                        </div>
                                    )}

                                    {/* Content */}
                                    <div className="p-6">
                                        {/* Transcript */}
                                        <div className="mb-6">
                                            <h3 className="text-xs font-bold uppercase text-gray-400 tracking-widest mb-3">Transcription</h3>
                                            <p className="text-gray-800 text-lg font-medium leading-relaxed">
                                                {transcript}
                                            </p>
                                        </div>

                                        {/* Analysis Result */}
                                        {analysis && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="pt-6 border-t border-dashed border-gray-200"
                                            >
                                                <div className="flex items-center justify-between mb-6">
                                                    <Badge variant="gold" className="text-sm px-3 py-1">
                                                        {analysis.intention}
                                                    </Badge>
                                                    <span className="text-sm font-bold text-gray-500">
                                                        Score: <span className="text-black">{analysis.intent_score}/100</span>
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 mb-4">
                                                    <div className="bg-gray-50 p-4 rounded-xl">
                                                        <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Phase</p>
                                                        <p className="font-bold">{analysis.phase}</p>
                                                    </div>
                                                    <div className="bg-gray-50 p-4 rounded-xl">
                                                        <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Budget</p>
                                                        <p className="font-bold">{analysis.budget}</p>
                                                    </div>
                                                </div>

                                                {(analysis.taxonomy_paths?.length || analysis.taxonomy_path) && (
                                                    <div className="bg-gray-50 p-4 rounded-xl mb-4 border border-gray-100">
                                                        <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Taxonomie</p>
                                                        <div className="flex flex-wrap gap-2 text-sm font-bold">
                                                            {(analysis.taxonomy_paths?.length
                                                                ? analysis.taxonomy_paths
                                                                : [analysis.taxonomy_path as string]
                                                            ).map((path, idx) => (
                                                                <span key={idx} className="inline-flex items-center gap-2">
                                                                    <span className="w-2 h-2 rounded-full bg-lvmh-gold"></span>
                                                                    {path}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {analysis.tags && analysis.tags.length > 0 && (
                                                    <div className="mb-4">
                                                        <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-2">Tags Detectes</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {analysis.tags.map((tag, i) => (
                                                                <Badge key={i} variant="neutral" className="bg-gray-100 text-gray-600 border-gray-200">
                                                                    #{tag}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <div>
                                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-2">Produits identifies</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {analysis.produits.map((p, i) => (
                                                            <Badge key={i} variant="black" className="bg-black text-white border-none">
                                                                {p}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
