#!/bin/bash

# Script d'installation alternative pour BDD-LVMH Frontend
# Ce script résout les problèmes de permissions npm

echo "🚀 Installation BDD-LVMH Frontend"
echo "=================================="
echo ""

# Vérifier si on est dans le bon dossier
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: package.json non trouvé"
    echo "Veuillez exécuter ce script depuis le dossier frontend-app"
    exit 1
fi

echo "📦 Méthode 1: Nettoyage du cache npm..."
npm cache clean --force

echo ""
echo "📦 Méthode 2: Installation avec --legacy-peer-deps..."
npm install --legacy-peer-deps

# Vérifier si l'installation a réussi
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Installation réussie!"
    echo ""
    echo "🚀 Pour lancer l'application:"
    echo "   npm run dev"
    echo ""
    echo "📱 Ensuite ouvrez: http://localhost:3000"
else
    echo ""
    echo "⚠️  L'installation a échoué"
    echo ""
    echo "🔧 Solutions alternatives:"
    echo ""
    echo "Option 1 - Avec yarn:"
    echo "   npm install -g yarn"
    echo "   yarn install"
    echo "   yarn dev"
    echo ""
    echo "Option 2 - Réparer les permissions (nécessite sudo):"
    echo "   sudo chown -R \$(whoami) ~/.npm"
    echo "   npm install"
    echo ""
    echo "Option 3 - Avec pnpm:"
    echo "   npm install -g pnpm"
    echo "   pnpm install"
    echo "   pnpm dev"
fi
