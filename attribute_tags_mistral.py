import os
import csv
import json
import requests
import pandas as pd
from dotenv import load_dotenv
import time

# Load environment variables
load_dotenv()

MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
OPEN_ROUTEUR_API = os.getenv("OPEN_ROUTEUR_API")

if not MISTRAL_API_KEY:
    raise ValueError("MISTRAL_API_KEY not found in .env file")
if not OPEN_ROUTEUR_API:
    raise ValueError("OPEN_ROUTEUR_API not found in .env file")

PROVIDERS = [
    {
        "name": "Mistral Direct",
        "api_key": MISTRAL_API_KEY,
        "url": "https://api.mistral.ai/v1/chat/completions",
        "model": "mistral-small-latest",
        "headers": {
            "Authorization": f"Bearer {MISTRAL_API_KEY}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
    },
    {
        "name": "OpenRouter",
        "api_key": OPEN_ROUTEUR_API,
        "url": "https://openrouter.ai/api/v1/chat/completions",
        "model": "mistralai/mistral-small-3.1-24b-instruct:free",
        "headers": {
            "Authorization": f"Bearer {OPEN_ROUTEUR_API}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://lvmh.com", # Placeholder
            "X-Title": "LVMH Tagging"
        }
    }
]

import random

def load_taxonomy(json_path):
    with open(json_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def get_tags_from_batch(batch_data, taxonomy_summary):
    # batch_data is a list of dicts: [{'id': 'CA_XXX', 'transcription': '...'}]
    
    transcripts_formatted = ""
    for item in batch_data:
        transcripts_formatted += f"ID: {item['id']}\nTRANSCRIPT: {item['transcription']}\n\n"

    system_prompt = f"""
    You are an expert CRM assistant for LVMH. Your task is to analyze multiple customer transcripts and attribute tags based on the provided Taxonomy.
    
    The Taxonomy is structured as a hierarchy (Category -> Sub-Category -> Sub-Sub-Category...).
    The Top-Level Categories correspond to the 4 Pillars of analysis.
    
    You will receive a list of transcripts. For EACH transcript, return a JSON object keyed by its ID (e.g., "CA_001").
    Inside each ID key, provide the 4 pillar keys:
    
    "tags_pilier_1_interet_produit": list of strings (From "Pilier 1 : L'Intérêt Produit")
    "tags_pilier_2_contexte_achat": list of strings (From "Pilier 2 : Le Contexte d'Achat")
    "tags_pilier_3_feedback_freins": list of strings (From "Pilier 3 : Le Feedback & Les Freins")
    "tags_pilier_4_profil_client": list of strings (From "Pilier 4 : Le Profil Client & Lifestyle")
    
    For each category, select the most specific tags found at the deepest level of the taxonomy.
    Only use tags explicitly listed in the taxonomy.
    
    Taxonomy Structure (JSON):
    {json.dumps(taxonomy_summary, ensure_ascii=False)}
    """
    
    user_prompt = f"Here are the transcripts to process:\n\n{transcripts_formatted}\n\nReturn the JSON object processing all IDs."
    # Try providers with simple randomization for load balancing
    # If one fails, try the other.
    
    provider_indices = [0, 1]
    random.shuffle(provider_indices) # Randomize order for this batch
    
    for provider_idx in provider_indices:
        provider = PROVIDERS[provider_idx]
        
        data = {
            "model": provider["model"],
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.1
        }
        
        # OpenRouter specific handling might require response_format adjustments or model-specific params,
        # but standardized chat completion usually works. 
        # Mistral API supports response_format: {"type": "json_object"}
        # OpenRouter support varies by model, but Mistral models usually support it.
        # We will keep it for both as it's cleaner.
        data["response_format"] = {"type": "json_object"}

        max_retries = 3
        for attempt in range(max_retries):
            try:
                # print(f"DEBUG: Using provider {provider['name']} (Attempt {attempt+1})")
                response = requests.post(provider["url"], headers=provider["headers"], json=data)
                
                # Special handling for OpenRouter rate limits or errors if needed
                if response.status_code == 429:
                    raise Exception("Rate Limit Exceeded")
                
                response.raise_for_status()
                result = response.json()
                
                if 'choices' not in result:
                     raise Exception(f"Invalid response format: {result}")

                content = result['choices'][0]['message']['content']
                return json.loads(content)
            
            except Exception as e:
                print(f"Error with provider {provider['name']} (Attempt {attempt+1}/{max_retries}): {e}")
                
                # If rate limit, maybe wait simpler or just failover faster?
                # For now, let's keep the wait but make it clear.
                if "Rate Limit" in str(e) and attempt == max_retries - 1:
                     # If it's the last attempt and it's a rate limit, don't sleep extra, just failover
                     pass
                elif attempt < max_retries - 1:
                     time.sleep(2 + 2 ** attempt)
                else:
                    print(f"Provider {provider['name']} exhausted retries. Switching provider if available...")
    
    print("All providers failed for this batch.")
    return {} # Return empty dict on total failure

def main():
    import argparse
    parser = argparse.ArgumentParser(description="Attribute tags to customer transcripts using Mistral API.")
    parser.add_argument("input_csv", nargs='?', default="LVMH_Realistic_Merged_CA001-100.csv", help="Path to the input CSV file.")
    parser.add_argument("--output_csv", help="Path to the output CSV file. Defaults to [input_name]_tagged.csv")
    parser.add_argument("--taxonomy", default="Taxonomie_v3_structured.json", help="Path to the taxonomy JSON file.")
    parser.add_argument("--id_col", default="ID", help="Name of the unique ID column.")
    parser.add_argument("--text_col", default="Transcription", help="Name of the transcript column.")
    
    args = parser.parse_args()
    
    start_time = time.time()
    input_csv = args.input_csv
    taxonomy_file = args.taxonomy
    
    if args.output_csv:
        output_csv = args.output_csv
    else:
        # Generate timestamped filename: input_tagged_YYYYMMDD_HHMMSS.csv
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base, ext = os.path.splitext(input_csv)
        output_csv = f"{base}_tagged_{timestamp}{ext}"

    print(f"Input File: {input_csv}")
    print(f"Output File: {output_csv}")
    print(f"Taxonomy: {taxonomy_file}")
    
    if not os.path.exists(input_csv):
        print(f"Error: Input file '{input_csv}' not found.")
        return

    print("Loading taxonomy...")
    try:
        taxonomy = load_taxonomy(taxonomy_file)
    except FileNotFoundError:
        print(f"Error: Taxonomy file '{taxonomy_file}' not found.")
        return
    
    print("Loading CSV...")
    try:
        df = pd.read_csv(input_csv)
    except Exception as e:
        print(f"Error loading CSV: {e}")
        return
        
    # Validation
    if args.id_col not in df.columns:
        print(f"Error: ID column '{args.id_col}' not found in CSV. Available columns: {list(df.columns)}")
        return
    if args.text_col not in df.columns:
        print(f"Error: Text column '{args.text_col}' not found in CSV. Available columns: {list(df.columns)}")
        return
    
    # Initialize new columns
    df['tags_pilier_1_interet_produit'] = None
    df['tags_pilier_2_contexte_achat'] = None
    df['tags_pilier_3_feedback_freins'] = None
    df['tags_pilier_4_profil_client'] = None
    
    # Prepare data for batching
    all_data = []
    for index, row in df.iterrows():
        all_data.append({'id': row[args.id_col], 'transcription': row[args.text_col]})
    
    BATCH_SIZE = 20
    batches = [all_data[i:i + BATCH_SIZE] for i in range(0, len(all_data), BATCH_SIZE)]
    
    print(f"Processing {len(df)} rows in {len(batches)} batches of {BATCH_SIZE}...")
    
    import concurrent.futures
    
    final_results = {}
    
    def process_batch_wrapper(batch):
        print("Starting a batch...")
        return get_tags_from_batch(batch, taxonomy)

    # REBUILDS max_workers TO 2 to avoid aggressive rate limiting
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        futures = {executor.submit(process_batch_wrapper, batch): batch for batch in batches}
        
        for future in concurrent.futures.as_completed(futures):
            try:
                batch_results = future.result()
                if batch_results:
                    final_results.update(batch_results)
                    print(f"Batch processed successfully. Total results so far: {len(final_results)}")
                else:
                    print("Batch finished with NO results (all providers failed).")
            except Exception as e:
                print(f"Batch failed completely with exception: {e}")

    # Assign results back to DF
    print("Assigning tags to dataframe...")
    for index, row in df.iterrows():
        row_id = row[args.id_col]
        if str(row_id) in final_results: # Convert to str for consistent lookup
            tags = final_results[str(row_id)]
        elif row_id in final_results: # Try original type
            tags = final_results[row_id]
        else:
             # Try finding by string conversion if IDs are ints
             tags = None
             for k in final_results.keys():
                 if str(k) == str(row_id):
                     tags = final_results[k]
                     break
        
        if tags:
            df.at[index, 'tags_pilier_1_interet_produit'] = str(tags.get('tags_pilier_1_interet_produit', []))
            df.at[index, 'tags_pilier_2_contexte_achat'] = str(tags.get('tags_pilier_2_contexte_achat', []))
            df.at[index, 'tags_pilier_3_feedback_freins'] = str(tags.get('tags_pilier_3_feedback_freins', []))
            df.at[index, 'tags_pilier_4_profil_client'] = str(tags.get('tags_pilier_4_profil_client', []))
        else:
            print(f"Warning: No tags found for ID {row_id}")

    try:
        df.to_csv(output_csv, index=False)
        end_time = time.time()
        print(f"Completed in {end_time - start_time:.2f} seconds! File saved to {output_csv}")
    except Exception as e:
        print(f"Error saving file: {e}")

if __name__ == "__main__":
    main()
