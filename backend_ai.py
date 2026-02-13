from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
import whisper
import openai
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv
import json

# Charger les variables d'environnement (.env)
load_dotenv()

app = FastAPI(title="LVMH Voice Cockpit - AI Backend")

# Configuration CORS pour le frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # À restreindre en production
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration OpenAI
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if OPENAI_API_KEY:
    openai.api_key = OPENAI_API_KEY
else:
    print("⚠️  WARNING: OPENAI_API_KEY not found in .env. LLM features will be mocked.")

# Chargement du modèle Whisper au démarrage (peut prendre du temps)
# On utilise "base" pour aller vite, "small" ou "medium" pour plus de précision
try:
    print("⏳ Loading Whisper model...")
    model = whisper.load_model("base")
    print("✅ Whisper model loaded.")
except Exception as e:
    print(f"❌ Error loading Whisper: {e}")
    model = None

# ---- Modèles de Données (Pydantic) ----

class AnalysisResult(BaseModel):
    intention: str
    phase: str
    produits: List[str]
    budget: str
    emotion: str
    timing: str
    type_client: str
    intent_score: int

class AnalysisRequest(BaseModel):
    text: str

# ---- Endpoints ----

@app.get("/")
def health_check():
    return {"status": "online", "whisper": model is not None, "openai": OPENAI_API_KEY is not None}

@app.post("/api/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Étape 1 : Reçoit l'audio et renvoie la transcription brute (Whisper).
    """
    temp_filename = f"temp_{file.filename}"
    with open(temp_filename, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
        if model:
            print(f"🎤 Transcribing {temp_filename}...")
            result = model.transcribe(temp_filename, language="fr")
            transcription = result["text"].strip()
        else:
            transcription = "Simulation: Le modèle Whisper n'est pas chargé."

        print(f"📝 Text: {transcription}")
        return {"transcription": transcription}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)

@app.post("/api/analyze")
async def analyze_text(request: AnalysisRequest):
    """
    Étape 2 : Reçoit du texte et renvoie l'analyse JSON (GPT-4o).
    """
    print(f"🧠 Analyzing text: {request.text[:50]}...")
    analysis = analyze_text_with_llm(request.text)
    return analysis


def analyze_text_with_llm(text: str) -> dict:
    """
    Analyse le texte avec GPT-4o pourcextraire les données structurées.
    """
    # Si pas de clé API, on renvoie du mock intelligent
    if not OPENAI_API_KEY:
        return mock_analysis(text)

    prompt = f"""
    Tu es un assistant expert pour la vente de luxe LVMH. Analyse la transcription suivante d'un client.
    Extraction au format JSON strict (sans markdown).
    
    Champs requis :
    - intention: "Achat", "Renseignement", "Cadeau", "SAV", "Autre"
    - phase: "Découverte", "Essayage", "Objection", "Closing", "SAV"
    - produits: liste de strings (ex: ["Sac Capucines", "Montre"])
    - budget: "Non précisé", "1k-5k", "5k-20k", "20k+"
    - emotion: "Joie", "Hésitation", "Colère", "Neutre"
    - timing: "Immédiat", "Cette semaine", "Indéfini"
    - type_client: "VIP", "Régulier", "Nouveau" (déduire du contexte)
    - intent_score: entier 0-100 (probabilité d'achat)

    Transcription : "{text}"
    """

    try:
        response = openai.ChatCompletion.create(
            model="gpt-4o",  # ou "gpt-3.5-turbo"
            messages=[
                {"role": "system", "content": "Tu es une API JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.0
        )
        content = response.choices[0].message.content
        # Nettoyage basique si l'IA ajoute ```json ... ```
        if "```" in content:
            content = content.replace("```json", "").replace("```", "")
        
        return json.loads(content)

    except Exception as e:
        print(f"❌ LLM Error: {e}")
        return mock_analysis(text)


def mock_analysis(text: str) -> dict:
    """
    Mode dégradé (Regex/Heuristique) si pas d'IA.
    C'est essentiellement ce que fait déjà votre frontend, mais côté serveur.
    """
    lower_text = text.lower()
    
    intention = "Renseignement"
    if "acheter" in lower_text or "prends" in lower_text: intention = "Achat"
    
    phase = "Découverte"
    if "prix" in lower_text: phase = "Objection"
    
    return {
        "intention": intention,
        "phase": phase,
        "produits": [],
        "budget": "Non précisé",
        "emotion": "Neutre",
        "timing": "Indéfini",
        "type_client": "Nouveau",
        "intent_score": 50
    }

if __name__ == "__main__":
    import uvicorn
    # Lancer sur le port 8001 pour ne pas conflit avec l'autre (8000)
    uvicorn.run(app, host="0.0.0.0", port=8001)
