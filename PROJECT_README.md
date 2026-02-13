# 🎯 Système de Nettoyage CSV + RGPD - LVMH Cockpit

## 📌 Aperçu du Projet

Système complet et automatisé pour **importer des fichiers CSV**, **nettoyer les transcriptions** (suppression des mots parasites) et **valider la conformité RGPD** avec l'intelligence artificielle.

```
┌─────────────────────────────────────────────────────────────────┐
│   👤 UTILISATEUR                                                 │
│   - Import CSV contenant des transcriptions                      │
│   - Lance analyse avec IA                                        │
│   - Clique "Nettoyer RGPD"                                       │
└──────────────────┬──────────────────────────────────────────────┘
                   │
        ┌──────────▼──────────┐
        │   FRONTEND (React)  │
        │   - seller.tsx      │
        │   - CSV Upload      │
        │   - Batch Mode      │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────────────┐
        │      API FastAPI            │
        │   - /process-transcriptions  │
        └──────────┬───────────────────┘
                   │
        ┌──────────▼──────────┐
        │   CLEANING SERVICE  │
        │   1. Parasites      │
        │   2. RGPD Check (IA)│
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────┐
        │   SUPABASE (SQL)    │
        │ - transcriptions    │
        │ - cleaned_transcr.. │
        └─────────────────────┘
```

---

## ✨ Fonctionnalités Principales

### 🔄 Import & Batch Processing
- ✅ Upload de fichiers CSV
- ✅ Parsing intelligent du format
- ✅ Mode Batch pour traiter plusieurs lignes
- ✅ Intégration Supabase

### 🧹 Nettoyage Parasites
- ✅ Supprime: "euh", "ben", "donc", "voilà", "quoi", etc.
- ✅ Élimine: "pour ainsi dire", "si tu veux", "tu sais", etc.
- ✅ 50+ expressions parasites détectées
- ✅ Normalisation des espaces

### 🔐 Validation RGPD (IA)
- ✅ Détection automatique de données sensibles
- ✅ Suppression: noms, emails, téléphones
- ✅ Suppression: IBAN, numéros de carte
- ✅ Suppression: dates de naissance
- ✅ Powered by OpenAI GPT-4o-mini

### 📊 Suivi & Statistiques
- ✅ Dashboard en temps réel
- ✅ Compteur: traité/en attente
- ✅ Logs détaillés des violations RGPD
- ✅ Exportable depuis Supabase

---

## 🚀 Quick Start (5 minutes)

### 1. Installation automatique
```bash
python install.py
```

### 2. Exécuter le SQL Supabase
Copier le contenu de `supabase_migration.sql` dans Supabase SQL Editor et exécuter.

### 3. Démarrer les serveurs

**Terminal 1 - Backend:**
```bash
python backend_api.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend-app
npm run dev
```

### 4. Tester
1. Allez sur http://localhost:3000/seller
2. Créez ou importez un CSV avec des transcriptions
3. Cliquez "Lancer l'Analyse"
4. Cliquez "Nettoyer RGPD"
5. Vérifiez les résultats dans Supabase

---

## 📁 Structure du Projet

```
BDD-lvmh/
├── 📄 README.md (ce fichier)
├── 📋 SETUP.md (guide installation détaillé)
├── 📊 ARCHITECTURE.md (design technique)
├── 📝 CHANGELOG.md (modifications)
│
├── 🐍 Backend (Python)
│   ├── backend_api.py (API FastAPI - MODIFIED)
│   ├── cleaning_service.py (Service RGPD - NEW)
│   ├── requirements_ai.txt (Dépendances - MODIFIED)
│   ├── examples.py (Exemples - NEW)
│   └── test_cleaning_service.py (Tests - NEW)
│
├── 💻 Frontend (Next.js)
│   ├── frontend-app/
│   │   ├── pages/
│   │   │   └── seller.tsx (Import CSV - MODIFIED)
│   │   ├── hooks/
│   │   │   ├── useSupabase.tsx
│   │   │   └── useTranscriptionCleaning.tsx (NEW)
│   │   └── package.json
│   │
├── 🗄️ Database (Supabase)
│   └── supabase_migration.sql (Schema SQL - NEW)
│
└── 📚 Configuration
    ├── .env (Variables d'environnement - EXISTING)
    └── install.py (Installation script - NEW)
```

---

## 🔧 Configuration Requise

### Environment Variables (`.env`)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://[projet].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[clé-api]
OPENAI_API_KEY=sk-proj-[clé]
```

### Dépendances
- **Python 3.8+**
- **Node.js 16+**
- **pip / npm**

### Services Externes
- Supabase (base de données)
- OpenAI API (nettoyage RGPD)

---

## 📊 Schema Supabase

### `transcriptions` (Raw uploads)
```sql
├─ id (UUID)
├─ created_at (timestamp)
├─ raw_text (TEXT)
├─ client_name (varchar)
├─ is_processed (boolean) -- Flag pour traitement
└─ status (varchar)
```

### `cleaned_transcriptions` (Résultats)
```sql
├─ id (UUID)
├─ created_at (timestamp)
├─ transcription_id (FK)
├─ cleaned_text (TEXT) -- Final result
├─ is_rgpd_compliant (boolean)
├─ violations_detected (JSONB)
└─ processing_status (varchar)
```

---

## 🎯 Flux d'Utilisation Détaillé

### Étape 1: Import CSV
```plaintext
Utilisateur
    ↓
