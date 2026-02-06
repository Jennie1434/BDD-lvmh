print("⏳ Initialisation du script... (chargement des bibliothèques)")
import gspread
from google.oauth2.service_account import Credentials
import pandas as pd
import time
from datetime import datetime
import re

# ===========================
# CONFIGURATION
# ===========================

SPREADSHEET_NAME = "Data_LVMH"
SOURCE_SHEET = "client_transcriptions"
TARGET_SHEET = "client_transcriptions_clean"
CREDENTIALS_FILE = "credentials.json"

SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive'
]

# ===========================
# NETTOYAGE ULTRA AGRESSIF
# ===========================

def clean_transcription_aggressive(text):
    """
    Nettoyage ULTRA agressif sans IA.
    """
    if pd.isna(text) or text == "":
        return ""
    
    text = str(text)
    
    # 1. Mise en minuscule
    text = text.lower()
    
    # 2. SUPPRIMER TOUTES LES EXPRESSIONS PARASITES (liste exhaustive)
    expressions_a_supprimer = [
        # Expressions longues
        r'\ben quelque (sorte|manière)\b',
        r'\bpour ainsi dire\b',
        r'\bplus ou moins\b',
        r'\bsi je puis dire\b',
        r'\bcomme qui dirait\b',
        r'\bje veux dire\b',
        r'\bje dirais?\b',
        r'\bcomment dire\b',
        r'\bc\'?est[- ]à[- ]dire\b',
        r'\bde toute (façon|manière)\b',
        r'\bpour le coup\b',
        r'\bdu coup\b',
        r'\bau coup\b',
        
        # Expressions moyennes
        r'\bon va dire\b',
        r'\bsi vous voulez\b',
        r'\bsi tu veux\b',
        r'\btu (sais|vois)\b',
        r'\bvous (savez|voyez)\b',
        r'\ben (gros|fait|effet|réalité|tout cas|fin de compte)\b',
        r'\bpar (exemple|contre|hasard|ailleurs|conséquent|truc)\b',
        r'\bdisons que\b',
        r'\bje pense que\b',
        r'\bje crois que\b',
        
        # Expressions de remplissage
        r'\beh bien\.?\b',
        r'\bet ben\b',
        r'\bet euh\b',
        r'\bet donc\b',
        r'\bet alors\b',
        r'\bet puis\b',
    ]
    
    for expr in expressions_a_supprimer:
        text = re.sub(expr, ' ', text, flags=re.IGNORECASE)
    
    # 3. SUPPRIMER TOUS LES MOTS PARASITES SEULS (très agressif)
    mots_a_supprimer = [
        # Hésitations
        r'\be+u+h+\b',  # euh, euuh, euuuh
        r'\bh+u+m+\b',  # hum, humm, hummm
        r'\bh+m+\b',    # hm, hmm, hmmm
        r'\ba+h+\b',    # ah, ahh, ahhh
        r'\bo+h+\b',    # oh, ohh, ohhh
        r'\bb+a+h+\b',  # bah, bahh
        r'\bb+e+n+\b',  # ben, benn
        r'\bh+e+i+n+\b', # hein, heinn
        
        # Mots de liaison inutiles
        r'\bvoilà+\b',
        r'\bquoi+\b',
        r'\balors+\b',
        r'\bdonc+\b',
        r'\benfin+\b',
        r'\bbref+\b',
        r'\bpuis+\b',
        r'\bpis+\b',
        
        # Mots vagues
        r'\bmachin+\b',
        r'\btruc+\b',
        r'\bchose+\b',
        r'\bbidule+\b',
        
        # Interjections
        r'\blà+\b',
        r'\bhop+\b',
        r'\ballez+\b',
        r'\btiens+\b',
        r'\bdis+\b',
        r'\bécoute+\b',
        r'\bregarde+\b',
        
        # Autres
        r'\bgenre+\b',
        r'\bstyle+\b',
        r'\bcomme+\b(?=\s*[,.])',  # "comme" en fin de phrase
        r'\bbon+\b(?=\s*[,.])',    # "bon" en fin de phrase
    ]
    
    for mot in mots_a_supprimer:
        text = re.sub(mot, ' ', text, flags=re.IGNORECASE)
    
    # 4. NETTOYER LA PONCTUATION
    # Supprimer ponctuation en début de phrase
    text = re.sub(r'^\s*[,;.]+\s*', '', text)
    
    # Supprimer doubles ponctuations
    text = re.sub(r'\s*[,.]\s*[,.]', '.', text)
    text = re.sub(r'\.{2,}', '.', text)
    text = re.sub(r',{2,}', ',', text)
    
    # Espace avant ponctuation
    text = re.sub(r'\s+([,.;!?])', r'\1', text)
    
    # Espace après ponctuation
    text = re.sub(r'([,.;!?])(?=[^\s])', r'\1 ', text)
    
    # Supprimer ponctuation bizarre ". ,"
    text = re.sub(r'\.\s*,', ',', text)
    text = re.sub(r',\s*\.', '.', text)
    
    # 5. NETTOYER LES ESPACES
    # Espaces multiples
    text = re.sub(r'\s+', ' ', text)
    
    # Espaces autour du texte
    text = text.strip()
    
    # Supprimer espaces avant/après tirets
    text = re.sub(r'\s+-\s+', ' ', text)
    
    # 6. CORRECTIONS GRAMMATICALES
    corrections = {
        r'\bsais pas\b': 'ne sais pas',
        r'\bj\'?ai pas\b': "je n'ai pas",
        r'\bc\'?est pas\b': "ce n'est pas",
        r'\by\'?a\b': 'il y a',
        r'\bparceque\b': 'parce que',
        r'\bpuisque\b(?=\s)': 'puisque ',
    }
    
    for pattern, replacement in corrections.items():
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    
    # 7. CAPITALISATION INTELLIGENTE
    if text:
        # Première lettre en majuscule
        text = text[0].upper() + text[1:] if len(text) > 1 else text.upper()
        
        # Majuscule après point
        text = re.sub(r'(\.\s+)([a-z])', lambda m: m.group(1) + m.group(2).upper(), text)
        
        # Majuscule après point d'exclamation/interrogation
        text = re.sub(r'([!?]\s+)([a-z])', lambda m: m.group(1) + m.group(2).upper(), text)
    
    # 8. TERMINER PAR UN POINT
    if text and text[-1] not in '.!?':
        text += '.'
    
    # 9. NETTOYER LES VIRGULES EN DÉBUT DE PHRASE
    text = re.sub(r'\.\s*,', '.', text)
    text = re.sub(r'^,\s*', '', text)
    
    # 10. SUPPRIMER PHRASES VIDES (juste ponctuation)
    text = re.sub(r'\s*[,.;]+\s*\.', '.', text)
    text = re.sub(r'\.\s*\.', '.', text)
    
    return text


