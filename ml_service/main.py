from flask_cors import CORS
from flask import Flask, request, jsonify, send_from_directory
from processors.ner_extractor import extract_entities
from processors.response_generator import (
    generate_response,
    check_emergency,
    EMERGENCY_RESPONSE,
)
from models.embeddings import get_collection
import logging
import time
from collections import defaultdict
app = Flask(__name__)  # ← app defined FIRST
CORS(app)

@app.route('/')        # ← route defined AFTER app
def demo():
    return send_from_directory('.', 'demo.html')
#app = Flask(__name__)
#CORS(app, origins=[
 #   "http://localhost:3000",
  #  "http://localhost:3001",
#])

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# Simple in-memory rate limiter: 20 requests per minute per IP
_rate_limit_store: dict[str, list[float]] = defaultdict(list)
RATE_LIMIT = 20
RATE_WINDOW_SEC = 60


def _check_rate_limit(client_ip: str) -> bool:
    now = time.time()
    window_start = now - RATE_WINDOW_SEC
    timestamps = [t for t in _rate_limit_store[client_ip] if t > window_start]
    if len(timestamps) >= RATE_LIMIT:
        return False
    timestamps.append(now)
    _rate_limit_store[client_ip] = timestamps
    return True


@app.before_request
def log_request():
    request.start_time = time.time()


@app.after_request
def log_response(response):
    duration = round((time.time() - request.start_time) * 1000)
    logger.info(
        "%s %s → %s (%sms)",
        request.method,
        request.path,
        response.status_code,
        duration,
    )
    return response


@app.route("/extract", methods=["POST"])
def extract():
    try:
        data = request.get_json()
        if not data or not data.get("text"):
            return jsonify({"error": "No text provided"}), 400
        results = extract_entities(data["text"])
        return jsonify(results)
    except Exception as e:
        logger.error("Extract error: %s", e)
        return jsonify({"error": "Internal server error"}), 500


@app.route("/query", methods=["POST"])
def query():
    try:
        client_ip = request.remote_addr or "unknown"
        if not _check_rate_limit(client_ip):
            return jsonify({
                "error": "Rate limit exceeded. Please wait before sending more questions.",
                "confidence": "requires_doctor",
            }), 429

        data = request.get_json()
        if not data or not data.get("question"):
            return jsonify({"error": "No question provided"}), 400

        question = data["question"].strip()
        category = data.get("category", "general")
        ner_context = data.get("nerContext", {})

        if check_emergency(question):
            logger.warning("EMERGENCY detected in query: %s...", question[:50])
            return jsonify(EMERGENCY_RESPONSE)

        if len(question) > 1000:
            question = question[:1000]
        if len(question) < 3:
            return jsonify({"error": "Question too short"}), 400

        result = generate_response(question, category, ner_context)
        return jsonify(result)

    except Exception as e:
        logger.error("Query error: %s", e)
        return jsonify({
            "answer": (
                "I'm having technical difficulties right now. "
                "Please try again in a moment, or consult your doctor directly. "
                "NHM Helpline: 104"
            ),
            "sources": [],
            "confidence": "requires_doctor",
            "error": True,
        }), 500


@app.route("/health", methods=["GET"])
def health():
    try:
        collection = get_collection()
        return jsonify({
            "status": "ok",
            "chunks_indexed": collection.count(),
            "version": "1.0.0",
        })
    except Exception as e:
        return jsonify({"status": "degraded", "error": str(e)}), 503


@app.route("/approved-answer", methods=["POST"])
def check_approved():
    try:
        data = request.get_json() or {}
        question = data.get("question", "").strip()
        if not question:
            return jsonify({"found": False})
        return jsonify({"found": False, "message": "No approved answer cached"})
    except Exception as e:
        return jsonify({"found": False, "error": str(e)})


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
