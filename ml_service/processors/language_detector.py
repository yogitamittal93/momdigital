"""
Language detection for MomDigital Matrny assistant.

Supports 6 Indian languages in addition to English:
  hi  — Hindi
  pa  — Punjabi
  bn  — Bengali
  mr  — Marathi
  te  — Telugu
  ta  — Tamil

Detection uses the `langdetect` library (probabilistic, trained on Wikipedia).
Falls back to English silently if:
  - Input is too short (< 8 characters)
  - langdetect confidence is below CONFIDENCE_THRESHOLD (0.80)
  - An exception occurs (e.g. model not loaded)
  - The detected language is not in SUPPORTED_LANGUAGES

Design principles:
  - Never throws. A detection failure is always a no-op fallback to English.
  - Does not change ChromaDB retrieval — only affects the Groq response language.
"""

import logging

logger = logging.getLogger(__name__)

SUPPORTED_LANGUAGES = {
    "hi": "Hindi",
    "pa": "Punjabi",
    "bn": "Bengali",
    "mr": "Marathi",
    "te": "Telugu",
    "ta": "Tamil",
}

# Minimum character length before we even attempt detection.
# Avoids false positives on very short greetings like "hi", "ok", "namaste".
MIN_CHARS_FOR_DETECTION = 8

# Minimum langdetect probability to trust the result.
CONFIDENCE_THRESHOLD = 0.80


def detect_language(text: str) -> dict:
    """
    Detect the language of `text`.

    Returns:
        {
            "lang_code": str,       # e.g. "hi", "en"
            "lang_name": str,       # e.g. "Hindi", "English"
            "is_supported_non_english": bool,
            "confidence": float,    # 0.0–1.0
        }
    """
    default = {
        "lang_code": "en",
        "lang_name": "English",
        "is_supported_non_english": False,
        "confidence": 1.0,
    }

    if not text or len(text.strip()) < MIN_CHARS_FOR_DETECTION:
        return default

    try:
        from langdetect import detect_langs  # type: ignore
        results = detect_langs(text.strip())
        if not results:
            return default

        top = results[0]
        lang_code = top.lang
        confidence = round(top.prob, 3)

        if confidence < CONFIDENCE_THRESHOLD:
            logger.debug(
                "Language detection confidence too low: %s (%.2f) — falling back to English",
                lang_code, confidence,
            )
            return default

        if lang_code not in SUPPORTED_LANGUAGES:
            return {**default, "lang_code": lang_code, "confidence": confidence}

        lang_name = SUPPORTED_LANGUAGES[lang_code]
        logger.info(
            "Detected language: %s (%s), confidence=%.2f",
            lang_name, lang_code, confidence,
        )
        return {
            "lang_code": lang_code,
            "lang_name": lang_name,
            "is_supported_non_english": True,
            "confidence": confidence,
        }

    except Exception as exc:
        logger.warning("Language detection failed: %s — falling back to English", exc)
        return default


def build_language_instruction(lang_code: str, lang_name: str) -> str:
    """
    Build the system-prompt suffix to instruct Groq to respond in the
    detected language. Only called when is_supported_non_english is True.
    """
    return (
        f"\n\nIMPORTANT — LANGUAGE INSTRUCTION: The user has written in {lang_name}. "
        f"You MUST respond ENTIRELY in {lang_name} (language code: {lang_code}). "
        f"Do NOT switch to English at any point in your response. "
        f"Maintain the same warm, personal Matrny tone in {lang_name}. "
        f"All section headers (🏥 What the research says, 🌿 Your dadi knew this, "
        f"💡 Try this tomorrow morning, 📚 Sources) should also appear in {lang_name}."
    )