seller.tsx → handleFileUpload()
    ↓
Parse CSV → Crée BatchItems
    ↓
Affiche en mode Batch
```

### Étape 2: Analyse Initiale
```plaintext
Utilisateur clique "Lancer l'Analyse"
    ↓
runBatchAnalysis()
    ↓
Appelle /api/analyze (OpenAI)
    ↓
saveTranscription() → INSERT into transcriptions
```

### Étape 3: Nettoyage RGPD (🆕)
```plaintext
Utilisateur clique "Nettoyer RGPD"
    ↓
startCleaningPipeline()
    ↓
POST /api/supabase/process-transcriptions
    ↓
Backend:
├─ clean_parasitic_words()
├─ check_rgpd_compliance()
└─ INSERT into cleaned_transcriptions
```

---

## 🧪 Test & Validation

### Run Examples
```bash
python examples.py
```

### Run Unit Tests
```bash
pip install pytest
python -m pytest test_cleaning_service.py -v
```

### Manual Test
```bash
# Terminal 1
python backend_api.py

# Terminal 2
cd frontend-app && npm run dev

# Browser
# Allez sur http://localhost:3000/seller
# Importez un CSV test
# Cliquez les boutons
```

---

## 📚 Documentation Complète

- **SETUP.md** → Guide installation étape-par-étape
- **ARCHITECTURE.md** → Design technique et flux
- **CHANGELOG.md** → Tous les changements effectués
- **IMPLEMENTATION_SUMMARY.md** → Vue d'ensemble
- **examples.py** → Exemples d'utilisation du service

---

## 🔐 Sécurité & RGPD

### Données Supprimées Automatiquement
- 👤 Noms propres (personnes, lieux)
- 📧 Adresses email
- 📞 Numéros de téléphone
- 💳 Numéros IBAN / Carte bancaire
- 🗓️ Dates de naissance
- 🏥 Données médicales
- 🔐 Numéros d'identification

### Conformité
- ✅ Audit des violations détectées
- ✅ Flag "is_rgpd_compliant"
- ✅ Logs détaillés sauvegardés
- ✅ Traçabilité complète dans Supabase

---

## 📊 Performances

- **Traitement séquentiel** pour éviter les rate limits
- **Cache frontend** (localStorage)
- **Indexes Supabase** pour requêtes rapides
- **Batch requests** optimisées

---

## 🐛 Troubleshooting

| Problème | Solution |
|----------|----------|
| Backend ne démarre | `pip install -r requirements_ai.txt` |
| Erreur CORS | Vérifiez que le backend est sur `localhost:8000` |
| Erreur Supabase | Exécutez `supabase_migration.sql` |
| OpenAI timeout | Vérifiez votre API key et quota |
| Données ne s'insèrent pas | Vérifiez RLS désactivé en dev |

**Pour plus de détails**, voir **SETUP.md** section Dépannage.

---

## 🚀 Déploiement Production

1. **Activer RLS** sur les tables Supabase
2. **Configurer les policies** d'accès
3. **Variables d'env sécurisées** (secrets manager)
4. **Rate limiting** sur l'API
5. **Monitoring** et logs centralisés

---

## 📈 Roadmap

- [x] Suppression parasites
- [x] Validation RGPD (IA)
- [x] Import CSV
- [x] Intégration Supabase
- [ ] Dashboard de monitoring
- [ ] Système de roll-back
- [ ] Export des résultats
- [ ] Webhooks/Notifications
- [ ] Multi-langue

---

## 💡 Exemples

### Avant
```
Raw: "Euh bonjour, je suis Marie Dupont, mon email c'est marie@gmail.com, 
       ben je veux acheter un sac, 06 12 34 56"
```

### Après
```
Clean: "Bonjour je veux acheter un sac"
RGPD: ✅ COMPLIANT
Violations: ["Nom propre", "Email", "Téléphone"]
```

---

## 📞 Support

- 📖 Lire **SETUP.md** pour l'installation
- 🏗️ Lire **ARCHITECTURE.md** pour le design
- 🐛 Vérifier les logs du backend pour les erreurs
- 💾 Vérifier Supabase Dashboard pour les données

---

## 📄 License

Projet interne LVMH - Tous droits réservés

---

## ✅ Checklist Installation

- [ ] Python 3.8+, Node.js 16+
- [ ] Variables d'env configurées (.env)
- [ ] Dépendances installées (`pip`, `npm`)
- [ ] SQL migration executée (Supabase)
- [ ] Backend démarré (`python backend_api.py`)
- [ ] Frontend démarré (`npm run dev`)
- [ ] CSV test importé
- [ ] Pipeline nettoyage exécuté
- [ ] Résultats vérifiés dans Supabase

---

**🎉 Prêt à nettoyer des transcriptions en masse!**

Besoin d'aide? Consultez **SETUP.md** → Section Dépannage

Bon nettoyage! 🧹✨
