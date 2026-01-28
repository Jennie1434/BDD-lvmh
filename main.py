import gspread
from google.oauth2.service_account import Credentials
import pandas as pd
import regex as re
import time
from datetime import datetime

# ===========================
# CONFIGURATION
# ===========================

SPREADSHEET_NAME = "Data_LVMH"
SOURCE_SHEET = "client_transcriptions"
TARGET_SHEET = "client_transcriptions_clean"
CREDENTIALS_FILE = "credentials.json"

# Scopes nécessaires pour Google Sheets
SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive'
]


# ===========================
# FONCTIONS DE NETTOYAGE
# ===========================

def clean_transcription(text):
    """
    Nettoie le texte de la transcription en supprimant les mots parasites,
    emojis, caractères inutiles, et normalise le format.
    """
    if pd.isna(text) or text == "":
        return ""
    
    text = str(text)
    
    # 1. Mettre en minuscules
    text = text.lower()
    
    # 2. Supprimer les emojis et caractères spéciaux
    # Regex pour supprimer les emojis
    emoji_pattern = re.compile("["
        u"\U0001F600-\U0001F64F"  # emoticons
        u"\U0001F300-\U0001F5FF"  # symbols & pictographs
        u"\U0001F680-\U0001F6FF"  # transport & map symbols
        u"\U0001F1E0-\U0001F1FF"  # flags
        u"\U00002702-\U000027B0"
        u"\U000024C2-\U0001F251"
        "]+", flags=re.UNICODE)
    text = emoji_pattern.sub(r'', text)
    
    # 3. Supprimer les mots parasites
    mots_parasites = [
        r'\beuuu+h?\b', r'\behh+\b', r'\bumm+\b', r'\bhmm+\b',
        r'\blaaa+\b', r'\beuh+\b', r'\bah+\b', r'\boh+\b',
        r'\bbah+\b', r'\bben+\b', r'\bhein\b', r'\bvoilà\b',
        r'\bquoi\b(?! que)', r'\balors\b', r'\bdonc\b'
    ]
    
    for mot in mots_parasites:
        text = re.sub(mot, ' ', text, flags=re.IGNORECASE)
    
    # 4. Corriger les fautes courantes
    corrections = {
        r'\bsa\b(?=\s+marque)': 'ça',
        r'\bsais\s+pas\b': 'ne sais pas',
        r'\bj\'?ai\s+pas\b': "je n'ai pas",
        r'\bc\'?est\s+pas\b': "ce n'est pas",
        r'\by\s*\'?\s*a\b': 'il y a',
        r'\bparce\s+que\b': 'parce que',
    }
    
    for pattern, replacement in corrections.items():
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    
    # 5. Supprimer la ponctuation excessive et caractères inutiles
    text = re.sub(r'[^\w\s\'\-.,!?€$]', ' ', text)
    text = re.sub(r'\.{2,}', '.', text)
    text = re.sub(r'\s+([.,!?])', r'\1', text)
    
    # 6. Enlever les espaces en trop
    text = re.sub(r'\s+', ' ', text)
    text = text.strip()
    
    return text


def detect_intention(text):
    """
    Détecte l'intention d'achat dans le texte.
    Retourne : "Cadeau", "Achat personnel", ou "Autre"
    """
    if pd.isna(text) or text == "":
        return "Autre"
    
    text = text.lower()
    
    # Patterns pour cadeaux
    cadeau_patterns = [
        r'\bcadeau\b', r'\boffrir\b', r'\boffert\b',
        r'\banniversaire\b', r'\bnoël\b', r'\bfête\b',
        r'\bpour\s+(ma|mon|sa|son)\s+(femme|mari|mère|père|ami|copain)',
        r'\bsurprise\b'
    ]
    
    # Patterns pour achat personnel
    perso_patterns = [
        r'\bpour\s+moi\b', r'\bje\s+veux\b', r'\bje\s+cherche\b',
        r'\bje\s+souhaite\b', r'\bm\'?acheter\b',
        r'\bme\s+faire\s+plaisir\b', r'\bpour\s+ma\s+collection\b'
    ]
    
    # Vérifier les patterns
    for pattern in cadeau_patterns:
        if re.search(pattern, text):
            return "Cadeau"
    
    for pattern in perso_patterns:
        if re.search(pattern, text):
            return "Achat personnel"
    
    return "Autre"


