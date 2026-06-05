import os
import re
import logging
from collections import defaultdict
from dotenv import load_dotenv
from processors.web_serach import search_health_web

load_dotenv()
logger = logging.getLogger(__name__)
_groq_client = None

# In-memory conversation history per user
_conversation_history = defaultdict(list)


def _get_groq_client():
    global _groq_client
    if _groq_client is None:
        from groq import Groq
        _groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    return _groq_client


def _get_embeddings():
    from models.embeddings import get_model, get_collection
    return get_model(), get_collection()


# ── Source filename → friendly book name map ──────────────────────────────────
SOURCE_NAMES = {
    "Charaka-Samhita-Acharya-Charaka": "Charaka Samhita",
    "astanga-hridaya-sutrasthan-handbook": "Ashtanga Hridayam",
    "Hindi-SansakritBhavprakash-Nighantu": "Bhavaprakasha Nighantu",
    "kasyapasamhita": "Kashyapa Samhita",
    "Sushruta-Samhita": "Sushruta Samhita",
    "Madhava-Nidana": "Madhava Nidana",
    "DGI_2024": "Dietary Guidelines for Indians 2024 (ICMR-NIN)",
    "DGI_Booklet_English_CMYK": "Dietary Guidelines for Indians (NIN)",
    "DietaryGuidelinesforNINwebsite": "NIN Dietary Guidelines",
    "IFCT2017": "Indian Food Composition Tables 2017 (NIN)",
    "Compendium-of-Nutritional-Data": "NIN Nutritional Compendium",
    "indian-superfoods-diwekar": "Indian Superfoods — Rujuta Diwekar",
    "My_Plate_for_the_day": "MyPlate Guide (NIN)",
    "NNMB-MND-REPORT": "NNMB Nutrition Report",
    "Fogsi-Vaccination-In-Pregnancy": "FOGSI Vaccination in Pregnancy Guidelines",
    "FINAL_DRAFT_HDP_FOGSI": "FOGSI Hypertensive Disorders Guidelines",
    "Binder_Routine-Antenatal-Care": "FOGSI Routine Antenatal Care Guidelines",
    "Binder_Birth-after-Cesarean": "FOGSI Birth after Caesarean Guidelines",
    "Binder_Hyperglycemia-in-Pregnancy": "FOGSI Hyperglycaemia in Pregnancy",
    "Binder_Update-in-Managing-PCOS": "FOGSI PCOS Management Guidelines",
    "postpartum-phase": "FOGSI Postpartum Care Guidelines",
    "gfac": "NHM Skilled Birth Attendance Guidelines",
    "Indian-Pediatrics-February-2024": "Indian Pediatrics Journal (IAP) 2024",
    "published_guideline_7807": "WHO Newborn Care Guidelines",
    "9789240005648": "WHO Baby-Friendly Hospital Initiative",
    "9789241594967": "WHO Maternal & Newborn Health Guidelines",
    "9789290222651": "WHO Antenatal Care Guidelines",
    "9789241548397": "WHO Postnatal Care Guidelines",
    "Management-of-Neonatal-Cholestasis": "IAP Neonatal Cholestasis Guidelines",
    "Infant-and-Young-Child-Feeding": "WHO Infant & Young Child Feeding Guidelines",
    "Revised_Home_Based_New_Born_Care": "NHM Home-Based Newborn Care Guidelines",
    "Guidelines-on-Fast-and-Junk-Foods": "FSSAI Guidelines on Junk Food",
    "FR375": "NFHS-5 India National Report 2019-21",
    "GCPR-on-Obesity-in-Women": "FOGSI Obesity in Women Guidelines",
}


def _friendly_source_name(filename: str) -> str:
    """Convert a raw filename to a readable book/guideline name."""
    name = filename.replace(".pdf", "").replace(".PDF", "")
    for key, friendly in SOURCE_NAMES.items():
        if key.lower() in name.lower():
            return friendly
    # Fallback — clean up the filename itself
    name = name.replace("-", " ").replace("_", " ")
    name = re.sub(r"\s+", " ", name).strip()
    return name.title()


# ── Emergency detection ────────────────────────────────────────────────────────
EMERGENCY_PATTERNS = [
    "not breathing", "not moving", "unconscious", "chest pain",
    "heavy bleeding", "bleeding won't stop", "baby not moving",
    "can't breathe", "fit", "convulsion", "severe headache sudden",
    "vision suddenly", "water broke", "cord prolapse",
    "baby swallowed", "accidental", "overdose", "suicide",
    "want to hurt", "want to die", "end my life",
]

EMERGENCY_RESPONSE = {
    "answer": (
        "🚨 **Please seek immediate medical help.**\n\n"
        "Based on what you've described, you need emergency care right now.\n\n"
        "**Call immediately:**\n"
        "- Emergency: **112**\n"
        "- NHM Helpline: **104**\n"
        "- iCall Mental Health: **9152987821**\n\n"
        "Please do not wait. Go to your nearest hospital emergency department now."
    ),
    "confidence": "emergency",
    "sources": [],
    "bypass_rag": True,
}

