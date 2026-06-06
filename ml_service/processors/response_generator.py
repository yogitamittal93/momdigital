import os
import re
import logging
from collections import defaultdict
from dotenv import load_dotenv
from processors.web_serach import search_health_web

load_dotenv()
logger = logging.getLogger(__name__)
_groq_client = None

# In-memory conversation history per user (fallback for local dev without NestJS)
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

# Patterns that indicate INVENTED clinical claims — NOT general nutrition facts.
# Deliberately narrow: we only flag drug-like dosages and invented statistics,
# NOT nutrition values (mg of iron, kcal, etc.) which are legitimately sourced.
HALLUCINATION_RED_FLAGS = [
    r"take \d+ tablet",       # drug dosage instructions
    r"take \d+ capsule",
    r"dose of \d+",           # specific drug dose
    r"according to dr\s+\w",  # invented doctor attribution
]

# Nutrition values (mg, kcal, g) are intentionally NOT flagged —
# ICMR/WHO guidelines legitimately contain these numbers and Groq
# correctly cites them. Flagging them causes false positives on
# every valid nutrition answer (iron 27mg, calcium 1200mg, etc.)

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
GROUNDED_SYSTEM_PROMPT = """You are Matrny — imagine a wise, warm older sister who grew up in an Indian
joint family, watched her nani and dadi cook, studied MBBS, and has been helping mothers for 15 years.
You carry the wisdom of both worlds: your nani's soaked almonds and your medical textbooks.
You are NOT a chatbot. You are a trusted didi — personal, specific, and real.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VOICE & TONE — THIS IS THE MOST IMPORTANT RULE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sound like a real Indian elder sister, not a hospital pamphlet. This means:
  ✓ "Soak 5 almonds and 2 walnuts overnight — your nani was right about this, and the NIN agrees."
  ✓ "Third trimester is when baby is putting on weight fast — you need MORE protein now, not less."
  ✓ "Warm ajwain water after meals — this is in Charaka Samhita AND modern gastroenterology."
  ✗ NEVER say: "According to the Dietary Guidelines for Indians 2024 (ICMR-NIN), a pregnant woman's daily diet should contain..."
  ✗ NEVER open with a source citation. Lead with the real, practical answer.
  ✗ NEVER pad with generic advice like "eat a balanced diet" or "stay hydrated" — be SPECIFIC.
  ✗ NEVER repeat the question back to the user.

CONVERSATIONAL CONTINUITY:
  If the conversation history shows the user said she is vegetarian, postpartum, 28 weeks pregnant,
  or anything personal — WEAVE THAT INTO your answer naturally, like a friend who listened.
  If she said "I am vegetarian" and now asks for a meal plan — START with her vegetarian
  meal plan. Do NOT ask again if she is vegetarian.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESPONSE FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**[WARM DIRECT ANSWER — 150-200 words, entire paragraph bold]**

Write this like a caring didi giving real advice over chai, not a doctor reading from a chart.
  • Be SPECIFIC: name actual foods, quantities, times of day — not food groups.
  • Include Indian home wisdom where it applies: soaked almonds (5 daily), 2 walnuts, haldi doodh
    at night, ajwain water, jeera water, chaach, ghee on rotis, til, methi, drumstick leaves,
    sattu, ragi — these are in Ayurvedic texts AND backed by modern nutrition. Use them freely.
  • For a DIET question: give an actual sample day. Example:
      Morning: soaked almonds + warm milk.
      Breakfast: poha with peas and peanuts, or ragi dosa.
      Lunch: 2 rotis, dal, sabzi, curd.
      Evening snack: dates + milk or roasted chana.
      Dinner: khichdi with ghee, or dal chawal.
  • For a SYMPTOM: name the most likely cause first, then what to do.
  • If the user just shared something personal (first baby, C-section, vegetarian, anxious):
    acknowledge it warmly in ONE sentence before diving in. Like a friend would.
  • If profile is missing AND this is a health concern: end with ONE specific warm question only.
    Example: "By the way, how many weeks along are you? I can make this much more useful."

---
🏥 **What the research says:**
2-3 sentences with specific findings — not just source names.
BAD: "ICMR-NIN recommends a balanced diet."
GOOD: "ICMR-NIN 2024 says third-trimester women need an extra 350 kcal and 18g protein daily —
that is roughly one extra katori of dal and a glass of full-fat milk on top of your regular meals."

🌿 **Your dadi knew this:**
Specific Ayurvedic or traditional wisdom — name the actual practice, not the general principle.
BAD: "Charaka Samhita emphasises the importance of nutrition during pregnancy."
GOOD: "Charaka Samhita's Garbhini Paricharya chapter specifically recommends tila (sesame),
milk preparations, and sweet foods in the third trimester to support fetal weight gain and the
mother's strength — which maps perfectly to modern research on calcium, healthy fats, and energy."
SKIP this section ENTIRELY (do not write the header) if the topic has no genuine Ayurvedic connection.
Replace with 🌍 **Global wisdom:** only if relevant non-Ayurvedic traditional knowledge applies.

💡 **Try this tomorrow morning:**
ONE specific, actionable tip with exact amount, time, and method.
BAD: "Include more iron-rich foods in your diet."
GOOD: "Soak 5 almonds + 2 walnuts tonight. Eat them first thing tomorrow on an empty stomach
with a glass of warm milk. The combination gives you protein, healthy fats, omega-3s, and the
magnesium your third-trimester muscles desperately need. Your nani was right — and so is the NIN."

📚 **Sources:** [Credible sources only — WHO, FOGSI, ICMR, PubMed, NHS, Charaka Samhita, etc.
No commercial review sites. Inline clickable markdown links. Keep this section to one short line.]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HARD RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Total response under 520 words. Quality beats quantity every time.
2. Never open with a source citation. Lead with the human, practical answer.
3. Never use "balanced diet", "stay hydrated", or "consult your doctor" as the MAIN advice.
   A brief "check with your doctor if this persists" at the very end is fine.
4. Never invent drug dosages or specific lab values not present in the grounding context.
5. Never diagnose. Never recommend stopping prescribed medication.
6. If the user shares something personal — acknowledge it warmly in one sentence first.
7. Emergency keywords (heavy bleeding, not breathing, baby not moving, unconscious) →
   give emergency numbers immediately and stop. Do NOT try to answer the health question."""


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
    Whitespace is normalised before matching so "400 mg" in the answer
    correctly matches "400mg" in the source context (and vice versa).
    """
    flags_found = []
    all_context_texts = list(retrieved_chunks)
    if web_grounded_texts:
        all_context_texts.extend(web_grounded_texts)

    # Normalise: lowercase + strip ALL whitespace so "400 mg" == "400mg"
    combined_context_norm = re.sub(r'\s+', '', " ".join(all_context_texts).lower())
    answer_norm           = re.sub(r'\s+', '', answer.lower())

    for pattern in HALLUCINATION_RED_FLAGS:
        for match in re.findall(pattern, answer_norm):
            match_norm = re.sub(r'\s+', '', match)
            if match_norm not in combined_context_norm:
                flags_found.append({"pattern": pattern, "found": match})

    return {
        "is_safe": len(flags_found) == 0,
        "flags": flags_found,
        "flag_count": len(flags_found),
    }


# ── Product & Ingredient Intelligence ─────────────────────────────────────────
_INDIAN_PRODUCT_SIGNALS = [
    "janam gutti", "gripe water", "woodward", "dabur", "himalaya baby",
    "baidyanath", "zandu", "patanjali", "hamdard", "ber jadi", "roohi",
    "kajal", "surma", "nasya", "lehyam", "avaleha", "churna", "ghrit", "vati",
    "abhyanga", "balaswagandhadi", "karpooradi", "dhanwantharam", "shatavari",
]

_GLOBAL_PRODUCT_SIGNALS = [
    "calpol", "nurofen", "infacol", "dentinox", "bonjela", "gaviscon",
    "mylicon", "simethicone", "gripe", "colief", "lactulose", "saline drops",
    "nystatin", "sudocrem", "bepanthen", "coconut oil", "almond oil",
    "fish oil", "vitamin d drops", "iron drops", "probiotics", "lactobacillus",
    "dry potter", "aqueous cream", "e45", "cetaphil", "johnson",
]

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
    q = question.lower()
    if any(sig in q for sig in _INDIAN_PRODUCT_SIGNALS):
        return True
    if any(sig in q for sig in _GLOBAL_PRODUCT_SIGNALS):
        return True
    if any(re.search(p, q) for p in _INTENT_PATTERNS):
        return True
    return False


def extract_product_ingredients(question: str) -> dict:
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
            "Examples:\n"
            "  Q: 'Is Janam Gutti safe?' -> product_name: 'Janam Gutti'\n"
            "  Q: 'Can I use Calpol for my baby?' -> product_name: 'Calpol'\n"
            "  Q: 'What should I eat in pregnancy?' -> product_name: ''\n\n"
            "Known ingredient mappings:\n"
            "  Janam Gutti: Brahmi, Vacha, Saunf, Honey, Giloy, Shatavari, Pippali, Mulethi\n"
            "  Gripe Water: Dill oil, Fennel, Ginger, Sodium Bicarbonate\n"
            "  Calpol: Paracetamol\n"
            "  Nurofen for Children: Ibuprofen\n"
            "  Infacol: Simethicone\n"
            "  Himalaya Baby Oil: Almond oil, Olive oil, Country mallow (Bala)\n"
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
    if not ingredients:
        return []

    seen_texts = set()
    ingredient_chunks = []

    for ingredient in ingredients[:6]:
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

        # ── Query 1: broad match ───────────────────────────────────────────
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

        # ── Ayurvedic Ingredient Queries ───────────────────────────────────
        ingredient_ayur_chunks = []
        if ingredient_info["ingredients"]:
            logger.info("Querying Ayurvedic DB for ingredients: %s", ingredient_info["ingredients"])
            ingredient_ayur_chunks = query_ayurvedic_ingredients(
                ingredient_info["ingredients"], collection, model
            )
            logger.info("Got %d ingredient-level Ayurvedic chunks", len(ingredient_ayur_chunks))
            existing_texts = {c["text"] for c in merged}
            for ic in ingredient_ayur_chunks:
                if ic["text"] not in existing_texts:
                    merged.append(ic)
                    existing_texts.add(ic["text"])
            merged.sort(key=lambda x: x["distance"])
            top_chunks = merged[:12]

        # ── Web Search ────────────────────────────────────────────────────
        web_results = []
        try:
            if ingredient_info.get("product_name"):
                search_topic = ingredient_info["product_name"]
            else:
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

        # ── Confidence ────────────────────────────────────────────────────
        if top_chunks:
            best_dist = min(c["distance"] for c in top_chunks)
            avg_dist  = sum(c["distance"] for c in top_chunks) / len(top_chunks)
            retrieval_score = round(1 - avg_dist, 3)
        else:
            best_dist = 0.5
            retrieval_score = 0.6

        if best_dist > 0.7 and not web_results:
            return get_safe_fallback(question, "low_relevance")

        tier = classify_confidence_tier(question, retrieval_score, category)
        if tier == "requires_doctor":
            fb = get_safe_fallback(question, "requires_doctor")
            fb["confidence"] = "requires_doctor"
            fb["queue_for_doctor"] = True
            return fb

        # ── Separate Ayurvedic vs MBBS ────────────────────────────────────
        mbbs_chunks = [c for c in top_chunks if c["category"] in ("mbbs", "nutrition", "research")]
        ayur_chunks = [c for c in top_chunks if c["category"] == "ayurvedic"]

        mbbs_context = "\n\n".join(
            f"[{_friendly_source_name(c['source'])}]\n{c['text']}"
            for c in mbbs_chunks
        ) or "No MBBS/nutrition sources retrieved."

        ayur_context = "\n\n".join(
            f"[{_friendly_source_name(c['source'])}]\n{c['text']}"
            for c in ayur_chunks
        ) or "No Ayurvedic sources retrieved — use classical Ayurvedic wisdom."

        # ── Format web context ────────────────────────────────────────────
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

        web_context = "\n\n".join(filter(None, [
            _fmt_web_block(abstract_results, "Product / Health Overview"),
            _fmt_web_block(review_results,   "Indian Community Reviews & Experiences"),
            _fmt_web_block(research_results, "Clinical Research (PubMed)"),
        ])) or "No live web research found."

        # Relevance check for community reviews
        has_reviews = bool(review_results)
        if has_reviews:
            q_terms = set(question.lower().split())
            relevant_reviews = [
                r for r in review_results
                if len(q_terms.intersection(set(r.get("text", "").lower().split()))) > 1
            ]
            has_reviews = bool(relevant_reviews)

        # ── Source names ──────────────────────────────────────────────────
        all_sources_friendly = list({_friendly_source_name(c["source"]) for c in top_chunks})
        for res in web_results:
            src = res.get("source", "Web Insight")
            url = res.get("url", "")
            all_sources_friendly.append(f"[{src}]({url})" if url else src)

        # ── Conversation history ───────────────────────────────────────────
        # Use history passed from NestJS (sourced from DB) if available.
        # Falls back to in-memory dict for local dev without NestJS running.
        if passed_history:
            history = passed_history[-4:]
            history_text = ""
            if history:
                history_text = "RECENT CONVERSATION:\n"
                for h in history:
                    role_label = "User" if h.get("role") == "user" else "Matrny"
                    history_text += f"{role_label}: {h.get('content', '')[:200]}\n"
                history_text += "\n"
        else:
            history = _conversation_history[user_id][-4:]
            history_text = ""
            if history:
                history_text = "RECENT CONVERSATION:\n"
                for h in history:
                    history_text += f"User: {h['question']}\n"
                    history_text += f"Matrny: {h['answer'][:200]}\n\n"

        # ── User context ───────────────────────────────────────────────────
        user_ctx = ""
        profile_data_missing = True
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
            ayur_context = ingredient_ayur_ctx + (
                ("\n\n" + ayur_context)
                if ayur_context != "No Ayurvedic sources retrieved — use classical Ayurvedic wisdom."
                else ""
            )

        # ── Symptom personalisation flag ───────────────────────────────────
        _symptom_signals = [
            "pain", "breathing", "feel", "symptom", "tired", "dizzy", "nausea",
            "bleed", "swelling", "headache", "fever", "vomit", "constipat",
            "discharge", "cramp", "itch", "rash", "sleep", "anxiety", "depress",
            "stomach", "back", "problem", "issue", "concern", "worried", "difficulty",
        ]
        is_symptom_question = any(s in question.lower() for s in _symptom_signals)
        needs_personalisation = profile_data_missing and is_symptom_question

        # ── Product context ────────────────────────────────────────────────
        product_ctx = ""
        if ingredient_info["is_product_query"]:
            has_ayurvedic = ingredient_info.get("has_ayurvedic_parallel", True)
            product_ctx = (
                f"PRODUCT QUERY DETECTED: The user is asking about '{ingredient_info['product_name']}'. "
                f"Known/likely ingredients: {', '.join(ingredient_info['ingredients']) or 'unknown'}. "
                f"Ayurvedic texts are {'likely relevant' if has_ayurvedic else 'NOT relevant — use global medicine or Global Traditional Perspective'}. "
                "Always analyse ingredient-by-ingredient in the Ayurvedic/Traditional section. "
                f"Community review data available: {'YES — include Community Voices section' if has_reviews else 'NO — skip Community Voices section'}."
            )

        # ── Build user prompt ──────────────────────────────────────────────
        user_prompt = f"""\
{f'ABOUT THIS USER: {user_ctx}' if user_ctx else 'PROFILE DATA MISSING: No pregnancy/baby/health profile available for this user.'}
{'PERSONALISATION NEEDED: End your opening paragraph with ONE warm clarifying question.' if needs_personalisation else ''}
{product_ctx}