def detect_budget(text):
    """
    Détecte le budget mentionné dans le texte.
    Retourne : "20K+", "10K-20K", ou "Non précisé"
    """
    if pd.isna(text) or text == "":
        return "Non précisé"
    
    text = text.lower()
    
    # Patterns pour montants
    # Chercher des montants en euros ou dollars
    montant_patterns = [
        r'(\d+)\s*k(?:\s*euros?|\s*€)?',  # 20k, 20k euros, 20k€
        r'(\d+)\s*000\s*(?:euros?|€|\$)',  # 20000 euros, 20000€
        r'(?:euros?|€|\$)\s*(\d+)\s*k',    # euros 20k, € 20k
        r'(?:euros?|€|\$)\s*(\d+)\s*000',  # euros 20000
    ]
    
    montants = []
    for pattern in montant_patterns:
        matches = re.findall(pattern, text)
        for match in matches:
            try:
                montant = int(match)
                # Si le montant est < 100, c'est probablement en milliers
                if montant < 100:
                    montants.append(montant * 1000)
                else:
                    montants.append(montant)
            except:
                continue
    
    if montants:
        max_montant = max(montants)
        
        if max_montant >= 20000:
            return "20K+"
        elif max_montant >= 10000:
            return "10K-20K"
    
    # Chercher des expressions de budget
    if re.search(r'\b(?:budget|prix|montant)\s+(?:élevé|important|conséquent)', text):
        return "20K+"
    
    if re.search(r'\b(?:pas|sans)\s+(?:limite|budget)\b', text):
        return "20K+"
    
    return "Non précisé"


# ===========================
# FONCTION PRINCIPALE
# ===========================