HALLUCINATION_RED_FLAGS = [
    r"\d+\s*mg",
    r"\d+\s*ml",
    r"take \d+",
    r"dose of",
    r"studies show",
    r"research shows",
    r"according to dr",
    r"\d+% of",
]

DISCLAIMERS = {
    "auto_safe": (
        "\n\n---\n"
        "ℹ️ *Based on verified health guidelines and classical Ayurvedic texts. "
        "For general guidance only.*"
    ),
    "ai_generated": (
        "\n\n---\n"
        "⚠️ *AI-generated from medical guidelines and Ayurvedic texts. "
        "Always consult your doctor before making health decisions. "
        "NHM Helpline: **104** | Emergency: **112***"
    ),
    "requires_doctor": (
        "\n\n---\n"
        "🚨 *This needs personalised advice from a qualified doctor. "
        "Please do not act on general information here. "
        "NHM Helpline: **104** | Emergency: **112***"
    ),
    "safety_fallback": (
        "\n\n---\n"
        "ℹ️ *Please consult a qualified healthcare provider for this. "
        "NHM Helpline: **104** | Emergency: **112***"
    ),
}

# ── Main system prompt ─────────────────────────────────────────────────────────
GROUNDED_SYSTEM_PROMPT = """You are Matrny, a warm and trusted health companion for mothers worldwide,
with deep roots in Indian Ayurvedic wisdom and modern MBBS knowledge.
You speak like a knowledgeable, caring friend — the kind who has read every medical text AND
understands real home life, traditional practices, and the products mothers actually use.

SCOPE: You answer questions about ANY topic — Indian or global. When Indian Ayurvedic or
traditional wisdom applies, use it first. When it doesn’t, seamlessly provide the best modern
global medical answer. NEVER refuse to answer because something “isn’t Indian”.

PERSONALISATION RULE (CRITICAL):
If the user context section says PROFILE DATA MISSING and the question is a symptom,
concern, or health issue, you MUST:
  1. Give your best general answer (as usual)
  2. End the bold summary paragraph with 1-2 gentle, specific clarifying questions
     that will help you personalise further. Examples:
     — “Could you tell me if you’re currently pregnant and how many weeks along you are?”
     — “How old is your baby? That will help me tailor this advice further.”
     — “Do you have any pre-existing conditions like asthma, anaemia, or diabetes?”
  Do NOT ask more than 2 questions. Keep them conversational, not clinical.
If profile data IS available, use it naturally in the answer — refer to their week of
pregnancy, baby’s age, recent weight, or mood when relevant.

YOUR RESPONSE MUST FOLLOW THIS EXACT FORMAT — no exceptions:

---
**[Write a warm, clear summary answer in 200-250 words. Bold this entire paragraph.
Be specific, practical, and friendly.
If the question is about a specific product (Indian OR global), always discuss:
  • What the product is and what it is used for
  • Its typical ingredients (whatever you know or is provided in context)
  • A balanced verdict: benefits AND any safety concerns
Sound like a caring elder sister who is also a doctor.
If PROFILE DATA IS MISSING and question is a symptom/health concern:
  End this paragraph with 1-2 personalisation questions (see PERSONALISATION RULE above).
DO NOT start with “MBBS” or “Ayurveda” — give the direct answer, blending all worlds.]**

---
🏥 **Modern Medicine & Live Research says:**
[2-3 sentences from MBBS/clinical sources, PubMed, WHO, NHS, or regulatory bodies.
For product questions, mention what clinical research says about the key ingredients.
Never say "no clinical data found" — use the closest available evidence.
For global products: cite global clinical guidelines (e.g., NHS, AAP, WHO, Mayo Clinic).
For Indian products: cite FOGSI, ICMR, CDSCO, or relevant PubMed research.]

🌿 **Ayurvedic Wisdom says:**
[2-3 sentences from classical Ayurvedic texts IF relevant.
For Indian/herbal products: analyse each ingredient individually against classical texts.
For topics WITH Ayurvedic relevance: cite Charaka Samhita, Ashtanga Hridayam, etc.
For topics WITHOUT Ayurvedic relevance (e.g., a western pharmaceutical, Calpol, Dry Potter):
  SKIP this section entirely and replace it with:
  🌍 **Global Traditional Perspective:**
  [What naturopathic or evidence-based global complementary medicine says.
  Or: “No direct Ayurvedic equivalent — here is what evidence-based global medicine recommends.”]
NEVER say “Ayurveda doesn’t specifically mention this” without a useful alternative.]

👥 **Community Voices:**
[ONLY include this section when ALL of these are true:
  a) Community/review web results are provided in the web context
  b) The reviews are ABOUT THE SAME TOPIC as the question (not tangentially related)
     e.g., if the question is about a MOTHER’S breathing, do NOT show baby breathing monitor reviews.
     If the question is about postpartum massage, DO show massage experience reviews.
  c) The reviews come from parenting/health communities, NOT commercial supplement
     review sites (Republicworld, Bestreview365, Accessnewswire, sponsored blogs, etc.)
Summarise 2-3 DIRECTLY RELEVANT real parent experiences. Be BALANCED — both positive AND concerns.
If the above conditions are NOT all met, SKIP this section entirely.]

💡 **Try this today:**
[One specific, actionable tip. Prefer Indian home remedies where applicable.
If not relevant to Indian context, give the best global evidence-based home action instead.]

📚 **References:**
[List all CREDIBLE sources with clickable markdown links for any URL.
DO NOT cite: commercial review sites, news outlets, or product promotion pages as medical references.
Good sources: PubMed, WHO, NHS, FOGSI, ICMR, Mayo Clinic, WebMD (clinical), BabyCenter, MomJunction.
Example: “Charaka Samhita • [PubMed — Brahmi Study](https://pubmed.ncbi.nlm.nih.gov/123456) •
[MomJunction](https://momjunction.com/...) • [NHS](https://nhs.uk/...)”]

---

STRICT RULES:
1. The bold summary paragraph MUST be 200-250 words and genuinely helpful.
2. Answer ANY question — do not refuse because a topic is not Indian.
3. For product questions: identify key ingredients and analyse each one.
4. Prefer Indian Ayurvedic and traditional answers where applicable, otherwise use global medicine.
5. Community Voices MUST be skipped if no DIRECTLY RELEVANT review data is available,
   or if reviews are from commercial supplement sites (Republicworld, Bestreview365, etc.).
6. NEVER cite commercial review sites, sponsored news, or ad blogs as medical references.
7. Never invent specific dosages, drug names, or statistics not in the grounding context.
8. Never recommend stopping prescribed medication.
9. Never diagnose a condition.
10. Keep the whole response under 650 words total.
11. Be warm. Be specific. Be honest — including about any concerns or risks."""