def detect_intention(text):
    """
    Détection d'intention avec regex avancées.
    """
    if pd.isna(text) or text == "":
        return "Autre"
    
    text = text.lower()
    
    # CADEAU - Patterns très précis
    cadeau_keywords = [
        r'\bcadeau\b',
        r'\boffrir\b',
        r'\boffert\b',
        r'\banniversaire\b',
        r'\bnoël\b',
        r'\bfête des (mères|pères)\b',
        r'\bsurprise\b',
        r'\bpour\s+(ma|mon|sa|son|leur)\s+(femme|mari|mère|père|fils|fille|ami|copain|copine|sœur|frère)\b',
    ]
    
    for pattern in cadeau_keywords:
        if re.search(pattern, text):
            return "Cadeau"
    
    # ACHAT PERSONNEL - Patterns précis
    perso_keywords = [
        r'\bpour\s+moi\b',
        r'\bje\s+(veux|cherche|souhaite|recherche|désire)\b',
        r'\bm\'?acheter\b',
        r'\bme\s+faire\s+plaisir\b',
        r'\bpour\s+ma\s+collection\b',
        r'\bje\s+me\s+(l\'?)?offre\b',
    ]
    
    for pattern in perso_keywords:
        if re.search(pattern, text):
            return "Achat personnel"
    
    return "Autre"