def main():
    """
    Fonction principale qui orchestre le nettoyage des données.
    """
    print("=" * 60)
    print("🚀 DÉMARRAGE DU SCRIPT DE DATA CLEANING")
    print("=" * 60)
    print(f"⏰ Heure de démarrage : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # ===========================
    # ÉTAPE 1 : Connexion à Google Sheets
    # ===========================
    print("📡 ÉTAPE 1/6 : Connexion à Google Sheets...")
    try:
        creds = Credentials.from_service_account_file(
            CREDENTIALS_FILE,
            scopes=SCOPES
        )
        client = gspread.authorize(creds)
        print("✅ Connexion réussie avec le service account")
    except FileNotFoundError:
        print(f"❌ ERREUR : Fichier '{CREDENTIALS_FILE}' introuvable")
        print("   → Assurez-vous que le fichier credentials.json est dans le même dossier")
        return
    except Exception as e:
        print(f"❌ ERREUR de connexion : {e}")
        return
    
    # ===========================
    # ÉTAPE 2 : Ouvrir le spreadsheet
    # ===========================
    print(f"\n📂 ÉTAPE 2/6 : Ouverture du spreadsheet '{SPREADSHEET_NAME}'...")
    try:
        spreadsheet = client.open(SPREADSHEET_NAME)
        print(f"✅ Spreadsheet ouvert : {spreadsheet.title}")
    except gspread.SpreadsheetNotFound:
        print(f"❌ ERREUR : Spreadsheet '{SPREADSHEET_NAME}' introuvable")
        print("   → Vérifiez le nom du spreadsheet")
        print("   → Assurez-vous de l'avoir partagé avec le service account")
        return
    except Exception as e:
        print(f"❌ ERREUR : {e}")
        return
    
    # ===========================
    # ÉTAPE 3 : Lecture des données source
    # ===========================
    print(f"\n📖 ÉTAPE 3/6 : Lecture de la feuille '{SOURCE_SHEET}'...")
    try:
        source_worksheet = spreadsheet.worksheet(SOURCE_SHEET)
        data = source_worksheet.get_all_records()
        df = pd.DataFrame(data)
        print(f"✅ {len(df)} lignes lues avec succès")
        print(f"   Colonnes trouvées : {list(df.columns)}")
    except gspread.WorksheetNotFound:
        print(f"❌ ERREUR : Feuille '{SOURCE_SHEET}' introuvable")
        return
    except Exception as e:
        print(f"❌ ERREUR : {e}")
        return
    
    if df.empty:
        print("⚠️  ATTENTION : Aucune donnée trouvée dans la feuille source")
        return
    
    # ===========================
    # ÉTAPE 4 : Nettoyage et analyse
    # ===========================
    print(f"\n🧹 ÉTAPE 4/6 : Nettoyage et analyse des transcriptions...")
    
    # Vérifier que la colonne Transcription existe
    if 'Transcription' not in df.columns:
        print("❌ ERREUR : La colonne 'Transcription' n'existe pas")
        print(f"   Colonnes disponibles : {list(df.columns)}")
        return
    
    start_time = time.time()
    
    # Appliquer les transformations
    print("   → Nettoyage des transcriptions...")
    df['Clean_Transcription'] = df['Transcription'].apply(clean_transcription)
    
    print("   → Détection des intentions...")
    df['Intention'] = df['Clean_Transcription'].apply(detect_intention)
    
    print("   → Détection des budgets...")
    df['Budget'] = df['Clean_Transcription'].apply(detect_budget)
    
    elapsed_time = time.time() - start_time
    print(f"✅ Nettoyage terminé en {elapsed_time:.2f} secondes")
    
    # Statistiques
    print(f"\n📊 Statistiques :")
    print(f"   • Total de lignes traitées : {len(df)}")
    print(f"   • Intentions détectées :")
    print(df['Intention'].value_counts().to_string(header=False).replace('\n', '\n     '))
    print(f"   • Budgets détectés :")
    print(df['Budget'].value_counts().to_string(header=False).replace('\n', '\n     '))
    
    # ===========================
    # ÉTAPE 5 : Écriture des résultats
    # ===========================
    print(f"\n💾 ÉTAPE 5/6 : Écriture dans la feuille '{TARGET_SHEET}'...")
    
    try:
        # Ouvrir ou créer la feuille cible
        try:
            target_worksheet = spreadsheet.worksheet(TARGET_SHEET)
            print(f"   → Feuille '{TARGET_SHEET}' trouvée, elle sera écrasée")
            target_worksheet.clear()
        except gspread.WorksheetNotFound:
            print(f"   → Création de la feuille '{TARGET_SHEET}'")
            target_worksheet = spreadsheet.add_worksheet(
                title=TARGET_SHEET,
                rows=len(df) + 1,
                cols=len(df.columns)
            )
        
        # Préparer les données pour l'écriture
        # Ordre des colonnes
        output_columns = ['ID', 'Date', 'Duration', 'Language', 'Length', 
                         'Clean_Transcription', 'Intention', 'Budget']
        
        # Garder uniquement les colonnes qui existent
        output_columns = [col for col in output_columns if col in df.columns]
        df_output = df[output_columns]
        
        # Convertir en liste de listes pour gspread
        data_to_write = [df_output.columns.tolist()] + df_output.values.tolist()
        
        # Écrire les données
        print(f"   → Écriture de {len(data_to_write)} lignes...")
        target_worksheet.update(data_to_write, value_input_option='RAW')
        
        print(f"✅ Données écrites avec succès dans '{TARGET_SHEET}'")
        
    except Exception as e:
        print(f"❌ ERREUR lors de l'écriture : {e}")
        return
    
    # ===========================
    # ÉTAPE 6 : Finalisation
    # ===========================
    print(f"\n🎉 ÉTAPE 6/6 : Finalisation...")
    print("✅ Script terminé avec succès !")
    print()
    print("=" * 60)
    print(f"⏰ Heure de fin : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    print()
    print(f"🔗 Accéder au spreadsheet : {spreadsheet.url}")


# ===========================
# POINT D'ENTRÉE
# ===========================

if __name__ == "__main__":
    main()