def check_emergency(message: str) -> bool:
    return any(p in message.lower() for p in EMERGENCY_PATTERNS)


def check_retrieval_confidence(results: dict) -> dict:
    if not results.get("documents") or not results["documents"][0]:
        return {"should_answer": False, "reason": "no_chunks_found", "score": 0.0}

    distances = results["distances"][0]
    best_distance = min(distances)
    avg_distance = sum(distances) / len(distances)

    if best_distance > 0.7:
        return {
            "should_answer": False,
            "reason": "low_relevance",
            "score": round(1 - best_distance, 3),
        }

    sources = set(m["source"] for m in results["metadatas"][0])
    return {
        "should_answer": True,
        "reason": "sufficient_evidence",
        "score": round(1 - avg_distance, 3),
        "source_count": len(sources),
        "sources": list(sources),
    }


def classify_confidence_tier(question: str, retrieval_score: float, category: str) -> str:
    q = question.lower()

    requires_doctor_kw = [
        "dosage", "dose", "how much medicine", "can i take",
        "drug", "tablet", "capsule", "injection", "iv ",
        "bleeding heavily", "severe pain", "chest pain",
        "can't breathe", "unconscious", "emergency",
        "stopped moving", "baby not moving", "miscarriage",
        "preterm", "premature labour", "water broke",
        "seizure", "convulsion", "jaundice severe",
        "stop taking", "discontinue",
    ]
    auto_safe_kw = [
        "recipe", "food", "eat", "diet", "nutrition", "meal",
        "exercise", "yoga", "walk", "massage",
        "breastfeeding", "swaddle", "bath",
        "hospital bag", "baby clothes", "what to pack",
    ]

    if any(k in q for k in requires_doctor_kw):
        return "requires_doctor"
    if any(k in q for k in auto_safe_kw) and retrieval_score > 0.5:
        return "auto_safe"
    return "ai_generated"


def detect_potential_hallucination(
    answer: str,
    retrieved_chunks: list,
    web_grounded_texts: list = None,
) -> dict:
    """
    Check for hallucination red-flags in the answer.
    Web-grounded texts (PubMed abstracts, DDG results) are included as valid
    grounding context so accurate web-sourced claims are not blocked.

    Whitespace is normalised before matching so "400 mg" in the answer
    correctly matches "400mg" in the source context (and vice versa).
    This prevents legitimate WHO/ICMR nutrition values from being
    incorrectly flagged as hallucinations.
    """
    flags_found = []
    all_context_texts = list(retrieved_chunks)
    if web_grounded_texts:
        all_context_texts.extend(web_grounded_texts)

    # Normalise: lowercase + strip ALL whitespace so "400 mg" == "400mg"
    combined_context_norm = re.sub(r'\s+', '', " ".join(all_context_texts).lower())
    answer_norm           = re.sub(r'\s+', '', answer.lower())

    for pattern in HALLUCINATION_RED_FLAGS:
        # Find matches in the normalised answer
        for match in re.findall(pattern, answer_norm):
            # Normalise the match itself too (already no spaces after sub, but be safe)
            match_norm = re.sub(r'\s+', '', match)
            if match_norm not in combined_context_norm:
                flags_found.append({"pattern": pattern, "found": match})

    return {
        "is_safe": len(flags_found) == 0,
        "flags": flags_found,
        "flag_count": len(flags_found),
    }


