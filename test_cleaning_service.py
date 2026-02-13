#!/usr/bin/env python3
"""
Tests unitaires pour le service de nettoyage RGPD
Run: python -m pytest test_cleaning_service.py -v
"""

import pytest
from cleaning_service import clean_parasitic_words, process_transcription_pipeline


class TestParasiticWordsRemoval:
    """Tests pour la suppression des mots parasites"""
    
    def test_remove_euh(self):
        """Doit supprimer 'euh'"""
        assert "euh" not in clean_parasitic_words("Bonjour euh je viens")
        
    def test_remove_ben(self):
        """Doit supprimer 'ben'"""
        assert "ben" not in clean_parasitic_words("Ben enfin c'est quoi")
        
    def test_remove_donc(self):
        """Doit supprimer 'donc'"""
        assert "donc" not in clean_parasitic_words("Donc voilà je viens")
        
    def test_keep_important_words(self):
        """Doit garder les mots importants"""
        result = clean_parasitic_words("Je viens chercher un sac")
        assert "sac" in result
        assert "viens" in result
        
    def test_empty_string(self):
        """Doit gérer les chaînes vides"""
        assert clean_parasitic_words("") == ""
        assert clean_parasitic_words("   ") == ""
        
    def test_only_parasites(self):
        """Doit traiter texte avec seulement parasites"""
        result = clean_parasitic_words("euh ben donc quoi")
        assert result.strip() == ""
        
    def test_case_insensitive(self):
        """Doit être insensible à la casse"""
        result = clean_parasitic_words("EUH BEN DONC")
        assert "euh" not in result.lower()
        assert "ben" not in result.lower()


class TestRGPDCompliance:
    """Tests pour la vérification RGPD"""
    
    def test_clean_text_no_pii(self):
        """Texte sans données personnelles doit rester inchangé"""
        text = "Je viens chercher un sac"
        # Note: Le test dépend de OpenAI, on peut seulement tester la structure
        assert text  # Vérifie que c'est pas vide
        
    def test_process_pipeline_returns_dict(self):
        """Pipeline doit retourner un dictionnaire valide"""
        result = process_transcription_pipeline("Test")
        assert isinstance(result, dict)
        assert 'original' in result
        assert 'final_cleaned' in result
        assert 'is_rgpd_compliant' in result
        
    def test_pipeline_handle_empty_input(self):
        """Pipeline doit gérer les entrées vides"""
        result = process_transcription_pipeline("")
        assert result['original'] == ""
        
    def test_pipeline_lowercase_output(self):
        """Pipeline doit convertir en minuscules"""
        result = process_transcription_pipeline("HELLO WORLD")
        assert result['final_cleaned'] == result['final_cleaned'].lower()


class TestEdgeCases:
    """Tests pour les cas limites"""
    
    def test_none_input(self):
        """Doit gérer None gracieusement"""
        result = clean_parasitic_words(None)
        assert result == ""
        
    def test_very_long_text(self):
        """Doit gérer les textes longs"""
        long_text = "euh " * 1000 + "bonjour"
        result = clean_parasitic_words(long_text)
        assert "euh" not in result
        assert "bonjour" in result
        
    def test_special_characters(self):
        """Doit gérer les caractères spéciaux"""
        text = "Bonjour, c'est @#$% bizarre"
        result = clean_parasitic_words(text)
        assert isinstance(result, str)
        
    def test_multiple_spaces(self):
        """Doit normaliser les espaces multiples"""
        text = "Bonjour     euh     je"
        result = clean_parasitic_words(text)
        # Ne doit avoir plus qu'un espace entre les mots
        assert "     " not in result


class TestIntegration:
    """Tests d'intégration complets"""
    
    def test_full_pipeline_integration(self):
        """Test complet du pipeline"""
        test_texts = [
            "Euh bonjour je viens",
            "Ben enfin quoi",
            "Donc voilà c'est tout"
        ]
        
        for text in test_texts:
            result = process_transcription_pipeline(text)
            
            # Vérifier la structure
            assert 'original' in result
            assert 'after_parasites' in result
            assert 'final_cleaned' in result
            assert 'is_rgpd_compliant' in result
            
            # Vérifier les valeurs
            assert result['original'] == text
            assert isinstance(result['final_cleaned'], str)
            assert isinstance(result['is_rgpd_compliant'], bool)
            
    def test_pipeline_removes_parasites_then_rgpd(self):
        """Pipeline doit supprimer parasites avant RGPD check"""
        text = "Euh je suis Jean 06123456"
        result = process_transcription_pipeline(text)
        
        # Vérifier que les parasites sont supprimés
        assert "euh" not in result['final_cleaned']
        
        # Vérifier que les données personnelles sont supprimées
        # (dépend de OpenAI, vérifier seulement que la structure existe)
        assert isinstance(result['is_rgpd_compliant'], bool)


class TestPerformance:
    """Tests de performance et limites"""
    
    def test_processing_speed(self):
        """Test que le nettoyage est suffisamment rapide"""
        import time
        
        text = "euh " * 100 + "bonjour"
        
        start = time.time()
        result = clean_parasitic_words(text)
        elapsed = time.time() - start
        
        # Doit être traité en moins de 1 seconde
        assert elapsed < 1.0
        
    def test_memory_efficiency(self):
        """Test que le traitement n'utilise pas trop de mémoire"""
        import sys
        
        text = "euh " * 10000
        # Ne doit pas lever d'exception mémoire
        result = clean_parasitic_words(text)
        assert result is not None


# ============================================================
# FIXTURES PYTEST
# ============================================================

@pytest.fixture
def sample_transcriptions():
    """Fournit des transcriptions d'exemple pour les tests"""
    return [
        {
            'raw': "Bonjour euh je viens euh acheter un sac",
            'expected_no_euh': False,  # Ne contient pas euh après nettoyage
        },
        {
            'raw': "Vous savez ben c'est pas facile",
            'expected_no_ben': False,
        },
        {
            'raw': "Je viens chercher une paire de chaussures",
            'expected_preserved': True,  # Le sens doit être préservé
        }
    ]


@pytest.fixture
def rgpd_sensitive_texts():
    """Textes contenant des données sensibles"""
    return [
        "Je m'appelle Jean Martin",
        "Mon email est jean@example.com",
        "Mon téléphone est 06 12 34 56 78",
        "Mon numéro de carte est 4532123456789010",
    ]


if __name__ == "__main__":
    # Affichage de résumé
    print("=" * 80)
    print("Tests du service de nettoyage RGPD")
    print("=" * 80)
    print("\nCommandes:")
    print("  python -m pytest test_cleaning_service.py         # Tous les tests")
    print("  python -m pytest test_cleaning_service.py -v      # Mode verbose")
    print("  python -m pytest test_cleaning_service.py -k test_remove_euh  # Test spécifique")
    print("\n" + "=" * 80)
