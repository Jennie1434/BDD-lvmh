# API Locale Next.js - Guide d'Utilisation

## Architecture Simplifiée

L'application utilise maintenant une **API Next.js native** au lieu d'un backend FastAPI séparé.

### Avantages

✅ **Déploiement simplifié** - Un seul serveur à maintenir
✅ **Pas de dépendances Python** - Tout est en TypeScript/JavaScript
✅ **Meilleure performance** - Pas de surcharge réseau inter-serveurs
✅ **Développement plus facile** - Un seul process à lancer

## Structure des APIs

### 1. `POST /api/clean-transcriptions`

Déclenche le pipeline de nettoyage pour toutes les transcriptions en attente.

**Réponse:**
```json
{
  "success": true,
  "message": "2 transcription(s) traitée(s) avec succès",
  "data": {
    "processed_count": 2,
    "skipped_count": 0,
    "results": [
      {
        "id": "uuid-1",
        "original_text": "...",
        "cleaned_text": "...",
        "is_rgpd_compliant": true,
        "violations_detected": ["Nom_propre"],
        "processing_status": "completed",
        "updated_at": "2026-02-11T..."
      }
    ]
  }
}
```

### 2. `GET /api/cleaned-transcriptions`

Récupère les transcriptions nettoyées avec pagination.

**Paramètres de requête:**
- `limit` (default: 50) - Nombre de résultats
- `offset` (default: 0) - Position de départ
- `rgpd_compliant` (true/false) - Filtrer par conformité

**Exemple:**
```bash
GET /api/cleaned-transcriptions?limit=10&rgpd_compliant=true
```

### 3. `GET /api/transcription-stats`

Récupère les statistiques complètes.

**Réponse:**
```json
{
  "success": true,
  "total_transcriptions": 10,
  "processed_count": 8,
  "pending_count": 2,
  "rgpd_compliant_count": 6,
  "rgpd_non_compliant_count": 2
}
```

## Service de Nettoyage TypeScript

**Fichier:** `utils/transcriptionCleaner.ts`

### Fonctions Disponibles

#### `cleanParasiticWords(text: string): string`
Supprime les mots et expressions parasites.

```typescript
import { cleanParasiticWords } from '@/utils/transcriptionCleaner';

const cleaned = cleanParasiticWords('Euh, ben, tu sais, donc...');
// Résultat: "tu sais"
```

#### `detectRGPDViolations(text: string)`
Détecte et masque les données personnelles.

```typescript
import { detectRGPDViolations } from '@/utils/transcriptionCleaner';

const result = detectRGPDViolations('Jean Dupont: jean@email.com');
// Résultat:
// {
//   violations: ["Nom_propre", "Email"],
//   hasViolations: true,
//   cleanedText: "[NOM]: [EMAIL]"
// }
```

#### `processTranscriptionPipeline(rawText: string)`
Pipeline complet en une seule fonction.

```typescript
import { processTranscriptionPipeline } from '@/utils/transcriptionCleaner';

const result = processTranscriptionPipeline(rawText);
// {
//   original: "...",
//   afterParasites: "...",
//   finalCleaned: "...",
//   isRGPDCompliant: false,
//   violationsDetected: ["Nom_propre"]
// }
```

## Hook React

**Fichier:** `hooks/useTranscriptionCleaning.tsx`

```typescript
import { useTranscriptionCleaning } from '@/hooks/useTranscriptionCleaning';

function MyComponent() {
  const { processingStatus, startCleaningPipeline } = useTranscriptionCleaning();

  const handleClean = async () => {
    try {
      const result = await startCleaningPipeline();
      console.log('Nettoyage terminé:', result);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <div>
      <button onClick={handleClean}>Nettoyer</button>
      {processingStatus.isProcessing && <p>En cours...</p>}
      {processingStatus.message && <p>{processingStatus.message}</p>}
      {processingStatus.error && <p>Erreur: {processingStatus.error}</p>}
    </div>
  );
}
```

## Détection RGPD

Le système détecte et masque automatiquement:

- **Noms propres** → `[NOM]`
- **Emails** → `[EMAIL]`
- **Téléphones (FR)** → `[PHONE]`
- **IBAN** → `[IBAN]`
- **Cartes bancaires** → `[CARD]`
- **Numéros de sécurité sociale** → `[SSN]`

## Mots Parasites Supprimés

### Expressions longues (50+)
- "en quelque sorte", "pour ainsi dire", "je veux dire", etc.

### Hésitations
- "euh", "hum", "bah", "ben", "hein"

### Mots de liaison inutiles
- "voilà", "quoi", "alors", "donc", "enfin", "bref"

## Démarrage

```bash
# Lancer le serveur Next.js
npm run dev

# L'API est disponible à http://localhost:3000/api/clean-transcriptions
```

## Flux Complet

1. **Import CSV** → Stocké dans `transcriptions`
2. **Clic "Nettoyer RGPD"** → Appel à `POST /api/clean-transcriptions`
3. **Traitement** → Service TypeScript nettoie le texte
4. **Stockage** → Résultats dans `cleaned_transcriptions`
5. **Affichage** → Récupération via `GET /api/cleaned-transcriptions`

## Modification du Service

Pour ajouter de nouveaux mots parasites:

```typescript
// Dans transcriptionCleaner.ts
const PARASITIC_EXPRESSIONS = [
  /\bma nouvelle expression\b/gi,
  // ...
];
```

Pour améliorer la détection RGPD:

```typescript
// Dans la fonction detectRGPDViolations
if (/mon nouveau pattern/.test(text)) {
  violations.push('Ma_violation');
  cleanedText = cleanedText.replace(/.../, '[MASK]');
}
```

## Performance

- Traitement synchrone (instantané)
- Pas de dépendances externes (GPT optionnel)
- Scalable pour 1000+ transcriptions

## Troubleshooting

**Q: L'API retourne 500 ?**
A: Vérifiez les logs du serveur Next.js (`npm run dev` output)

**Q: Aucune transcription à traiter ?**
A: Vérifiez que vous avez importé un CSV avec le bouton "Lancer l'Analyse"

**Q: Les violations ne sont pas détectées ?**
A: Vérifiez `console` pour les patterns manquants et mettez à jour `transcriptionCleaner.ts`