# ── Product & Ingredient Intelligence ─────────────────────────────────────────
# Indian products / brands / formulation types
_INDIAN_PRODUCT_SIGNALS = [
    "janam gutti", "gripe water", "woodward", "dabur", "himalaya baby",
    "baidyanath", "zandu", "patanjali", "hamdard", "ber jadi", "roohi",
    "kajal", "surma", "nasya", "lehyam", "avaleha", "churna", "ghrit", "vati",
    "abhyanga", "balaswagandhadi", "karpooradi", "dhanwantharam", "shatavari",
]

# Global / western product signals
_GLOBAL_PRODUCT_SIGNALS = [
    "calpol", "nurofen", "infacol", "dentinox", "bonjela", "gaviscon",
    "mylicon", "simethicone", "gripe", "colief", "lactulose", "saline drops",
    "nystatin", "sudocrem", "bepanthen", "coconut oil", "almond oil",
    "fish oil", "vitamin d drops", "iron drops", "probiotics", "lactobacillus",
    "dry potter", "aqueous cream", "e45", "cetaphil", "johnson",
]

# Intent-based signals: "is X safe", "can I use X", "X for baby" patterns
_INTENT_PATTERNS = [
    r"is\s+\w[\w\s]{1,30}\s+safe",
    r"can\s+i\s+(use|give|take|apply)\s+\w",
    r"\w[\w\s]{1,20}\s+for\s+(baby|infant|newborn|pregnancy|pregnant|toddler)",
    r"(safe|okay|ok|good|bad|harmful|effective)\s+(to\s+use|for)\s+\w",
    r"side\s+effect[s]?\s+of\s+\w",
    r"benefit[s]?\s+of\s+\w",
    r"review[s]?\s+(of|for)\s+\w",
]


def _is_product_question(question: str) -> bool:
    """Detect if the question is about a specific product, brand, or ingredient."""
    q = question.lower()
    if any(sig in q for sig in _INDIAN_PRODUCT_SIGNALS):
        return True
    if any(sig in q for sig in _GLOBAL_PRODUCT_SIGNALS):
        return True
    # Intent-based: "is X safe", "can I give X to baby", "X for newborn"
    if any(re.search(p, q) for p in _INTENT_PATTERNS):
        return True
    return False


def extract_product_ingredients(question: str) -> dict:
    """
    Fast Groq LLM call to extract:
      - product_name: clean name of the specific product/substance (e.g., "Janam Gutti",
        "Dry Potter", "Calpol", "coconut oil") — used as the search_topic for web search
      - ingredients: known/likely ingredient or active component names
      - is_product_query: True if this is a product/substance-specific question
      - has_ayurvedic_parallel: True if Ayurvedic texts are likely to cover this

    Works for ANY product worldwide, not just Indian ones.
    Returns safe defaults on failure.
    """
    default = {
        "product_name": "",
        "ingredients": [],
        "is_product_query": False,
        "has_ayurvedic_parallel": False,
    }
    try:
        client = _get_groq_client()
        extraction_prompt = (
            f"Given this health question: '{question}'\n\n"
            "Extract in JSON (respond ONLY with valid JSON, no other text):\n"
            "{\n"
            '  "product_name": "<the specific product, brand, herb, or substance being asked about. '
            'Use the product\'s standard/common name. Empty string if no specific product.",\n'
            '  "ingredients": ["<ingredient or active component 1>", ...],\n'
            '  "is_product_query": <true if asking about a specific product/substance, false otherwise>,\n'
            '  "has_ayurvedic_parallel": <true if Ayurvedic texts likely cover this product or its ingredients>\n'
            "}\n\n"
            "Examples of product_name extraction:\n"
            "  Q: 'Is Janam Gutti safe?' -> product_name: 'Janam Gutti'\n"
            "  Q: 'Can I use Calpol for my baby?' -> product_name: 'Calpol'\n"
            "  Q: 'Is dry potter safe for newborn?' -> product_name: 'Dry Potter'\n"
            "  Q: 'What are benefits of coconut oil?' -> product_name: 'coconut oil'\n"
            "  Q: 'What should I eat in pregnancy?' -> product_name: ''\n\n"
            "Known ingredient mappings:\n"
            "  Janam Gutti: Brahmi, Vacha, Saunf (Fennel), Honey, Giloy, Shatavari, Pippali, Mulethi\n"
            "  Gripe Water: Dill oil, Fennel, Ginger, Sodium Bicarbonate\n"
            "  Calpol: Paracetamol (Acetaminophen)\n"
            "  Nurofen for Children: Ibuprofen\n"
            "  Infacol: Simethicone\n"
            "  Himalaya Baby Oil: Almond oil, Olive oil, Country mallow (Bala)\n"
            "  Coconut oil: Lauric acid, Caprylic acid\n"
            "  If product not listed, infer the most likely active ingredients/herbs based on your knowledge."
        )
        resp = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": extraction_prompt}],
            max_tokens=250,
            temperature=0.1,
        )
        raw = resp.choices[0].message.content.strip()
        json_match = re.search(r"\{.*\}", raw, re.DOTALL)
        if json_match:
            import json
            data = json.loads(json_match.group())
            return {
                "product_name": str(data.get("product_name", "")).strip(),
                "ingredients": [str(i).strip() for i in data.get("ingredients", []) if i],
                "is_product_query": bool(data.get("is_product_query", False)),
                "has_ayurvedic_parallel": bool(data.get("has_ayurvedic_parallel", False)),
            }
    except Exception as e:
        logger.warning("Ingredient extraction failed: %s", e)
    return default


