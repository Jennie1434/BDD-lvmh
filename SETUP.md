# Guide d'Installation - Pipeline CSV Import + Nettoyage RGPD

## 📋 Sommaire
1. [Configuration Supabase](#configuration-supabase)
2. [Installation Backend](#installation-backend)
3. [Installation Frontend](#installation-frontend)
4. [Test du Pipeline](#test-du-pipeline)

---

## 🔧 Configuration Supabase

### Étape 1 : Créer les tables dans Supabase

1. Allez dans votre projet Supabase : https://app.supabase.com
2. Ouvrez l'**SQL Editor**
3. Créez une nouvelle query
4. Copiez-collez le contenu de `supabase_migration.sql`
5. Cliquez sur "Run"

**Tables créées :**
- ✅ `transcriptions` - Stocke les imports bruts
- ✅ `cleaned_transcriptions` - Stocke les résultats nettoyés
- ✅ Indexes et triggers automatiques

### Étape 2 : Vérifier les permissions RLS (Row Level Security)

Pour le développement, vous pouvez désactiver RLS temporairement :

```sql
-- Dans Supabase SQL Editor
ALTER TABLE public.transcriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaned_transcriptions DISABLE ROW LEVEL SECURITY;
```

⚠️ **En production**, activez RLS et créez des politiques appropriées.

---

## 🚀 Installation Backend

### Étape 1 : Installer les dépendances

```bash
cd c:\Users\coren\OneDrive\Bureau\BDD-lvmh
pip install -r requirements_ai.txt
```

### Étape 2 : Vérifier le .env

Assurez-vous que `.env` contient :
```
NEXT_PUBLIC_SUPABASE_URL=https://zszhddrhapzeytrwfldn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
OPENAI_API_KEY=sk-proj-...
```

### Étape 3 : Démarrer le serveur FastAPI

```bash
python backend_api.py
```

**Sortie attendue :**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Étape 4 : Tester les routes

```bash
# Tester la connexion
curl http://localhost:8000/api/supabase/transcriptions-count

# Devrait retourner :
# {"total_raw": 0, "total_cleaned": 0, "pending": 0}
```

---

## 💻 Installation Frontend

### Étape 1 : Installer les dépendances

```bash
cd frontend-app
npm install
```

### Étape 2 : Vérifier .env.local

Le fichier `.env.local` doit déjà contenir :
```
NEXT_PUBLIC_SUPABASE_URL=https://zszhddrhapzeytrwfldn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
OPENAI_API_KEY=sk-proj-...
```

### Étape 3 : Démarrer Next.js

```bash
npm run dev
```

**Sortie attendue :**
```
ready - started server on 0.0.0.0:3000
```

---

## ✅ Test du Pipeline Complet

### Scénario de test

1. **Accéder à la page seller**
   - URL : http://localhost:3000/seller (Page d'enregistrement audio)
   
2. **Importer un CSV test**
   - Bouton : "Importer un fichier CSV (Batch possible)"
   - Format attendu :
     ```
     id,transcription,client_name
     1,"Bonjour, euh, je viens pour acheter un sac.",Marie
     2,"Vous savez, ben, on voudrait du parfum.",Jean
     ```

3. **Voir les transcriptions charger**
   - Les items apparaissent dans le mode "Analyse par Lots"
   - Statut : "En attente"

4. **Lancer l'analyse**
   - Bouton : "Lancer l'Analyse"
   - Les transcriptions se sauvegardent dans `transcriptions`
   - Statut : "Terminé"

5. **Lancer le nettoyage RGPD**
   - Bouton : "Nettoyer RGPD" (nouveau bouton vert)
   - Backend traite les transcriptions
   - Résultats sauvegardés dans `cleaned_transcriptions`
   - Message : "Nettoyage terminé"

### Vérifier les résultats dans Supabase

#### Table `transcriptions`
```sql
SELECT * FROM transcriptions LIMIT 5;
```

Attendu :
```
| id | raw_text | is_processed |
|----|----------|--------------|
| ... | "Bonjour euh je viens acheter sac" | true |
```

#### Table `cleaned_transcriptions`
```sql
SELECT * FROM cleaned_transcriptions LIMIT 5;
```

Attendu :
```
| id | cleaned_text | is_rgpd_compliant |
|----|--------------|------------------|
| ... | "Bonjour je viens acheter sac" | true |
```

---

## 🔍 Dépannage

### ❌ Erreur : "Supabase URL not configured"
**Solution :** Vérifiez que `NEXT_PUBLIC_SUPABASE_URL` est dans `.env`

### ❌ Erreur : "OpenAI API key is missing"
**Solution :** Vérifiez que `OPENAI_API_KEY` est dans `.env`

### ❌ Erreur : "Connection refused on localhost:8000"
**Solution :** Assurez-vous que le backend est démarré avec `python backend_api.py`

### ❌ Erreur : "Module 'supabase' not found"
**Solution :** Installez les dépendances : `pip install -r requirements_ai.txt`

### ❌ Les données ne s'insèrent pas dans Supabase
**Solution :** 
- Vérifiez que RLS est désactivé (pour dev)
- Vérifiez les permissions dans le dashboard Supabase
- Regardez les logs du backend pour les erreurs

---

## 📊 Fichiers Modifiés / Créés

### Créés
- ✅ `cleaning_service.py` - Service de nettoyage RGPD
- ✅ `supabase_migration.sql` - Schéma des tables
- ✅ `ARCHITECTURE.md` - Documentation
- ✅ `SETUP.md` - Ce guide d'installation
- ✅ `frontend-app/hooks/useTranscriptionCleaning.tsx` - Hook frontend

### Modifiés
- ✅ `backend_api.py` - Routes Supabase ajoutées
- ✅ `frontend-app/pages/seller.tsx` - Intégration du nettoyage
- ✅ `requirements_ai.txt` - Dépendance `supabase` ajoutée

---

## 🎯 Résumé du Flux

```
┌─────────────────────────────┐
│   CSV Import (seller.tsx)   │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Table: transcriptions             │
│   (avant nettoyage)                 │
│   is_processed = false              │
└──────────────┬──────────────────────┘
               │
               │ Clic "Nettoyer RGPD"
               ▼
┌─────────────────────────────────────┐
│   Backend: /process-transcriptions  │
│   1. clean_parasitic_words()        │
│   2. check_rgpd_compliance()        │
└──────────────┬──────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│   Table: cleaned_transcriptions         │
│   (après nettoyage)                     │
│   is_rgpd_compliant = true/false        │
└──────────────────────────────────────────┘
```

---

## 🔐 Notes de Sécurité

1. **Ne commitez pas les clés API** dans Git
2. **En production**, activez RLS sur les tables Supabase
3. **Limitez les permissions** des clés API (lecture/écriture seule)
4. **Auditez les données RGPD** régulièrement
5. **Loggez les violations** détectées pour conformité

---

## 📞 Support

Pour plus d'informations :
- Voir `ARCHITECTURE.md` pour le design technique
- Voir les logs du backend pour les erreurs
- Vérifier Supabase Dashboard pour l'état des tables

Bonne chance ! 🚀
