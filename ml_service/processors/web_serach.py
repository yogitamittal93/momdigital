"""
Smart 3-Stage Health Web Search Engine for Matrny
===================================================
Stage 1 — Targeted topic search using the CLEAN product/topic name (not the full question)
Stage 2 — Parenting community review search (Indian sites preferred, global fallback)
Stage 3 — PubMed clinical / ingredient-level research

IMPORTANT: Always search using the extracted topic/product name, NOT the raw question.
This prevents spurious matches like "Janam TV" when searching for "Janam Gutti".

Each result includes a `type` field:
  "abstract"  — general health/product overview
  "review"    — real user experience from parenting communities
  "research"  — PubMed clinical study abstract

Results also include `source` (site name) and `url` for clickable references.
"""
import logging
import re
import requests

logger = logging.getLogger(__name__)

# ── Preferred Indian parenting / health review sites ─────────────────────────
INDIAN_REVIEW_SITES = [
    "site:babycenter.in",
    "site:momjunction.com",
    "site:indiaparenting.com",
    "site:healofy.com",
    "site:theindusparent.com",
]

# ── Global parenting / health sites (fallback when Indian sites have nothing) ─
GLOBAL_REVIEW_SITES = [
    "site:babycenter.com",
    "site:whattoexpect.com",
    "site:mumsnet.com",
    "site:babycentre.co.uk",
]

# ── Domains to always skip (media, TV, social, unrelated) ────────────────────
SKIP_DOMAINS = [
    "youtube.com", "yupptv.com", "twitter.com", "facebook.com",
    "instagram.com", "tiktok.com", "reddit.com",
    # Indian TV channels — these can match on product name fragments
    "janamtv.com", "tamiljanam.com", "zeenews.india.com",
    "abplive.com", "ndtv.com", "aajtak.in", "livetv.in",
]


def _ddg_search(query: str, max_results: int = 5) -> list:
    """
    Real DuckDuckGo HTML search via ddgs library.
    Falls back to Instant Answer API if ddgs is unavailable.
    """
    results = []
    try:
        from ddgs import DDGS
        with DDGS() as ddgs:
            for r in ddgs.text(query, max_results=max_results, region="in-en"):
                results.append({
                    "title": r.get("title", ""),
                    "text":  r.get("body", ""),
                    "url":   r.get("href", ""),
                })
    except ImportError:
        logger.warning("ddgs not installed. Falling back to DuckDuckGo Instant Answer.")
        results = _ddg_instant_fallback(query, max_results)
    except Exception as e:
        logger.warning("DDG search error: %s", e)
    return results


def _ddg_instant_fallback(query: str, max_results: int = 3) -> list:
    """Fallback: DuckDuckGo Instant Answer API (Wikipedia-based, limited)."""
    results = []
    try:
        resp = requests.get(
            "https://api.duckduckgo.com/",
            params={"q": query, "format": "json", "no_html": 1, "skip_disambig": 1},
            timeout=5,
        )
        data = resp.json()
        if data.get("AbstractText"):
            results.append({
                "title": data.get("Heading", ""),
                "text":  data["AbstractText"],
                "url":   data.get("AbstractURL", ""),
            })
        for topic in data.get("RelatedTopics", [])[:2]:
            if isinstance(topic, dict) and topic.get("Text"):
                results.append({
                    "title": "Related",
                    "text":  topic["Text"],
                    "url":   topic.get("FirstURL", ""),
                })
    except Exception as e:
        logger.warning("DDG Instant Answer fallback failed: %s", e)
    return results


def _filter_results(raw_results: list, require_signals: list = None) -> list:
    """
    Filter out media/social domains and optionally require review-signal words.
    Returns cleaned list of {title, text, url} dicts.
    """
    filtered = []
    for r in raw_results:
        url  = r.get("url", "")
        text = r.get("text", "").strip()
        # Skip irrelevant media / social / TV domains
        if any(d in url for d in SKIP_DOMAINS):
            continue
        if len(text) < 40:
            continue
        if require_signals:
            if not any(sig in text.lower() for sig in require_signals):
                continue
        filtered.append(r)
    return filtered


def _search_pubmed(terms: list, max_per_term: int = 2) -> list:
    """
    PubMed clinical research search.
    Searches each term (ingredient, product, topic) individually for precision.
    Does NOT force India — searches globally by default.
    """
    results = []
    seen_ids: set = set()
    base = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"

    for term in terms[:5]:  # cap at 5 to avoid rate limits
        try:
            search_r = requests.get(
                f"{base}/esearch.fcgi",
                params={
                    "db":      "pubmed",
                    "term":    f"{term} infant OR baby OR neonate OR pregnancy safety",
                    "retmax":  max_per_term,
                    "retmode": "json",
                    "sort":    "relevance",
                },
                timeout=5,
            )
            ids = search_r.json().get("esearchresult", {}).get("idlist", [])
            new_ids = [i for i in ids if i not in seen_ids][:max_per_term]
            seen_ids.update(new_ids)

            if new_ids:
                fetch_r = requests.get(
                    f"{base}/efetch.fcgi",
                    params={
                        "db":      "pubmed",
                        "id":      ",".join(new_ids),
                        "retmode": "text",
                        "rettype": "abstract",
                    },
                    timeout=8,
                )
                if fetch_r.status_code == 200:
                    abstract = fetch_r.text[:600].strip()
                    if abstract:
                        results.append({
                            "type":   "research",
                            "text":   f"Clinical research on {term}: {abstract}",
                            "source": "PubMed Clinical Research",
                            "url":    f"https://pubmed.ncbi.nlm.nih.gov/{new_ids[0]}",
                        })
        except Exception as e:
            logger.warning("PubMed search for '%s' failed: %s", term, e)

    return results