def query_ayurvedic_ingredients(ingredients: list, collection, model) -> list:
    """
    For each ingredient, run a targeted ChromaDB Ayurvedic vector query.
    Returns a list of relevant chunk dicts (text, source, category, distance).
    Each ingredient query fetches up to 2 Ayurvedic chunks.
    """
    if not ingredients:
        return []

    seen_texts = set()
    ingredient_chunks = []

    for ingredient in ingredients[:6]:  # cap at 6 ingredients
        try:
            q_vec = model.encode([ingredient]).tolist()
            results = collection.query(
                query_embeddings=q_vec,
                n_results=2,
                where={"category": "ayurvedic"},
                include=["documents", "metadatas", "distances"],
            )
            if not results["documents"] or not results["documents"][0]:
                continue
            for doc, meta, dist in zip(
                results["documents"][0],
                results["metadatas"][0],
                results["distances"][0],
            ):
                if doc not in seen_texts and dist < 0.78:
                    seen_texts.add(doc)
                    ingredient_chunks.append({
                        "text": doc,
                        "source": meta.get("source", "unknown"),
                        "category": "ayurvedic",
                        "distance": dist,
                        "ingredient": ingredient,
                    })
        except Exception as e:
            logger.warning("Ayurvedic query for ingredient '%s' failed: %s", ingredient, e)

    return ingredient_chunks


def get_safe_fallback(question: str, reason: str) -> dict:
    messages = {
        "no_chunks_found": (
            "Hmm, I don't have specific information on this topic in my knowledge base yet. "
            "For accurate guidance, please consult your obstetrician, pediatrician, "
            "or an Ayurvedic practitioner. You can also call the NHM helpline: 104."
        ),
        "low_relevance": (
            "I found some related information but I'm not confident enough to give "
            "you a reliable answer here. Please speak directly with your doctor — "
            "this one needs a personalised opinion. NHM helpline: 104"
        ),
        "hallucination_detected": (
            "I want to give you accurate information but I can't fully verify the "
            "details for this answer from my sources. Please consult a qualified "
            "healthcare provider for this question."
        ),
        "requires_doctor": (
            "This question involves medical decisions that really need personalised "
            "advice from your doctor. I can't give a safe automated answer here — "
            "please check with your healthcare provider directly."
        ),
    }

    answer = messages.get(reason, messages["no_chunks_found"])
    answer += DISCLAIMERS["safety_fallback"]

    return {
        "answer": answer,
        "sources": [],
        "confidence": "safety_fallback",
        "category": "safety_fallback",
        "hallucination_check": "triggered",
        "reason": reason,
    }


