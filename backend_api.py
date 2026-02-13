from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import gspread
from google.oauth2.service_account import Credentials
import pandas as pd
import os
import subprocess
import sys
from dotenv import load_dotenv
from supabase import create_client, Client
from cleaning_service import process_transcription_pipeline

load_dotenv()

app = FastAPI()

# Allow CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
SPREADSHEET_NAME = "Data_LVMH"
TARGET_SHEET = "client_transcriptions_clean"
CREDENTIALS_FILE = "credentials.json"

# Supabase Configuration
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive'
]

def get_gsheets_client():
    try:
        creds = Credentials.from_service_account_file(CREDENTIALS_FILE, scopes=SCOPES)
        return gspread.authorize(creds)
    except Exception as e:
        print(f"Error connecting to Google Sheets: {e}")
        return None

@app.get("/api/transcriptions")
async def get_transcriptions():
    client = get_gsheets_client()
    if not client:
        raise HTTPException(status_code=500, detail="Could not connect to Google Sheets")
    
    try:
        spreadsheet = client.open(SPREADSHEET_NAME)
        worksheet = spreadsheet.worksheet(TARGET_SHEET)
        data = worksheet.get_all_records()
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stats")
async def get_stats():
    client = get_gsheets_client()
    if not client:
        raise HTTPException(status_code=500, detail="Could not connect to Google Sheets")
    
    try:
        spreadsheet = client.open(SPREADSHEET_NAME)
        worksheet = spreadsheet.worksheet(TARGET_SHEET)
        data = worksheet.get_all_records()
        df = pd.DataFrame(data)
        
        stats = {
            "total": len(df),
            "intentions": df['Intention'].value_counts().to_dict() if 'Intention' in df.columns else {},
            "budgets": df['Budget'].value_counts().to_dict() if 'Budget' in df.columns else {}
        }
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/run-cleanup")
async def run_cleanup():
    try:
        # Execute main.py as a subprocess
        # We use the same python interpreter
        result = subprocess.run(
            [sys.executable, "main.py"],
            capture_output=True,
            text=True,
            cwd=os.path.dirname(os.path.abspath(__file__))
        )
        
        if result.returncode == 0:
            return {"status": "success", "message": "Nettoyage terminé avec succès", "output": result.stdout}
        else:
            return {"status": "error", "message": "Erreur lors du nettoyage", "error": result.stderr}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to run script: {str(e)}")


# ===========================
# SUPABASE CLEANING PIPELINE
# ===========================

@app.post("/api/supabase/process-transcriptions")
async def process_transcriptions_supabase():
    """
    Nettoyage complet du flux CSV :
    1. Récupère les transcriptions brutes de 'transcriptions'
    2. Nettoie les mots parasites
    3. Vérifie RGPD avec IA
    4. Sauvegarde dans 'cleaned_transcriptions'
    """
    try:
        # Étape 1 : Récupérer les transcriptions brutes non traitées
        response = supabase.table('transcriptions').select('*').eq('is_processed', False).execute()
        transcriptions = response.data
        
        if not transcriptions:
            return {
                "status": "success",
                "message": "Aucune transcription à traiter",
                "processed": 0
            }
        
        processed_count = 0
        errors = []
        
        for transcription in transcriptions:
            try:
                raw_id = transcription['id']
                raw_text = transcription.get('raw_text', '')
                
                # Étape 2 & 3 : Pipeline de nettoyage complet
                result = process_transcription_pipeline(raw_text)
                
                # Étape 4 : Sauvegarder dans cleaned_transcriptions
                cleaned_data = {
                    'transcription_id': raw_id,
                    'raw_text': result['original'],
                    'cleaned_text': result['final_cleaned'],
                    'is_rgpd_compliant': result['is_rgpd_compliant'],
                    'violations_detected': result['violations_detected'],
                    'processing_status': 'completed'
                }
                
                supabase.table('cleaned_transcriptions').insert(cleaned_data).execute()
                
                # Marquer comme traité dans la table source
                supabase.table('transcriptions').update({'is_processed': True}).eq('id', raw_id).execute()
                
                processed_count += 1
                
            except Exception as e:
                errors.append(f"Erreur pour transcription {raw_id}: {str(e)}")
        
        return {
            "status": "success" if not errors else "partial",
            "message": f"{processed_count} transcriptions traitées",
            "processed": processed_count,
            "total": len(transcriptions),
            "errors": errors if errors else None
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du traitement : {str(e)}")


@app.get("/api/supabase/cleaned-transcriptions")
async def get_cleaned_transcriptions():
    """
    Récupère toutes les transcriptions nettoyées
    """
    try:
        response = supabase.table('cleaned_transcriptions').select('*').execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/supabase/transcriptions-count")
async def get_transcriptions_count():
    """
    Récupère le nombre de transcriptions brutes vs nettoyées
    """
    try:
        raw_response = supabase.table('transcriptions').select('id').execute()
        cleaned_response = supabase.table('cleaned_transcriptions').select('id').execute()
        
        return {
            "total_raw": len(raw_response.data),
            "total_cleaned": len(cleaned_response.data),
            "pending": len(raw_response.data) - len(cleaned_response.data)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
