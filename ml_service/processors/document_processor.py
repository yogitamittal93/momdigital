import fitz  # PyMuPDF
import os
import logging

logger = logging.getLogger(__name__)

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from a PDF, using basic extraction only for now."""
    try:
        doc = fitz.open(pdf_path)
        full_text = ""
        for page_num, page in enumerate(doc):
            text = page.get_text()
            if text.strip():
                full_text += f"\n--- Page {page_num+1} ---\n{text}"
        doc.close()
        return full_text
    except Exception as e:
        logger.error(f"Error processing {pdf_path}: {e}")
        return ""

def ingest_folder(folder_path: str) -> list:
    """Process all PDFs in a folder and return list of documents."""
    documents = []
    if not os.path.exists(folder_path):
        logger.warning(f"Folder not found: {folder_path}")
        return documents

    for filename in os.listdir(folder_path):
        if filename.lower().endswith(".pdf"):
            path = os.path.join(folder_path, filename)
            logger.info(f"Processing: {filename}")
            text = extract_text_from_pdf(path)
            if text.strip():
                # Tag each document with its source category
                category = detect_category(filename)
                documents.append({
                    "text": text,
                    "source": filename,
                    "category": category
                })
                logger.info(f"✓ {filename} → {len(text)} chars, category: {category}")
            else:
                logger.warning(f"✗ No text extracted from {filename}")

    logger.info(f"Total documents ingested: {len(documents)}")
    return documents

def detect_category(filename: str) -> str:
    name = filename.lower()

    ayurvedic_keywords = [
        "charaka", "sushruta", "ashtanga", "kashyap", "kasyapa",
        "bhavprakash", "nighantu", "ayur", "madhava", "nidana",
        "samhita", "vaidya", "rasayana"
    ]
    mbbs_keywords = [
        "fogsi", "iap", "who", "nhm", "mbbs", "clinical",
        "guideline", "hospital", "bfhi", "breastfeed", "9789240",
        "9789241", "preterm", "newborn"
    ]
    nutrition_keywords = [
        "nin", "nutrition", "diet", "rujuta", "food", "icmr",
        "dgi", "ifct", "superfoods", "plate", "nnmb", "mnd",
        "compendium", "dietary"
    ]
    research_keywords = [
        "nfhs", "dhs", "anganwadi", "rch", "survey", "report"
    ]

    if any(k in name for k in ayurvedic_keywords):
        return "ayurvedic"
    elif any(k in name for k in mbbs_keywords):
        return "mbbs"
    elif any(k in name for k in nutrition_keywords):
        return "nutrition"
    elif any(k in name for k in research_keywords):
        return "research"
    else:
        return "general"