def _source_name_from_url(url: str) -> str:
    """Map URL domain to a friendly source name."""
    clean  = re.sub(r"https?://(www\.)?", "", url)
    domain = clean.split("/")[0]
    name_map = {
        "babycenter.in":          "BabyCenter India",
        "babycenter.com":         "BabyCenter",
        "momjunction.com":        "MomJunction",
        "indiaparenting.com":     "India Parenting",
        "healofy.com":            "Healofy",
        "theindusparent.com":     "The Indus Parent",
        "whattoexpect.com":       "What to Expect",
        "mumsnet.com":            "Mumsnet",
        "babycentre.co.uk":       "BabyCentre UK",
        "ncbi.nlm.nih.gov":       "PubMed / NCBI",
        "pubmed.ncbi.nlm.nih.gov":"PubMed",
        "who.int":                "WHO",
        "cdsco.gov.in":           "CDSCO India",
        "mohfw.gov.in":           "MoHFW India",
        "nhs.uk":                 "NHS UK",
        "mayoclinic.org":         "Mayo Clinic",
        "healthline.com":         "Healthline",
        "webmd.com":              "WebMD",
        "wikipedia.org":          "Wikipedia",
    }
    for key, friendly in name_map.items():
        if key in domain:
            return friendly
    # Generic fallback — use cleaned domain
    return domain.split(".")[0].replace("-", " ").title() if domain else "Web Source"


# ── Public API ────────────────────────────────────────────────────────────────

def search_health_web(
    search_topic: str,
    ingredient_terms: list = None,
) -> list:
    """
    3-Stage Smart Health Web Search for Matrny.

    Args:
        search_topic:     The CLEAN product/topic name to search for (e.g., "Janam Gutti",
                          "Gripe Water", "Dry Potter", "gestational diabetes test").
                          MUST be the extracted product/topic — NOT the raw user question.
                          Using the raw question causes irrelevant media results (e.g., "Janam TV").
        ingredient_terms: Ingredient/herb names for targeted PubMed search (optional).

    Returns:
        List of structured insight dicts with keys: type, text, source, url
    """
    insights = []

    # ── Stage 1: General product / health safety overview ─────────────────────
    # Use the CLEAN topic name, not the full question.
    # Frame as medical/safety query — NOT as a conversational question.
    logger.info("[WebSearch] Stage 1: Topic search for: '%s'", search_topic)

    # Try two angles: baby/infant safety + general product overview
    safety_query  = f"{search_topic} safety baby infant health"
    overview_query = f"{search_topic} ingredients benefits concerns review"

    for q in [safety_query, overview_query]:
        raw = _ddg_search(q, max_results=3)
        for r in _filter_results(raw):
            url  = r["url"]
            text = r["text"]
            # Deduplicate by URL
            if any(i["url"] == url for i in insights):
                continue
            insights.append({
                "type":   "abstract",
                "text":   text[:500],
                "source": _source_name_from_url(url),
                "url":    url,
            })
        if len([i for i in insights if i["type"] == "abstract"]) >= 4:
            break  # enough general context

    # ── Stage 2: Community reviews — Indian sites first, global fallback ───────
    logger.info("[WebSearch] Stage 2: Community reviews for: '%s'", search_topic)

    review_signals = [
        "parent", "mom", "mother", "review", "experience", "safe", "unsafe",
        "benefit", "side effect", "gave", "used", "tried", "baby", "child",
        "infant", "work", "effect", "recommend", "concern", "doctor",
    ]

    # Try Indian parenting sites first (preferred)
    indian_site_filter = " OR ".join(INDIAN_REVIEW_SITES[:3])
    indian_review_q = f"{search_topic} baby safe review ({indian_site_filter})"
    raw_indian = _ddg_search(indian_review_q, max_results=5)
    filtered_indian = _filter_results(raw_indian, require_signals=review_signals)

    # If no Indian results, fall back to global sites
    if not filtered_indian:
        global_site_filter = " OR ".join(GLOBAL_REVIEW_SITES[:3])
        global_review_q = f"{search_topic} baby safe review ({global_site_filter})"
        raw_global = _ddg_search(global_review_q, max_results=4)
        filtered_indian = _filter_results(raw_global, require_signals=review_signals)

    # Last fallback — broad search with no site restriction
    if not filtered_indian:
        broad_q = f"{search_topic} baby parents experience safe review"
        raw_broad = _ddg_search(broad_q, max_results=4)
        filtered_indian = _filter_results(raw_broad, require_signals=review_signals)

    for r in filtered_indian[:4]:
        url = r["url"]
        if any(i["url"] == url for i in insights):
            continue
        insights.append({
            "type":   "review",
            "text":   r["text"][:500],
            "source": _source_name_from_url(url),
            "url":    url,
        })

    # ── Stage 3: PubMed clinical / ingredient research ────────────────────────
    logger.info("[WebSearch] Stage 3: PubMed research for topic + ingredients")

    # Use ingredient terms if provided, otherwise use the clean topic itself
    pubmed_terms = ingredient_terms if ingredient_terms else [search_topic]
    pubmed_results = _search_pubmed(pubmed_terms)
    insights.extend(pubmed_results)

    logger.info(
        "[WebSearch] Done: %d total (overview=%d, reviews=%d, pubmed=%d)",
        len(insights),
        sum(1 for i in insights if i["type"] == "abstract"),
        sum(1 for i in insights if i["type"] == "review"),
        sum(1 for i in insights if i["type"] == "research"),
    )

    return insights