import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from processors.response_generator import (
    check_emergency,
    detect_potential_hallucination,
    classify_confidence_tier,
    get_safe_fallback,
)


class TestEmergencyDetection:
    def test_detects_breathing_emergency(self):
        assert check_emergency("my baby is not breathing") is True

    def test_detects_heavy_bleeding(self):
        assert check_emergency("I have heavy bleeding that won't stop") is True

    def test_normal_question_not_emergency(self):
        assert check_emergency("what foods should I eat in third trimester") is False

    def test_breastfeeding_not_emergency(self):
        assert check_emergency("my baby is not latching properly") is False


class TestConfidenceTier:
    def test_food_question_auto_safe(self):
        tier = classify_confidence_tier("what recipe should I make", 0.8, "nutrition")
        assert tier == "auto_safe"

    def test_dosage_requires_doctor(self):
        tier = classify_confidence_tier(
            "what dosage of iron should I take", 0.9, "maternal"
        )
        assert tier == "requires_doctor"

    def test_drug_question_requires_doctor(self):
        tier = classify_confidence_tier(
            "can I take paracetamol tablet while pregnant", 0.7, "maternal"
        )
        assert tier == "requires_doctor"


class TestHallucinationDetection:
    def test_detects_fabricated_statistic(self):
        answer = "According to studies show, 87% of women benefit from this."
        chunks = ["Some general information about women's health"]
        result = detect_potential_hallucination(answer, chunks)
        assert result["flag_count"] > 0

    def test_detects_specific_dosage_not_in_context(self):
        answer = "Take 500mg of this supplement twice daily."
        chunks = ["Iron is important for pregnant women"]
        result = detect_potential_hallucination(answer, chunks)
        assert result["flag_count"] > 0

    def test_clean_answer_passes(self):
        answer = (
            "Iron-rich foods include spinach, lentils, and dates "
            "according to NIN guidelines."
        )
        chunks = [
            "Iron-rich foods include spinach lentils dates according to NIN guidelines"
        ]
        result = detect_potential_hallucination(answer, chunks)
        assert result["is_safe"] is True


class TestSafeFallback:
    def test_fallback_has_confidence(self):
        result = get_safe_fallback("test question", "no_chunks_found")
        assert result["confidence"] == "safety_fallback"
        assert len(result["answer"]) > 20