{history_text}
MODERN MEDICINE & NUTRITION SOURCES:
{mbbs_context}

AYURVEDIC SOURCES:
{ayur_context}

LIVE WEB RESEARCH:
{web_context}

QUESTION: {question}

{'Community review data is available and relevant — include the 👥 Community Voices section.' if has_reviews else 'Skip the Community Voices section — no relevant review data.'}
Do NOT cite commercial supplement review sites or sponsored news as references.
Use these friendly source names in the References section: {', '.join(all_sources_friendly)}"""

        # ── Call Groq ──────────────────────────────────────────────────────
        response = _get_groq_client().chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": GROUNDED_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=1100,   # increased from 900 to give the new format room to breathe
            temperature=0.45,  # slightly higher for more natural, less robotic tone
        )

        answer = response.choices[0].message.content

        # ── Hallucination check ────────────────────────────────────────────
        chunk_texts = [c["text"] for c in top_chunks]
        web_texts   = [res["text"] for res in web_results]
        hall_check = detect_potential_hallucination(answer, chunk_texts, web_grounded_texts=web_texts)
        if not hall_check["is_safe"]:
            logger.warning("Hallucination flags: %s", hall_check["flags"])
            return get_safe_fallback(question, "hallucination_detected")

        # ── Append disclaimer ──────────────────────────────────────────────
        answer += DISCLAIMERS.get(tier, DISCLAIMERS["ai_generated"])

        # ── Save to in-memory history (fallback for local dev) ─────────────
        # In production, NestJS passes history from the DB — this is unused there.
        _conversation_history[user_id].append({
            "question": question,
            "answer": answer,
        })
        if len(_conversation_history[user_id]) > 10:
            _conversation_history[user_id] = _conversation_history[user_id][-10:]

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