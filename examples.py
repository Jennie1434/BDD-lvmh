#!/usr/bin/env python3
"""
Exemples d'utilisation du service de nettoyage RGPD
Run: python examples.py
"""

from cleaning_service import (
    clean_parasitic_words,
    check_rgpd_compliance,
    process_transcription_pipeline
)

print("=" * 80)
print("EXEMPLES D'UTILISATION - Service Nettoyage RGPD")
print("=" * 80)

# ============================================================
# EXEMPLE 1 : Suppression des mots parasites
# ============================================================
print("\n📝 EXEMPLE 1 : Suppression des mots parasites")
print("-" * 80)

text1 = "Bonjour, euh, je viens pour acheter un sac, vous savez, ben, c'est pour ma mère"

print(f"❌ AVANT: {text1}")
cleaned = clean_parasitic_words(text1)
print(f"✅ APRÈS: {cleaned}")

# ============================================================
# EXEMPLE 2 : Vérification RGPD
# ============================================================
print("\n\n🔒 EXEMPLE 2 : Vérification RGPD")
print("-" * 80)

text2 = "Je suis Marie Dupont, mon email est marie.dupont@gmail.com, mon téléphone 06 12 34 56 78"

print(f"❌ AVANT: {text2}")
print("\nVérification RGPD en cours...")
result = check_rgpd_compliance(text2)
print(f"\n✅ APRÈS: {result['cleaned']}")
print(f"📋 Violations détectées: {result.get('violations', [])}")
print(f"🔐 Compliant RGPD: {'OUI ✓' if result['is_compliant'] else 'NON ✗'}")

# ============================================================
# EXEMPLE 3 : Pipeline complet
# ============================================================
print("\n\n⚡ EXEMPLE 3 : Pipeline complet (parasites + RGPD)")
print("-" * 80)

text3 = """
Bonjour, euh, donc voilà, je suis Jean Martin, je viens de la part de Sophie qui travaille chez nous.
Mon numéro c'est 06 98 76 54 32 et j'aimerais acheter un sac.
Vous savez, ben, mon code IBAN c'est FR1420041010050500013M02606
"""

print(f"❌ TEXTE BRUT:\n{text3}")

print("\n⏳ Traitement en cours (parasites + RGPD)...\n")
final_result = process_transcription_pipeline(text3.strip())

print(f"📊 RÉSULTATS DU PIPELINE:")
print(f"\n1️⃣  Original (brut):\n{final_result['original'][:100]}...\n")
print(f"2️⃣  Après suppression parasites:\n{final_result['after_parasites'][:100]}...\n")
print(f"3️⃣  Final (parasites + RGPD):\n{final_result['final_cleaned']}\n")
print(f"🔐 Conforme RGPD: {'OUI ✓' if final_result['is_rgpd_compliant'] else 'NON ✗'}")
print(f"⚠️  Violations trouvées: {final_result['violations_detected']}")

# ============================================================
# EXEMPLE 4 : Batch processing (simulation)
# ============================================================
print("\n\n📦 EXEMPLE 4 : Batch processing (simulation)")
print("-" * 80)

transcriptions = [
    "Euh, je viens pour un sac",
    "Donc voilà, je suis Marie, 06 12 34 56",
    "Ben, il me faut des chaussures, quoi"
]

print(f"📥 {len(transcriptions)} transcriptions à traiter:\n")

for i, trans in enumerate(transcriptions, 1):
    print(f"{i}. '{trans}'")

print("\n⏳ Traitement en cours...\n")

for i, trans in enumerate(transcriptions, 1):
    result = process_transcription_pipeline(trans)
    print(f"{i}. ✅ Cleaned: '{result['final_cleaned']}'")

# ============================================================
# EXEMPLE 5 : Cas limites
# ============================================================
print("\n\n🎯 EXEMPLE 5 : Cas limites")
print("-" * 80)

edge_cases = [
    ("", "Texte vide"),
    ("   ", "Seulement des espaces"),
    ("abc123def", "Pas de parasites"),
    ("euh euh euh ben ben donc", "Que des parasites"),
]

for text, description in edge_cases:
    result = clean_parasitic_words(text)
    print(f"\n{description}:")
    print(f"  Entrée: '{text}'")
    print(f"  Sortie: '{result}'")
    print(f"  ✓ Traité sans erreur")

# ============================================================
# RÉSUMÉ FINAL
# ============================================================
print("\n" + "=" * 80)
print("✅ RÉSUMÉ - Service Nettoyage RGPD")
print("=" * 80)
print("""
Fonctionnalités disponibles :

1. ✅ Suppression des mots parasites
   - euh, ben, donc, voilà, quoi
   - pour ainsi dire, si tu veux, tu sais
   - 50+ expressions détectées

2. ✅ Vérification RGPD (OpenAI)
   - Détection: noms, emails, téléphones
   - Détection: numéros de carte/IBAN
   - Détection: dates de naissance
   - Suppression automatique

3. ✅ Pipeline complet
   - Traitement automatique en 2 étapes
   - Gestion des erreurs
   - Retour détaillé des violations

4. ✅ Intégration Supabase
   - Sauvegarde automatique
   - Tracking des violations
   - Statistiques en temps réel

🚀 Prêt à nettoyer des transcriptions!
""")

print("=" * 80)
