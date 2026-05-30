from processors.ner_extractor import extract_entities

texts = [
    "i am yogita, 20 weeks pregnant",
    "Yogita here",
    "My name is Yogita",
    "hi"
]

for t in texts:
    print(f"Text: {t}")
    print(f"Extracted: {extract_entities(t)}")
    print("-" * 20)