def detect_budget(text):
    """
    Détection de budget avec regex avancées.
    """
    if pd.isna(text) or text == "":
        return "Non précisé"
    
    text = text.lower()
    
    # Chercher montants explicites
    patterns = [
        r'(\d+)\s*k\s*(?:euros?|€)?',  # 20k, 20k euros
        r'(\d{4,})\s*(?:euros?|€)',     # 20000 euros
        r'(?:euros?|€)\s*(\d+)\s*k',    # euros 20k
        r'budget\s+(?:de\s+)?(\d+)',    # budget 20000
        r'(\d+)\s*mille',                # 20 mille
    ]
    
    montants = []
    for pattern in patterns:
        for match in re.finditer(pattern, text):
            try:
                montant = int(match.group(1))
                # Si < 100, c'est probablement en milliers
                if montant < 100:
                    montant *= 1000
                montants.append(montant)
            except:
                pass
    
    if montants:
        max_montant = max(montants)
        if max_montant >= 20000:
            return "20K+"
        elif max_montant >= 10000:
            return "10K-20K"
        else:
            return "Non précisé"
    
    # Chercher expressions budget élevé
    if re.search(r'\b(sans\s+(limite|budget)|budget\s+(élevé|important|conséquent|illimité))\b', text):
        return "20K+"
    
    return "Non précisé"


# ===========================
# FONCTION PRINCIPALE
# ===========================

def main():
    print("=" * 60)
    print("🚀 NETTOYAGE ULTRA AGRESSIF (SANS IA)")
    print("=" * 60)
    print(f"⏰ Démarrage : {datetime.now().strftime('%H:%M:%S')}")
    
    # Connexion
    print("\n📡 Connexion Google Sheets...")
    try:
        creds = Credentials.from_service_account_file(CREDENTIALS_FILE, scopes=SCOPES)
        client = gspread.authorize(creds)
        spreadsheet = client.open(SPREADSHEET_NAME)
        print("✅ Connecté")
    except Exception as e:
        print(f"❌ Erreur : {e}")
        return
    
    # Lecture
    print(f"\n📖 Lecture '{SOURCE_SHEET}'...")
    try:
        source_worksheet = spreadsheet.worksheet(SOURCE_SHEET)
        data = source_worksheet.get_all_records()
        df = pd.DataFrame(data)
        print(f"✅ {len(df)} lignes lues")
    except Exception as e:
        print(f"❌ Erreur : {e}")
        return
    
    if 'Transcription' not in df.columns:
        print("❌ Colonne 'Transcription' manquante")
        return
    
    # Nettoyage
    print(f"\n🧹 Nettoyage de {len(df)} transcriptions...")
    start = time.time()
    
    df['Clean_Transcription'] = df['Transcription'].apply(clean_transcription_aggressive)
    df['Intention'] = df['Clean_Transcription'].apply(detect_intention)
    df['Budget'] = df['Clean_Transcription'].apply(detect_budget)
    
    elapsed = time.time() - start
    print(f"✅ Terminé en {elapsed:.2f}s")
    
    # Stats
    print(f"\n📊 Statistiques :")
    print(f"   • Total : {len(df)}")
    print(f"   • Intentions :")
    for intent, count in df['Intention'].value_counts().items():
        print(f"     - {intent}: {count}")
    print(f"   • Budgets :")
    for budget, count in df['Budget'].value_counts().items():
        print(f"     - {budget}: {count}")
    
    # Écriture
    print(f"\n💾 Écriture '{TARGET_SHEET}'...")
    try:
        try:
            target = spreadsheet.worksheet(TARGET_SHEET)
            target.clear()
        except:
            target = spreadsheet.add_worksheet(title=TARGET_SHEET, rows=len(df)+1, cols=20)
        
        cols = [c for c in ['ID', 'Date', 'Duration', 'Language', 'Length', 
                'Clean_Transcription', 'Intention', 'Budget'] if c in df.columns]
        
        output = [cols] + df[cols].values.tolist()
        target.update(output, value_input_option='RAW')
        print(f"✅ {len(output)} lignes écrites")
    except Exception as e:
        print(f"❌ Erreur : {e}")
        return
    
    print(f"\n🎉 Terminé en {elapsed:.2f}s total")
    print(f"🔗 {spreadsheet.url}")


if __name__ == "__main__":
    main()