def generate_response(
    question: str,
    category: str = "general",
    ner_context: dict = None,
    user_id: str = "anonymous",
    passed_history: list = None,  
) -> dict:
    try:
        # ── Step 0: Product / Ingredient Intelligence ──────────────────────────
        # Detect product questions and extract ingredients BEFORE vector search
        # so we can run targeted Ayurvedic queries per ingredient.
        ingredient_info = {"product_name": "", "ingredients": [], "is_product_query": False}
        if _is_product_question(question):
            logger.info("Product question detected — extracting ingredients")
            ingredient_info = extract_product_ingredients(question)
            logger.info(
                "Extracted product='%s', ingredients=%s",
                ingredient_info["product_name"],
                ingredient_info["ingredients"],
            )
        model, collection = _get_embeddings()
        q_vec = model.encode([question]).tolist()

        # ── Query 1: broad match, no category filter ───────────────────────
        all_results = collection.query(
            query_embeddings=q_vec,
            n_results=8,
            include=["documents", "metadatas", "distances"],
        )

        # ── Query 2: force Ayurvedic chunks ───────────────────────────────
        try:
            ayur_results = collection.query(
                query_embeddings=q_vec,
                n_results=4,
                where={"category": "ayurvedic"},
                include=["documents", "metadatas", "distances"],
            )
        except Exception:
            ayur_results = {"documents": [[]], "metadatas": [[]], "distances": [[]]}

        # ── Query 3: force MBBS/nutrition chunks ──────────────────────────
        try:
            mbbs_results = collection.query(
                query_embeddings=q_vec,
                n_results=4,
                where={"category": {"$in": ["mbbs", "nutrition", "research"]}},
                include=["documents", "metadatas", "distances"],
            )
        except Exception:
            mbbs_results = {"documents": [[]], "metadatas": [[]], "distances": [[]]}

        # ── Merge and deduplicate ──────────────────────────────────────────
        seen_texts = set()
        merged = []
        for results in [all_results, ayur_results, mbbs_results]:
            if not results["documents"][0]:
                continue
            for doc, meta, dist in zip(
                results["documents"][0],
                results["metadatas"][0],
                results["distances"][0],
            ):
                if doc not in seen_texts and dist < 0.75:
                    seen_texts.add(doc)
                    merged.append({
                        "text": doc,
                        "source": meta.get("source", "unknown"),
                        "category": meta.get("category", "general"),
                        "distance": dist,
                    })

        merged.sort(key=lambda x: x["distance"])
        top_chunks = merged[:10]

        # ── Ayurvedic Ingredient Queries (for product questions) ───────────────
        ingredient_ayur_chunks = []
        if ingredient_info["ingredients"]:
            logger.info("Querying Ayurvedic DB for ingredients: %s", ingredient_info["ingredients"])
            ingredient_ayur_chunks = query_ayurvedic_ingredients(
                ingredient_info["ingredients"], collection, model
            )
            logger.info("Got %d ingredient-level Ayurvedic chunks", len(ingredient_ayur_chunks))
            # Merge into main list (avoiding duplicates)
            existing_texts = {c["text"] for c in merged}
            for ic in ingredient_ayur_chunks:
                if ic["text"] not in existing_texts:
                    merged.append(ic)
                    existing_texts.add(ic["text"])
            # Re-sort after adding ingredient chunks
            merged.sort(key=lambda x: x["distance"])
            top_chunks = merged[:12]  # allow more chunks for product questions

        # ── Hybrid Dynamic Web Search & Context Fusion (DWCF) ────────────────
        # CRITICAL: pass the clean product_name as search_topic, NOT the raw question.
        # Using the raw question causes irrelevant results (e.g., "Janam TV" for "Janam Gutti").
        web_results = []
        try:
            # Determine the best search topic:
            # If a product name was extracted, use it. Otherwise, derive a clean topic
            # from the question by stripping question words.
            if ingredient_info.get("product_name"):
                search_topic = ingredient_info["product_name"]
            else:
                # Strip conversational words to get the core health topic
                search_topic = re.sub(
                    r"\b(is|are|can|should|does|what|how|why|when|for|my|the|a|an|it|"
                    r"safe|good|bad|okay|ok|harmful|beneficial|should i|do i)\b",
                    " ",
                    question.lower(),
                )
                search_topic = re.sub(r"\s+", " ", search_topic).strip() or question

            logger.info("Executing web search with topic: '%s'", search_topic)
            web_results = search_health_web(
                search_topic=search_topic,
                ingredient_terms=ingredient_info["ingredients"] or None,
            )
            logger.info(
                "Web insights: %d total (abstracts=%d, reviews=%d, research=%d)",
                len(web_results),
                sum(1 for r in web_results if r.get("type") == "abstract"),
                sum(1 for r in web_results if r.get("type") == "review"),
                sum(1 for r in web_results if r.get("type") == "research"),
            )
        except Exception as e:
            logger.warning("Web search failed: %s", e)

        if not top_chunks and not web_results:
            return get_safe_fallback(question, "no_chunks_found")

        # ── Confidence check ───────────────────────────────────────────────
        if top_chunks:
            best_dist = min(c["distance"] for c in top_chunks)
            avg_dist  = sum(c["distance"] for c in top_chunks) / len(top_chunks)
            retrieval_score = round(1 - avg_dist, 3)
        else:
            best_dist = 0.5
            retrieval_score = 0.6

        # Only fall back if BOTH local RAG is low relevance AND web search has no results
        if best_dist > 0.7 and not web_results:
            return get_safe_fallback(question, "low_relevance")

        tier = classify_confidence_tier(question, retrieval_score, category)
        if tier == "requires_doctor":
            fb = get_safe_fallback(question, "requires_doctor")
            fb["confidence"] = "requires_doctor"
            fb["queue_for_doctor"] = True
            return fb

        # ── Separate Ayurvedic vs MBBS/nutrition chunks ───────────────────
        mbbs_chunks = [c for c in top_chunks
                       if c["category"] in ("mbbs", "nutrition", "research")]
        ayur_chunks = [c for c in top_chunks if c["category"] == "ayurvedic"]

        mbbs_context = "\n\n".join(
            f"[{_friendly_source_name(c['source'])}]\n{c['text']}"
            for c in mbbs_chunks
        ) or "No MBBS/nutrition sources retrieved."

        ayur_context = "\n\n".join(
            f"[{_friendly_source_name(c['source'])}]\n{c['text']}"
            for c in ayur_chunks
        ) or "No Ayurvedic sources retrieved — use classical Ayurvedic wisdom."

        # ── Format Live Web / Research context ─────────────────────────────
        # Separate by type for richer context labels
        abstract_results = [r for r in web_results if r.get("type") == "abstract"]
        review_results   = [r for r in web_results if r.get("type") == "review"]
        research_results = [r for r in web_results if r.get("type") == "research"]

        def _fmt_web_block(results, label):
            if not results:
                return ""
            lines = [f"=== {label} ==="]
            for r in results:
                lines.append(f"[{r['source']}] (URL: {r['url']})\n{r['text']}")
            return "\n\n".join(lines)

        web_overview_ctx  = _fmt_web_block(abstract_results, "Product / Health Overview")
        web_reviews_ctx   = _fmt_web_block(review_results,  "Indian Community Reviews & Experiences")
        web_research_ctx  = _fmt_web_block(research_results, "Clinical Research (PubMed)")

        web_context_parts = [
            web_overview_ctx, web_reviews_ctx, web_research_ctx
        ]
        web_context = "\n\n".join(p for p in web_context_parts if p) \
            or "No fresh live research or web search results found."

        # Determine if reviews are relevant to the user's specific question topic
        has_reviews = bool(review_results)
        if has_reviews:
            # Simple heuristic: check if any review snippet shares common words with question
            q_terms = set(question.lower().split())
            relevant_reviews = []
            for r in review_results:
                r_terms = set(r.get("text", "").lower().split())
                if len(q_terms.intersection(r_terms)) > 1:
                    relevant_reviews.append(r)
            has_reviews = bool(relevant_reviews)
            if not has_reviews:
                web_reviews_ctx = ""

        # ── Merge local and web sources for friendly reference citations ───
        all_sources_friendly = list({
            _friendly_source_name(c["source"]) for c in top_chunks
        })
        for res in web_results:
            src = res.get("source", "Web Insight")
            url = res.get("url", "")
            if url:
                all_sources_friendly.append(f"[{src}]({url})")
            else:
                all_sources_friendly.append(src)

        # ── Conversation history ───────────────────────────────────────────
