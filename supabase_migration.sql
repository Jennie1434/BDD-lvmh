-- ============================================
-- MIGRATION SUPABASE - Tables pour CSV Import
-- ============================================

-- 1. Table des transcriptions brutes (depuis CSV)
CREATE TABLE IF NOT EXISTS public.transcriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    raw_text TEXT NOT NULL,
    client_name VARCHAR(255),
    client_email VARCHAR(255),
    is_processed BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'pending'
);

COMMENT ON TABLE public.transcriptions IS 'Stocke les transcriptions brutes importées depuis CSV';
COMMENT ON COLUMN public.transcriptions.raw_text IS 'Texte brut de la transcription (avant nettoyage)';
COMMENT ON COLUMN public.transcriptions.is_processed IS 'Flag indiquant si la transcription a été traitée';

-- 2. Table des transcriptions nettoyées (après suppression RGPD + parasites)
CREATE TABLE IF NOT EXISTS public.cleaned_transcriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    transcription_id UUID REFERENCES public.transcriptions(id) ON DELETE CASCADE,
    raw_text TEXT,
    cleaned_text TEXT NOT NULL,
    client_name VARCHAR(255),
    client_email VARCHAR(255),
    is_rgpd_compliant BOOLEAN DEFAULT TRUE,
    violations_detected JSONB DEFAULT NULL,
    processing_status VARCHAR(50) DEFAULT 'completed'
);

COMMENT ON TABLE public.cleaned_transcriptions IS 'Stocke les transcriptions nettoyées (parasites supprimés, RGPD validé)';
COMMENT ON COLUMN public.cleaned_transcriptions.cleaned_text IS 'Texte nettoyé après suppression des mots parasites et validation RGPD';
COMMENT ON COLUMN public.cleaned_transcriptions.is_rgpd_compliant IS 'Indique si la transcription respecte le RGPD';
COMMENT ON COLUMN public.cleaned_transcriptions.violations_detected IS 'Liste des violations RGPD détectées (emails, noms, etc.)';

-- 3. Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_transcriptions_is_processed 
ON public.transcriptions(is_processed);

CREATE INDEX IF NOT EXISTS idx_transcriptions_status 
ON public.transcriptions(status);

CREATE INDEX IF NOT EXISTS idx_transcriptions_created_at 
ON public.transcriptions(created_at);

CREATE INDEX IF NOT EXISTS idx_cleaned_transcriptions_rgpd_compliant 
ON public.cleaned_transcriptions(is_rgpd_compliant);

CREATE INDEX IF NOT EXISTS idx_cleaned_transcriptions_transcription_id 
ON public.cleaned_transcriptions(transcription_id);

-- 4. Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour transcriptions
CREATE TRIGGER update_transcriptions_updated_at
BEFORE UPDATE ON public.transcriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger pour cleaned_transcriptions
CREATE TRIGGER update_cleaned_transcriptions_updated_at
BEFORE UPDATE ON public.cleaned_transcriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Vue pour statistiques rapides
CREATE OR REPLACE VIEW public.transcription_stats AS
SELECT 
    COUNT(*) as total_raw,
    COUNT(CASE WHEN is_processed THEN 1 END) as processed,
    COUNT(CASE WHEN NOT is_processed THEN 1 END) as pending
FROM public.transcriptions;

COMMENT ON VIEW public.transcription_stats IS 'Vue pour statistiques rapides des transcriptions';

-- 6. Émettre un message de succès
SELECT 'Migration terminée avec succès!' as message;

-- 7. Extension schema clients (suivi recontact)
ALTER TABLE IF EXISTS public.clients
ADD COLUMN IF NOT EXISTS next_contact_at TIMESTAMP WITH TIME ZONE;
