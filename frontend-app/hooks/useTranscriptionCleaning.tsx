import { useState } from 'react';

export interface ProcessingStatus {
    isProcessing: boolean;
    processed: number;
    total: number;
    error?: string;
    message?: string;
}

export const useTranscriptionCleaning = () => {
    const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
        isProcessing: false,
        processed: 0,
        total: 0,
    });

    const startCleaningPipeline = async () => {
        setProcessingStatus({
            isProcessing: true,
            processed: 0,
            total: 0,
        });

        try {
            // Appelle l'API Next.js locale
            const response = await fetch('/api/clean-transcriptions', {
                method: 'POST',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors du traitement');
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Erreur inconnue');
            }

            const processedCount = result.data?.processed_count || 0;
            const totalCount = result.data?.processed_count + result.data?.skipped_count || 0;

            setProcessingStatus({
                isProcessing: false,
                processed: processedCount,
                total: totalCount,
                message: result.message,
            });

            return result;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
            setProcessingStatus({
                isProcessing: false,
                processed: 0,
                total: 0,
                error: errorMessage,
            });
            throw error;
        }
    };

    return {
        processingStatus,
        startCleaningPipeline,
    };
};
