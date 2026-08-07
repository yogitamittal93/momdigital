import spacy
import re

nlp = spacy.load("en_core_web_sm")

def clean_number(text):
    # Extracts just the digits: "65 kg" -> 65
    nums = re.findall(r'\d+', text)
    return int(nums[0]) if nums else None

def extract_entities(text):
    doc = nlp(text)
    
    # We map these to your Prisma 'context' JSON keys
    extracted_data = {
        "weight": None,
        "height": None,
        "pregnancyWeek": None,
        "babyAgeMonths": None,
        "conditions": [],
        "name": None
    }

    # Regex for Height (e.g., 160cm or 5'4)
    height_match = re.search(r'(\d{1,3}\s?cm|\d{1}\'\d{1,2})', text.lower())
    if height_match:
        extracted_data["height"] = height_match.group(1)

    # 1. Regex Fallback for Name (e.g., "i am yogita", "my name is yogita")
    name_patterns = [
        r"(?:i am|my name is|call me|i'm)\s+([a-z]+)"
    ]
    for pattern in name_patterns:
        match = re.search(pattern, text.lower())
        if match and not extracted_data["name"]:
            extracted_data["name"] = match.group(1).capitalize()
            break

    for ent in doc.ents:
        if ent.label_ == "PERSON" and not extracted_data["name"]:
            extracted_data["name"] = ent.text
        
        text_lower = ent.text.lower()
        
        # Extract Weight
        if ent.label_ in ["QUANTITY", "CARDINAL"] and ("kg" in text_lower or "kilo" in text_lower):
            extracted_data["weight"] = ent.text
            
        # Extract Pregnancy Week or Baby Age
        # Scope the digit search to the entity text only (not the whole sentence)
        # to avoid grabbing an unrelated number from the surrounding context.
        if ent.label_ == "DATE":
            ent_nums = re.findall(r'\d+', ent.text)
            if not ent_nums:
                pass  # DATE entity with no digits — skip
            elif "month" in text_lower:
                # Baby age in months — clear pregnancyWeek so the two signals
                # don't coexist from NER alone.  The service layer handles the
                # 'pregnant again with older child' case via profile dates.
                extracted_data["babyAgeMonths"] = ent_nums[0]
                extracted_data["pregnancyWeek"] = None
            elif "week" in text_lower and not extracted_data["babyAgeMonths"]:
                # Only set pregnancyWeek when we haven't already found a baby age
                extracted_data["pregnancyWeek"] = ent_nums[0]

    # Medical Issues (MBBS/Ayurveda context)
    medical_keywords = ["diabetes", "thyroid", "anemia", "bp", "sugar", "pcos"]
    for token in doc:
        if token.text.lower() in medical_keywords:
            extracted_data["conditions"].append(token.text.lower())

    # Inside your extract_entities function:
    extracted_data["weight_value"] = clean_number(extracted_data["weight"]) if extracted_data["weight"] else None
    
    # Height Value extraction
    if extracted_data["height"]:
        # Handle "160cm" or "160 cm"
        cm_match = re.search(r'(\d+)\s*cm', extracted_data["height"].lower())
        if cm_match:
            extracted_data["height_value"] = int(cm_match.group(1))
        else:
            # Handle feet/inches like 5'4
            feet_match = re.search(r"(\d+)'(\d+)?", extracted_data["height"])
            if feet_match:
                feet = int(feet_match.group(1))
                inches = int(feet_match.group(2)) if feet_match.group(2) else 0
                extracted_data["height_value"] = int((feet * 30.48) + (inches * 2.54))

    return extracted_data