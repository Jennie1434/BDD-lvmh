from pipeline.reporting.emailer import send_classification_email

def run_pipeline():
    """
    Simulates the full automated pipeline:
    1. Ingestion (Skipped)
    2. Classification (Mocked)
    3. Reporting/Emailing (Implemented)
    """
    print("🚀 Starting Automated Pipeline...")
    
    # --- Step 1 & 2: Mocking the Output of the Classification/Enrichment Step ---
    # This data represents what the NLP/Classification model would have extracted from the raw note.
    classified_data = {
        "note_id": "CA_001",
        "client_name": "Mme Laurent (Avocate)",
        "product_interest": {
            "category": "Maroquinerie",
            "search": "Hésitation entre Portefeuille et Petit sac weekend",
            "preferences": "Cuir marron ou cognac (⛔ Pas de noir)",
            "budget": "3-4K€ (Flexible si coup de cœur)"
        },
        "purchase_context": {
            "occasion": "Anniversaire (50 ans) - Fin mars",
            "beneficiary": "Mari"
        },
        "sentiment_analysis": {
            "global": "🟢 Positif (Bon potentiel)",
            "driver": "Qualité / Finitions",
            "brake": "Intolérance produits chimiques forts (attention au tannage)"
        },
        "profile_lifestyle": {
            "passions": "Golf (Membre Racing Club Paris), Montres Vintage",
            "lifestyle": "Voyages fréquents (Provence, Côte Basque)",
            "info_memo": "Avocate d'affaires, 45 ans."
        },
        "recommended_actions": {
            "next_best_action": 'Préparer sélection "Collection Capsule Printemps" pour RDV semaine prochaine.',
            "to_do": "Attendre les photos du mari pour affiner le style.",
            "urgency": "⚡ Moyenne (Achat pour fin mars)"
        }
    }
    
    # --- Step 3: Reporting ---
    send_classification_email(classified_data)
    
    print("✅ Pipeline execution finished.")

if __name__ == "__main__":
    run_pipeline()
