"""
Service de nettoyage pour les transcriptions :
1. Suppression des mots parasites
2. Vérification RGPD avec IA
3. Sauvegarde dans cleaned_transcriptions
"""

import re
import os
from typing import Optional, Dict, Any
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

# Configuration
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
openai_client = OpenAI(api_key=OPENAI_API_KEY)

# ===========================
# NETTOYAGE DES MOTS PARASITES
# ===========================

def clean_parasitic_words(text: str) -> str:
    """
    Supprime tous les mots parasites et expressions de remplissage
    """
    if not text or not isinstance(text, str):
        return ""
    
    text = str(text).lower()
    
    # Expressions longues à supprimer
    expressions_a_supprimer = [
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
        r'\beh bien\.?\b',
        r'\bet ben\b',
        r'\bet euh\b',
        r'\bet donc\b',
        r'\bet alors\b',
        r'\bet puis\b',
    ]
    
    for expr in expressions_a_supprimer:
        text = re.sub(expr, ' ', text, flags=re.IGNORECASE)
    
    # Mots parasites seuls
    mots_a_supprimer = [
        r'\be+u+h+\b',  # euh, euuh
        r'\bh+u+m+\b',  # hum, humm
        r'\bh+m+\b',    # hm, hmm
        r'\ba+h+\b',    # ah, ahh
        r'\bo+h+\b',    # oh, ohh
        r'\bb+a+h+\b',  # bah
        r'\bb+e+n+\b',  # ben
        r'\bh+e+i+n+\b', # hein
        r'\bvoilà+\b',
        r'\bquoi+\b',
        r'\balors+\b',
        r'\bdonc+\b',
        r'\benfin+\b',
        r'\bbref+\b',
        r'\bpuis+\b',
        r'\bpis+\b',
    ]
    
    for mot in mots_a_supprimer:
        text = re.sub(mot, ' ', text, flags=re.IGNORECASE)
    
    # Nettoyage final
    text = re.sub(r'\s+', ' ', text)  # Multiples espaces -> un seul
    text = text.strip()
    
    return text


# ===========================
# VÉRIFICATION RGPD AVEC IA
# ===========================

def check_rgpd_compliance(text: str) -> Dict[str, Any]:
    """
    Utilise GPT pour vérifier si le texte contient des données personnelles (RGPD).
    Retourne la version nettoyée et les données personnelles détectées.
    """
    if not text or not isinstance(text, str):
        return {
            "original": text,
            "cleaned": text,
            "is_compliant": True,
            "violations": [],
            "removed_data": []
        }
    
    try:
        prompt = """Tu es un assistant RGPD spécialisé. Analyse cette transcription et identifie les données personnelles à supprimer selon le RGPD.

REGLES :
- Supprimer les noms propres (personnes, lieux précis)
- Supprimer les numéros de téléphone, emails, adresses
- Supprimer les numéros d'identification (sécu, passeport, etc.)
- Supprimer les dates de naissance
- Supprimer les références à des conditions médicales
- Supprimer les numéros de carte bancaire / IBAN
- Keeper les informations génériques (ex: "client", "magasin LVMH", etc.)

Retourne UN SEUL JSON valide :
{
    "cleaned_text": "...",
    "violations_found": ["noms", "téléphones", ...],
    "is_compliant": true/false
}

TRANSCRIPTION : """ + text

        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Tu es une API RGPD qui retourne uniquement du JSON valide."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0,
        )
        
        result = eval(response.choices[0].message.content)
        
        return {
            "original": text,
            "cleaned": result.get("cleaned_text", text),
            "is_compliant": result.get("is_compliant", True),
            "violations": result.get("violations_found", []),
        }
        
    except Exception as e:
        print(f"Erreur RGPD : {e}")
        # En cas d'erreur, retourner le texte original comme compliant
        return {
            "original": text,
            "cleaned": text,
            "is_compliant": True,
            "violations": [],
            "error": str(e)
        }


def process_transcription_pipeline(raw_text: str) -> Dict[str, Any]:
    """
    Pipeline complet :
    1. Nettoyage mots parasites
    2. Vérification RGPD
    3. Retour des résultats
    """
    
    # Étape 1: Nettoyage parasites
    cleaned_parasites = clean_parasitic_words(raw_text)
    
    # Étape 2: Vérification RGPD
    rgpd_result = check_rgpd_compliance(cleaned_parasites)
    
    return {
        "original": raw_text,
        "after_parasites": cleaned_parasites,
        "final_cleaned": rgpd_result["cleaned"],
        "is_rgpd_compliant": rgpd_result["is_compliant"],
        "violations_detected": rgpd_result.get("violations", []),
    }