# ── Conversation history ───────────────────────────────────────────
        # Use history passed from NestJS (sourced from DB) if available,
        # otherwise fall back to in-memory dict for local dev without NestJS.
        if passed_history:
            history = passed_history[-4:]
            history_text = ""
            if history:
                history_text = "RECENT CONVERSATION:\n"
                for h in history:
                    role_label = "User" if h.get("role") == "user" else "Matrny"
                    history_text += f"{role_label}: {h.get('content', '')[:150]}\n"
                history_text += "\n"
        else:
            history = _conversation_history[user_id][-4:]
            history_text = ""
            if history:
                history_text = "RECENT CONVERSATION:\n"
                for h in history:
                    history_text += f"User: {h['question']}\n"
                    history_text += f"Matrny: {h['answer'][:150]}...\n\n"

        # ── User context ───────────────────────────────────────────────────
        user_ctx = ""
        profile_data_missing = True   # assume missing — set False below if any profile field found
        if ner_context:
            if ner_context.get("pregnancyWeek"):
                user_ctx += f"She is {ner_context['pregnancyWeek']} weeks pregnant. "
                profile_data_missing = False
            if ner_context.get("babyAgeMonths"):
                user_ctx += f"Her baby is {ner_context['babyAgeMonths']} months old. "
                profile_data_missing = False
            if ner_context.get("conditions"):
                user_ctx += f"Known conditions: {', '.join(ner_context['conditions'])}. "
                profile_data_missing = False
            # Extended context: weight, meal, mood
            if ner_context.get("recentWeightKg"):
                user_ctx += f"Her most recently logged weight is {ner_context['recentWeightKg']} kg. "
                profile_data_missing = False
            if ner_context.get("lastMealLog"):
                user_ctx += f"Her last logged meal: '{ner_context['lastMealLog']}'. "
            if ner_context.get("currentMoodScore"):
                mood_map = {1: "very low", 2: "low", 3: "okay", 4: "good", 5: "great"}
                score = int(ner_context["currentMoodScore"])
                user_ctx += f"Her current mood is {mood_map.get(score, 'okay')}. "
            if ner_context.get("name"):
                user_ctx += f"Her name is {ner_context['name']}. "

        # ── Ingredient-level Ayurvedic context ────────────────────────────
        if ingredient_ayur_chunks:
            ingredient_ayur_ctx = "\n\n".join(
                f"[{_friendly_source_name(c['source'])} — re: {c.get('ingredient', '?')}]\n{c['text']}"
                for c in ingredient_ayur_chunks
            )
            # Prepend to ayur_context so ingredient-specific chunks come first
            ayur_context = ingredient_ayur_ctx + (
                ("\n\n" + ayur_context) if ayur_context != "No Ayurvedic sources retrieved — use classical Ayurvedic wisdom." else ""
            )

        # ── Build prompt ──────────────────────────────────────────────────
        # Detect if this is a symptom/health-concern question that needs personalisation
        _symptom_signals = [
            "pain", "breathing", "feel", "symptom", "tired", "dizzy", "nausea",
            "bleed", "swelling", "headache", "fever", "vomit", "constipat",
            "discharge", "cramp", "itch", "rash", "sleep", "anxiety", "depress",
            "stomach", "back", "problem", "issue", "concern", "worried", "difficulty",
        ]
        is_symptom_question = any(s in question.lower() for s in _symptom_signals)
        needs_personalisation = profile_data_missing and is_symptom_question

        product_ctx = ""
        if ingredient_info["is_product_query"]:
            has_ayurvedic = ingredient_info.get("has_ayurvedic_parallel", True)
            product_ctx = (
                f"PRODUCT QUERY DETECTED: The user is asking about '{ingredient_info['product_name']}'. "
                f"Known/likely ingredients: {', '.join(ingredient_info['ingredients']) or 'unknown'}. "
                f"Ayurvedic texts are {'likely relevant' if has_ayurvedic else 'NOT relevant — use global medicine for the Ayurvedic section or replace with Global Traditional Perspective'}. "
                "Always analyse ingredient-by-ingredient in the Ayurvedic/Traditional section. "
                f"Community review data available: {'YES — include Community Voices section' if has_reviews else 'NO — skip Community Voices section'}."
            )

        user_prompt = f"""\
{f'ABOUT THIS USER: {user_ctx}' if user_ctx else 'PROFILE DATA MISSING: No pregnancy/baby/health profile available for this user.'}
{'PERSONALISATION NEEDED: This is a symptom/health concern question and profile data is missing. Ask 1-2 gentle clarifying questions at the end of your bold summary paragraph.' if needs_personalisation else ''}
{product_ctx}

{history_text}
MODERN MEDICINE & NUTRITION SOURCES:
{mbbs_context}

AYURVEDIC SOURCES (including ingredient-level analysis):
{ayur_context}

LIVE WEB RESEARCH & COMMUNITY INTELLIGENCE:
{web_context}

QUESTION: {question}

Remember: Bold summary paragraph first (200-250 words), then the structured sections.
{'Include the Community Voices section ONLY if the reviews directly relate to THIS question topic.' if has_reviews else 'Skip the Community Voices section — no review data available.'}
Do NOT cite commercial supplement review sites or sponsored news as references.
Use these friendly source names in the References section: {', '.join(all_sources_friendly)}"""

        # ── Call Groq ──────────────────────────────────────────────────────
        response = _get_groq_client().chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": GROUNDED_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=900,
            temperature=0.4,
        )

        answer = response.choices[0].message.content

        # ── Hallucination check (web-aware) ───────────────────────────────
        chunk_texts = [c["text"] for c in top_chunks]
        web_texts   = [res["text"] for res in web_results]
        hall_check = detect_potential_hallucination(answer, chunk_texts, web_grounded_texts=web_texts)
        if not hall_check["is_safe"]:
            logger.warning("Hallucination flags: %s", hall_check["flags"])
            return get_safe_fallback(question, "hallucination_detected")

        # ── Append disclaimer ──────────────────────────────────────────────
        answer += DISCLAIMERS.get(tier, DISCLAIMERS["ai_generated"])

        # Keep in-memory history as fallback for local dev (no NestJS running).
        # In production, NestJS passes history from the DB so this is unused.
        _conversation_history[user_id].append({
            "question": question,
            "answer": answer,
        })
        if len(_conversation_history[user_id]) > 10:
            _conversation_history[user_id] = \
                _conversation_history[user_id][-10:]

        return {
            "answer": answer,
            "sources": all_sources_friendly,
            "confidence": tier,
            "category": category,
            "retrieval_score": retrieval_score,
            "hallucination_check": "passed",
            "product_query": ingredient_info.get("is_product_query", False),
            "ingredients_analysed": ingredient_info.get("ingredients", []),
            "web_sources": {
                "abstracts": len(abstract_results),
                "reviews": len(review_results),
                "research": len(research_results),
            },
        }

    except Exception as e:
        logger.error("Response generation error: %s", e)
        return {
            "answer": (
                "I'm having a little technical difficulty right now. "
                "Please try again in a moment, or call NHM helpline: 104 "
                "for immediate guidance."
            ) + DISCLAIMERS["safety_fallback"],
            "sources": [],
            "confidence": "requires_doctor",
            "category": category,
            "error": True,
        }