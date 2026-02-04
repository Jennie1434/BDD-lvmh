from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import gspread
from google.oauth2.service_account import Credentials
import pandas as pd
import os
import subprocess
import sys
from dotenv import load_dotenv

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
