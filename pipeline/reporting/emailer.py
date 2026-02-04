import logging
from typing import Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def format_email_body(data: Dict[str, Any]) -> str:
    """
    Formats the email body according to the specified template.
    """
    
    # Extracting data safely with defaults to avoid KeyErrors
    note_id = data.get("note_id", "N/A")
    client_name = data.get("client_name", "Unknown Client")
    
    product = data.get("product_interest", {})
    context = data.get("purchase_context", {})
    sentiment = data.get("sentiment_analysis", {})
    profile = data.get("profile_lifestyle", {})
    actions = data.get("recommended_actions", {})

    subject = f"Objet : [Synthèse IA] 🎙️ Note #{note_id} - Client : {client_name}"
    
    body = f"""
{subject}

Synthèse de l'interaction :

👜 1. INTÉRÊT PRODUIT

Catégorie : {product.get('category', 'N/A')}

Recherche : {product.get('search', 'N/A')}

Préférences : {product.get('preferences', 'N/A')}

Budget : {product.get('budget', 'N/A')}

🎁 2. CONTEXTE D'ACHAT

Occasion : {context.get('occasion', 'N/A')}

Bénéficiaire : {context.get('beneficiary', 'N/A')}

💬 3. ANALYSE DU RESSENTI

Sentiment Global : {sentiment.get('global', 'N/A')}

Driver d'achat : {sentiment.get('driver', 'N/A')}

Frein / Contrainte : {sentiment.get('brake', 'N/A')}

👤 4. PROFIL & LIFESTYLE

Passions (Mari) : {profile.get('passions', 'N/A')}

Lifestyle : {profile.get('lifestyle', 'N/A')}

Info Mémo : {profile.get('info_memo', 'N/A')}

🚀 5. ACTIONS RECOMMANDÉES

Next Best Action : {actions.get('next_best_action', 'N/A')}

À faire : {actions.get('to_do', 'N/A')}

Urgence : {actions.get('urgency', 'N/A')}
"""
    return body

def send_classification_email(data: Dict[str, Any]):
    """
    Simulates sending an email to the client advisor.
    The data dictionary is expected to be the output of the classification/enrichment step.
    """
    logging.info(f"Preparing email for Note #{data.get('note_id')}...")
    
    email_content = format_email_body(data)
    
    # In a real scenario, this would connect to an SMTP server or API (SendGrid, SES, etc.)
    # Here we simulate the send by printing to console/log
    print("\n" + "="*50)
    print("📨 EMAIL SENT TO CLIENT ADVISOR")
    print("="*50)
    print(email_content)
    print("="*50 + "\n")
    
    logging.info(f"Email successfully sent for Note #{data.get('note_id')}")

