#!/usr/bin/env python3
"""
Script d'installation automatique du système de nettoyage RGPD
Run: python install.py
"""

import os
import sys
import subprocess
from pathlib import Path

# Couleurs pour le terminal
GREEN = '\033[92m'
YELLOW = '\033[93m'
RED = '\033[91m'
BLUE = '\033[94m'
ENDC = '\033[0m'

def print_header(text):
    print(f"\n{BLUE}{'='*80}{ENDC}")
    print(f"{BLUE}{text:^80}{ENDC}")
    print(f"{BLUE}{'='*80}{ENDC}\n")

def print_success(text):
    print(f"{GREEN}✅ {text}{ENDC}")

def print_warning(text):
    print(f"{YELLOW}⚠️  {text}{ENDC}")

def print_error(text):
    print(f"{RED}❌ {text}{ENDC}")

def print_info(text):
    print(f"{BLUE}ℹ️  {text}{ENDC}")

def run_command(cmd, description):
    """Exécute une commande et affiche le statut"""
    print_info(description)
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print_success(description)
            return True
        else:
            print_error(f"{description}: {result.stderr}")
            return False
    except Exception as e:
        print_error(f"{description}: {str(e)}")
        return False

def check_file_exists(filepath, description):
    """Vérifie qu'un fichier existe"""
    if Path(filepath).exists():
        print_success(f"{description} encontré")
        return True
    else:
        print_warning(f"{description} NOT found at {filepath}")
        return False

def check_env_var(var_name):
    """Vérifie qu'une variable d'environnement est configurée"""
    value = os.getenv(var_name)
    if value:
        print_success(f"{var_name} configuré")
        return True
    else:
        print_warning(f"{var_name} NOT configured")
        return False

print_header("Installation - Système Nettoyage RGPD LVMH")

# ============================================================
# Étape 1 : Vérifications préalables
# ============================================================
print_info("Étape 1: Vérifications préalables")
print("-" * 80)

all_files_exist = True

files_to_check = [
    ("cleaning_service.py", "Service nettoyage"),
    ("backend_api.py", "API Backend"),
    ("requirements_ai.txt", "Dépendances"),
    ("frontend-app/hooks/useTranscriptionCleaning.tsx", "Hook Frontend"),
]

for filepath, description in files_to_check:
    if not check_file_exists(filepath, description):
        all_files_exist = False

if not all_files_exist:
    print_error("Certains fichiers manquent!")
    sys.exit(1)

print_success("Tous les fichiers sont présents\n")

# ============================================================
# Étape 2 : Vérifier les variables d'environnement
# ============================================================
print_info("Étape 2: Vérification .env")
print("-" * 80)

env_vars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "OPENAI_API_KEY"
]

env_file_path = Path(".env")
if not env_file_path.exists():
    print_warning(f".env NOT found at {env_file_path}")
else:
    print_success(".env found")
    
    missing_vars = []
    for var in env_vars:
        if check_env_var(var):
            pass
        else:
            missing_vars.append(var)
    
    if missing_vars:
        print_error(f"Variables manquantes: {', '.join(missing_vars)}")
        print_warning("Veuillez compléter votre fichier .env")
    else:
        print_success("Toutes les variables d'environnement sont configurées\n")

# ============================================================
# Étape 3 : Installation dépendances Python
# ============================================================
print_info("Étape 3: Installation dépendances Python")
print("-" * 80)

if run_command("pip install -r requirements_ai.txt", "Installation pip (requirements_ai.txt)"):
    print_success("Dépendances Python installées\n")
else:
    print_warning("Certaines dépendances n'ont pas pu être installées\n")

# ============================================================
# Étape 4 : Vérifier Supabase
# ============================================================
print_info("Étape 4: Vérification Supabase")
print("-" * 80)

print_warning("⚠️  IMPORTANT: Exécutez le SQL suivant dans Supabase SQL Editor:")
print("-" * 80)
print("""
1. Allez sur https://app.supabase.com
2. Sélectionnez votre projet
3. Allez dans SQL Editor → New Query
4. Copiez-collez le contenu de: supabase_migration.sql
5. Cliquez Run
""")
print("-" * 80)

# ============================================================
# Étape 5 : Vérifier Node.js
# ============================================================
print_info("Étape 5: Vérification Node.js")
print("-" * 80)

if run_command("node -v", "Vérification Node.js"):
    print_success("Node.js est installé\n")
else:
    print_error("Node.js n'est pas installé!")
    print_info("Téléchargez-le sur: https://nodejs.org/\n")

# ============================================================
# Résumé final
# ============================================================
print_header("Installation Terminée ✅")

print("""
📋 PROCHAINES ÉTAPES:

1. ✅ Exécutez le SQL de supabase_migration.sql dans Supabase
   
2. 🔧 Démarrez le Backend:
   python backend_api.py
   
3. 💻 Démarrez le Frontend (nouvelle fenêtre):
   cd frontend-app
   npm install  (si nécessaire)
   npm run dev
   
4. 🧪 Testez le pipeline:
   - Allez sur http://localhost:3000/seller
   - Importez un CSV
   - Cliquez "Lancer l'Analyse"
   - Cliquez "Nettoyer RGPD"
   
5. 📊 Vérifiez les résultats dans Supabase:
   SELECT * FROM cleaned_transcriptions LIMIT 5;

📚 DOCUMENTATION:

- SETUP.md              → Guide d'installation complet
- ARCHITECTURE.md       → Design technique détaillé
- CHANGELOG.md          → Résumé des modifications
- IMPLEMENTATION_SUMMARY.md → Vue d'ensemble

🆘 PROBLÈMES?

- Vérifiez que .env a toutes les clés requises
- Vérifiez que le SQL de migration a été exécuté
- Vérifiez les logs du backend pour les erreurs
- Consultez le guide de dépannage dans SETUP.md

🚀 C'est prêt! Bon nettoyage! 🧹✨
""")

print("-" * 80)
print("Pour exécuter les tests:")
print("  python examples.py          # Voir des exemples")
print("  python -m pytest test_cleaning_service.py -v  # Tests unitaires")
print("-" * 80)
