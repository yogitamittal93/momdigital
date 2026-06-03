import requests

BASE = "http://127.0.0.1:5000"

# Test 1 — existing NER route (should still work)
print("--- Test 1: NER Extract ---")
r = requests.post(f"{BASE}/extract", json={"text": "I am 20 weeks pregnant"}, timeout=10)
print(f"Status: {r.status_code}")
print(f"Response: {r.json()}\n")

# Test 2 — health check
print("--- Test 2: Health Check ---")
r = requests.get(f"{BASE}/health", timeout=10)
print(f"Status: {r.status_code}")
print(f"Response: {r.json()}\n")

# Test 3 — RAG query
print("--- Test 3: RAG Query ---")
r = requests.post(f"{BASE}/query", json={
    "question": "What foods should I eat in the third trimester?",
    "category": "nutrition"
}, timeout=30)
print(f"Status: {r.status_code}")
data = r.json()
print(f"Confidence: {data.get('confidence')}")
print(f"Sources: {data.get('sources')}")
print(f"Answer:\n{data.get('answer')}")