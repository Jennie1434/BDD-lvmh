# Architecture LVMH - Flux d'Import CSV et Nettoyage RGPD

## Vue d'ensemble du flux

```
CSV Import → Table 'transcriptions' → Nettoyage (parasites + RGPD) → Table 'cleaned_transcriptions'
```

## 1. ÉTAPES DU PIPELINE

### Étape 1 : Import CSV
- **Frontend** : Page `seller.tsx` → `handleFileUpload()`
  - L'utilisateur importe un CSV
  - Les transcriptions sont nettoyées basiquement avec `cleanTranscription()`
  - Les items sont affichés en mode "Batch"

### Étape 2 : Sauvegarde initiale dans Supabase
- **Frontend** : Lors du batch analysis → `saveTranscription()`
  - Les transcriptions sont insérées dans la table `transcriptions`
  - Chaque entry reste en état `is_processed = false` par défaut

### Étape 3 : Nettoyage RGPD + Parasites
- **Frontend** : Quand l'utilisateur clique "Nettoyer RGPD" → `startCleaningPipeline()`
- **Backend** : Route FastAPI `POST /api/supabase/process-transcriptions`
  - Récupère toutes les transcriptions avec `is_processed = false`
  - Pour chaque transcription :
    1. Supprime les mots parasites avec `clean_parasitic_words()`
    2. Vérifie RGPD avec IA via `check_rgpd_compliance()`
  - Sauvegarde le résultat dans `cleaned_transcriptions`
  - Marque comme traité dans `transcriptions`

### Étape 4 : Suivi du statut
- **Frontend** : Le hook `useTranscriptionCleaning` affiche le statut
- **Backend** : Route `GET /api/supabase/transcriptions-count` pour obtenir les stats

## 2. SCHÉMA DES TABLES SUPABASE

### Table : `transcriptions`
```sql
CREATE TABLE transcriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    raw_text TEXT NOT NULL,
    client_name VARCHAR(255),
    client_email VARCHAR(255),
    is_processed BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'pending'
);
```

### Table : `cleaned_transcriptions`
```sql
CREATE TABLE cleaned_transcriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    transcription_id UUID REFERENCES transcriptions(id) ON DELETE CASCADE,
    raw_text TEXT,
    cleaned_text TEXT NOT NULL,
    client_name VARCHAR(255),
    client_email VARCHAR(255),
    is_rgpd_compliant BOOLEAN DEFAULT TRUE,
    violations_detected JSONB,
    processing_status VARCHAR(50) DEFAULT 'completed'
);
```

## 3. FICHIERS CLÉS

### Backend
- `backend_api.py` : Routes FastAPI principales
  - `POST /api/supabase/process-transcriptions` : Lance le pipeline
  - `GET /api/supabase/cleaned-transcriptions` : Récupère les résultats
  - `GET /api/supabase/transcriptions-count` : Statistiques

- `cleaning_service.py` : Logique de nettoyage
  - `clean_parasitic_words()` : Supprime les mots parasites
  - `check_rgpd_compliance()` : Vérification RGPD avec GPT
  - `process_transcription_pipeline()` : Pipeline complet

### Frontend
- `pages/seller.tsx` : Page d'import et batch processing
  - `handleFileUpload()` : Import CSV
  - `runBatchAnalysis()` : Analyse des transcriptions
  - Bouton "Nettoyer RGPD" : Lance le pipeline

- `hooks/useTranscriptionCleaning.tsx` : Hook pour le nettoyage
  - `startCleaningPipeline()` : Déclenche le traitement
  - `processingStatus` : État du traitement

## 4. VARIABLES D'ENVIRONNEMENT REQUISES

```
# .env
NEXT_PUBLIC_SUPABASE_URL=https://[projet].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[clé-anonyme]
OPENAI_API_KEY=sk-proj-[clé-openai]
```

## 5. COMMANDES DE DÉMARRAGE

### Backend
```bash
pip install -r requirements_ai.txt
python backend_api.py
# Le serveur démarre sur http://localhost:8000
```

### Frontend
```bash
cd frontend-app
npm run dev
# En développement sur http://localhost:3000
```

## 6. FLUX D'UTILISATION COMPLET

1. **L'utilisateur va sur la page "seller"**
2. **Importe un fichier CSV** avec le bouton "Importer un fichier CSV"
3. **Voit les transcriptions charger** en mode Batch
4. **Lance l'Analyse** pour classifier avec IA
5. **Les transcriptions s'insèrent** dans la table `transcriptions`
6. **Clique sur "Nettoyer RGPD"**
7. **Backend traite** chaque transcription :
   - Supprime les mots parasites
   - Appelle GPT pour vérifier RGPD
   - Sauvegarde dans `cleaned_transcriptions`
8. **Frontend affiche** le statut du traitement
9. **Résultats disponibles** dans `cleaned_transcriptions`

## 7. GESTION DES ERREURS

- Si le nettoyage échoue pour une transcription :
  - L'erreur est enregistrée
  - Le traitement continue avec les autres
  - L'utilisateur est informé du nombre de succès/erreurs

- Si l'API RGPD (OpenAI) est indisponible :
  - Le texte est retourné comme "compliant par défaut"
  - Un flag d'erreur est ajouté pour suivi manuel

## 8. AMÉLIORATIONS FUTURES

- [ ] Interface de révision des violations RGPD détectées
- [ ] Bulk operations pour retraiter les données
- [ ] Dashboard de suivi du traitement
- [ ] Export des résultats nettoyés
- [ ] Webhooks pour notifications personnalisées
