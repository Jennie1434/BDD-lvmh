import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
API_URL = "https://api.mistral.ai/v1/chat/completions"
MODEL = "mistral-large-latest"

def load_taxonomy(json_path):
    with open(json_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def diagnose():
    taxonomy = load_taxonomy("Taxonomie_v3_structured.json")
    transcription_sample = "Rendez-vous Mme Laurent, avocate affaires 45 ans..."

    system_prompt = f"""
    Taxonomy Structure (JSON):
    {json.dumps(taxonomy, ensure_ascii=False)}
    """
    
    user_prompt = f"Transcription: {transcription_sample}\n\nReturn the JSON object."

    data = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.1
    }

    headers = {
        "Authorization": f"Bearer {MISTRAL_API_KEY}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }

    print("Sending request...")
    try:
        response = requests.post(API_URL, headers=headers, json=data)
        print(f"Status Code: {response.status_code}")
        print(f"Headers: {response.headers}")
        if response.status_code != 200:
            print(f"Error Response: {response.text}")
        else:
            print("Success!")
            print(response.json()['choices'][0]['message']['content'][:200] + "...")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    diagnose()
