# 📋 Système de Nettoyage CSV - LVMH

## ✨ Résumé de l'implémentation

Un système complet has been created pour :
1. **Importer des CSV** avec des transcriptions
2. **Nettoyer automatiquement** les mots parasites (euh, ben, donc, etc.)
3. **Valider RGPD** avec IA (suppression de données personnelles)
4. **Sauvegarder les résultats** dans Supabase

---

## 🎯 Flux Principal

```
CSV Upload (seller.tsx)
        ↓
Transcriptions brutes → Table: transcriptions
        ↓
[User clique "Nettoyer RGPD"]
        ↓
Backend: Nettoyage parasites + RGPD check (IA)
        ↓
Résultats nettoyés → Table: cleaned_transcriptions
```

---

## 📁 Fichiers Créés

### Backend (Python - FastAPI)

1. **`cleaning_service.py`** (NEW)
   - `clean_parasitic_words()` : Supprime les mots parasites
   - `check_rgpd_compliance()` : Vérification RGPD avec GPT-4o-mini
   - `process_transcription_pipeline()` : Pipeline complet

2. **`backend_api.py`** (MODIFIED)
   - Ajouté imports Supabase
   - `POST /api/supabase/process-transcriptions` : Lance le nettoyage
   - `GET /api/supabase/cleaned-transcriptions` : Récupère résultats
   - `GET /api/supabase/transcriptions-count` : Statistiques

### Frontend (Next.js - TypeScript)

1. **`frontend-app/hooks/useTranscriptionCleaning.tsx`** (NEW)
   - Hook pour déclencher le pipeline de nettoyage
   - Gère l'état du traitement et les erreurs
   - Détection automatique de l'URL du backend

2. **`frontend-app/pages/seller.tsx`** (MODIFIED)
   - Ajouté le hook `useTranscriptionCleaning`
   - Bouton "Nettoyer RGPD" en vert
   - Affichage du statut du traitement

### Configuration Supabase

1. **`supabase_migration.sql`** (NEW)
   - Crée les 2 tables principales
   - Indexes et triggers automatiques
   - Exécutable directement dans Supabase SQL Editor

### Documentation

1. **`ARCHITECTURE.md`** (NEW)
   - Explication détaillée du design
   - Schémas des tables
   - Flux d'utilisation complet

2. **`SETUP.md`** (NEW)
   - Guide d'installation étape par étape
   - Instructions de test
   - Dépannage

---

## ⚙️ Configuration Requise

### Variables d'environnement (`.env`)
```
NEXT_PUBLIC_SUPABASE_URL=https://[projet].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[clé]
OPENAI_API_KEY=sk-proj-[clé]
```

### Dépendances ajoutées
```bash
# requirements_ai.txt
supabase  ← NOUVEAU
regex     ← NOUVEAU
```

---

## 🚀 Démarrage

### 1. Backend
```bash
cd c:\Users\coren\OneDrive\Bureau\BDD-lvmh
pip install -r requirements_ai.txt
python backend_api.py
# Serveur sur http://localhost:8000
```

### 2. Frontend
```bash
cd frontend-app
npm install
npm run dev
# Serveur sur http://localhost:3000
```

### 3. Supabase
- Exécutez le SQL de `supabase_migration.sql` dans le Supabase Editor
- Vérifiez que les tables sont créées

---

## 📊 Flux Détaillé

### Étape 1 : Import CSV
- L'utilisateur va sur la page **seller** (`/seller`)
- Clique sur "Importer un fichier CSV"
- Le frontend crée des items en mode Batch

### Étape 2 : Analyse initiale
- L'utilisateur clique "Lancer l'Analyse"
- Les transcriptions sont envoyées à `/api/analyze` (OpenAI)
- Les résultats sont sauvegardés dans `transcriptions` table

### Étape 3 : Nettoyage RGPD (NOUVEAU)
- L'utilisateur clique "Nettoyer RGPD"
- Frontend appelle `startCleaningPipeline()`
- Backend traite chaque transcription :
  1. **Supprime les mots parasites** avec `clean_parasitic_words()`
  2. **Vérifie RGPD** avec IA `check_rgpd_compliance()`
  3. **Sauvegarde** dans `cleaned_transcriptions`
  4. **Marque comme traité** dans `transcriptions`

### Étape 4 : Résultats
- Utilisateur voit le statut du traitement
- Message de succès / erreur affiché
- Données disponibles dans Supabase

---

## 🔒 Sécurité RGPD

L'IA supprime automatiquement :
- ✓ Noms propres (personnes, lieux spécifiques)
- ✓ Numéros de téléphone
- ✓ Adresses email
- ✓ Numéros de carte bancaire
- ✓ Numéros d'identification
- ✓ Dates de naissance
- ✓ Données médicales

---

## 💾 Schéma des Tables Supabase

### `transcriptions`
```
id (UUID)
created_at (timestamp)
raw_text (TEXT) ← Texte brut before cleaning
client_name (varchar)
client_email (varchar)
is_processed (boolean) ← Flag pour traitement
status (varchar)
```

### `cleaned_transcriptions`
```
id (UUID)
created_at (timestamp)
transcription_id (UUID) → Reference à transcriptions
raw_text (TEXT)
cleaned_text (TEXT) ← Texte après nettoyage
client_name (varchar)
is_rgpd_compliant (boolean) ← RGPD OK?
violations_detected (JSONB) ← Liste violations
processing_status (varchar)
```

---

## 📈 Performance

- **Traitement séquentiel** pour éviter les limites de rate limite
- **Cache d'analysis** côté frontend (localStorage)
- **Index Supabase** pour requêtes rapides
- **Triggers TIMESTAMPS** automatiques

---

## 🧪 Test Rapide

1. Créez un CSV test :
```csv
id,transcription
1,"Bonjour, euh, je viens pour acheter un sac, mon numéro c'est 06123456789"
2,"Vous savez, ben, le produit est cool"
```

2. Importez via seller page
3. Lancez l'analyse
4. Cliquez "Nettoyer RGPD"
5. Vérifiez les résultats :

```sql
SELECT cleaned_text, is_rgpd_compliant FROM cleaned_transcriptions LIMIT 1;
```

Attendu :
```
cleaned_text: "Bonjour je viens pour acheter un sac mon numero c'est XXXX"
is_rgpd_compliant: true
```

---

## 🔧 Dépannage

| Problème | Solution |
|----------|----------|
| Backend ne démarre | Vérifiez `.env` et `pip install -r requirements_ai.txt` |
| Erreur CORS | Vérifiez que le backend est sur `http://localhost:8000` |
| Pas de données dans Supabase | Vérifiez RLS disabled en dev |
| OpenAI error | Vérifiez que `OPENAI_API_KEY` est valide |
| Supabase timeout | Le backend prend trop de temps → augmentez le timeout |

---

## 📝 Notes

- **CSV Format** : Au minimum une colonne "transcription" ou "text"
- **Batch Mode** : Activé automatiquement si > 1 item
- **Async Processing** : Le nettoyage se fait en backend (pas bloquant)
- **Error Handling** : Les erreurs sont enregistrées, process continue

---

## 🎓 Prochaines Étapes

1. ✅ Tester le flux complet
2. ✅ Vérifier les résultats RGPD
3. ⬜ Ajouter un dashboard de monitoring
4. ⬜ Implémenter un système de roll-back
5. ⬜ Ajouter logs détaillés pour audit

---

## 📞 Support

Voir les fichiers :
- `ARCHITECTURE.md` - Design technique complet
- `SETUP.md` - Installation détaillée
- Fichiers de code commentés

Bon nettoyage ! 🧹✨
