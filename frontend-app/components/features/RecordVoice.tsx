import React, { useState, useRef } from 'react';
import { Mic, Square, Loader2, XCircle, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { AnalysisResult } from '../../lib/types';
import { Badge } from '../ui/Badge';
import { cleanTranscription } from '../../utils/textCleaner';

// Backend Integration Enabled
// Step 1: /api/transcribe (Whisper)
// Step 2: /api/analyze (GPT-4o)

interface RecordVoiceProps {
    clientId?: string;
    onAnalysisComplete?: (result: AnalysisResult) => void;
    onClose: () => void;
}

export const RecordVoice = ({ clientId, onAnalysisComplete, onClose }: RecordVoiceProps) => {
    // States
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Data
    const [transcript, setTranscript] = useState('');
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

    // Refs for Audio Capture
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.start();

            // Reset states
            setTranscript('');
            setAnalysis(null);
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Impossible d'accéder au microphone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);

            // Wait a small delay then start transcription
            setTimeout(() => {
                handleTranscribeOnly();
            }, 500);
        }
    };

    // Step 1: Transcribe Audio
    const handleTranscribeOnly = async () => {
        setIsTranscribing(true);
        console.log("Sending audio to be transcribed...");
        try {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
            const formData = new FormData();
            formData.append('file', audioBlob, 'recording.mp3');

            // Use internal API route
            const response = await fetch('/api/transcribe', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API Error: ${errorData.error || response.statusText}`);
            }

            const data = await response.json();
            if (data.transcription) {
                // Nettoyage avant affichage et analyse
                const cleanedText = cleanTranscription(data.transcription);
                console.log("Original:", data.transcription);
                console.log("Cleaned:", cleanedText);
                setTranscript(cleanedText);
            }
        } catch (error) {
            console.error("Transcription failed:", error);
            setTranscript("Erreur de transcription. Vérifiez votre clé OpenAI.");
        } finally {
            setIsTranscribing(false);
            mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
        }
    };

    // Step 2: Analyze Text
    const handleAnalyzeTest = async () => {
        if (!transcript) return;

        setIsAnalyzing(true);
        console.log("Sending text to be analyzed...");
        try {
            // Use internal API route
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: transcript }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API Error: ${errorData.error || response.statusText}`);
            }

            const data = await response.json();
            setAnalysis(data);
            if (onAnalysisComplete) onAnalysisComplete(data);

        } catch (error) {
            console.error("Analysis failed:", error);
            alert("Erreur lors de l'analyse.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative"
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-black">
                    <XCircle size={24} />
                </button>

                <div className="p-8 flex flex-col items-center">
                    <h2 className="text-xl font-serif font-bold mb-8 tracking-wide">
                        {isRecording ? 'Enregistrement...' : 'Note Vocale'}
                    </h2>

                    {/* Zone de contrôle principal */}
                    <div className="relative mb-8">
                        {isRecording && (
                            <motion.div
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="absolute inset-0 bg-red-100 rounded-full scale-125"
                            />
                        )}
                        <button
                            onClick={isRecording ? stopRecording : startRecording}
                            disabled={isAnalyzing || isTranscribing}
                            className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 text-white' : 'bg-black text-white hover:scale-105'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {isRecording ? <Square fill="currentColor" size={24} /> : <Mic size={32} />}
                        </button>
                    </div>

                    {/* Zone de Transcription */}
                    <div className={`w-full bg-gray-50 rounded-xl p-4 h-48 overflow-y-auto mb-6 text-sm text-gray-600 leading-relaxed font-medium transition-all duration-300 ${isRecording ? 'ring-2 ring-red-100 border-red-200' : ''}`}>
                        {isRecording ? (
                            <div className="flex items-center justify-center h-full text-gray-400 italic gap-2">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                </span>
                                Enregistrement en cours...
                            </div>
                        ) : isTranscribing ? (
                            <div className="flex items-center justify-center h-full text-gray-400 italic gap-2 animate-pulse">
                                <Loader2 className="animate-spin" size={16} />
                                Transcription en cours...
                            </div>
                        ) : (
                            transcript || <span className="text-gray-400 italic">La transcription apparaîtra ici...</span>
                        )}
                    </div>

                    {/* Bouton d'action intermédiaire : ANALYSER */}
                    {!isRecording && !isTranscribing && transcript && !analysis && (
                        <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={handleAnalyzeTest}
                            disabled={isAnalyzing}
                            className="bg-black text-white px-8 py-3 rounded-full text-sm font-bold uppercase tracking-widest hover:bg-lvmh-gold transition-colors flex items-center gap-2 mb-6 shadow-lg shadow-black/20"
                        >
                            {isAnalyzing ? (
                                <><Loader2 className="animate-spin" size={16} /> Analyse...</>
                            ) : (
                                <><Sparkles size={16} /> Analyser avec l'IA</>
                            )}
                        </motion.button>
                    )}

                    {/* Résultat de l'analyse */}
                    {analysis && (
                        <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 border-t border-gray-100 pt-6">
                            <div className="flex items-center justify-between border-b border-dashed border-gray-200 pb-2">
                                <span className="text-xs text-gray-400 uppercase tracking-wider">Intention</span>
                                <Badge variant={analysis.intent_score > 70 ? 'green' : 'neutral'}>{analysis.intention}</Badge>
                            </div>

                            <div className="flex items-center justify-between border-b border-dashed border-gray-200 pb-2">
                                <span className="text-xs text-gray-400 uppercase tracking-wider">Phase</span>
                                <span className="font-bold text-sm">{analysis.phase}</span>
                            </div>

                            <div className="space-y-2">
                                <span className="text-xs text-gray-400 uppercase tracking-wider block">Produits détectés</span>
                                <div className="flex flex-wrap gap-2">
                                    {analysis.produits.length > 0 ? (
                                        analysis.produits.map(p => <Badge key={p} variant="black">{p}</Badge>)
                                    ) : (
                                        <span className="text-xs text-gray-400 italic">Aucun produit détecté</span>
                                    )}
                                </div>
                            </div>

                            <div className="w-full bg-gray-100 h-2 rounded-full mt-4 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-lvmh-gold to-yellow-300"
                                    style={{ width: `${analysis.intent_score}%` }}
                                />
                            </div>
                            <p className="text-center text-[10px] text-gray-400 uppercase mt-1">Score d'intention: {analysis.intent_score}/100</p>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                {analysis && (
                    <div className="bg-gray-50 p-4 flex justify-between items-center">
                        <button
                            className="text-xs font-bold uppercase text-gray-400 hover:text-red-500"
                            onClick={() => { setAnalysis(null); setTranscript(''); }}
                        >
                            Supprimer
                        </button>
                        <button onClick={onClose} className="bg-black text-white px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-lvmh-gold transition-colors">
                            Enregistrer & Fermer
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
};
