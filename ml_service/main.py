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
import threading
from collections import defaultdict
app = Flask(__name__)  # ← app defined FIRST
CORS(app)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

_bootstrap_state = {
    "phase": "starting",
    "ready": False,
    "chunks_indexed": 0,
    "error": None,
    "last_updated": time.time(),
}
_bootstrap_lock = threading.Lock()


def _set_bootstrap_state(**updates):
    with _bootstrap_lock:
        _bootstrap_state.update(updates)
        _bootstrap_state["last_updated"] = time.time()


def _snapshot_bootstrap_state():
    with _bootstrap_lock:
        return dict(_bootstrap_state)


def _warmup_chromadb():
    _set_bootstrap_state(phase="loading", ready=False, error=None)
    try:
        collection = get_collection()
        count = collection.count()
        _set_bootstrap_state(phase="ready", ready=count > 0, chunks_indexed=count)
        if count == 0:
            logger.warning("Warmup completed but ChromaDB is empty")
        else:
            logger.info("Warmup completed with %d chunks indexed", count)
    except Exception as e:
        logger.exception("Warmup failed: %s", e)
        _set_bootstrap_state(
            phase="error",
            ready=False,
            chunks_indexed=0,
            error=str(e),
        )


def _start_warmup():
    thread = threading.Thread(target=_warmup_chromadb, daemon=True)
    thread.start()
    return thread


_start_warmup()


@app.route('/')
def root():
    state = _snapshot_bootstrap_state()
    return jsonify({
        "service": "momdigital-ml",
        "status": "ok" if state["ready"] else state["phase"],
        "chunks_indexed": state["chunks_indexed"],
        "message": "Use /health for readiness and /query for chat requests.",
    }), 200

# Simple in-memory rate limiter: 60 requests per minute per user/IP
_rate_limit_store: dict[str, list[float]] = defaultdict(list)
RATE_LIMIT = 60
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
        data = request.get_json()
        if not data or not data.get("question"):
            return jsonify({"error": "No question provided"}), 400

        client_ip = request.remote_addr or "unknown"
        user_id = data.get("userId") or data.get("user_id") or client_ip

        if not _check_rate_limit(user_id):
            return jsonify({
                "error": "Rate limit exceeded. Please wait before sending more questions.",
                "confidence": "requires_doctor",
            }), 429

        question = data["question"].strip()
        category = data.get("category", "general")
        ner_context = data.get("nerContext", {})
        conversation_history = data.get("conversationHistory", [])
        user_id = data.get("userId", "anonymous")

        if check_emergency(question):
            logger.warning("EMERGENCY detected in query: %s...", question[:50])
            return jsonify(EMERGENCY_RESPONSE)

        if len(question) > 1000:
            question = question[:1000]
        if len(question) < 3:
            return jsonify({"error": "Question too short"}), 400

        result = generate_response(question, category, ner_context, user_id, conversation_history)
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
    state = _snapshot_bootstrap_state()
    is_ready = state["ready"]
    http_status = 200 if is_ready else 503
    return jsonify({
        "status": "ok" if is_ready else "degraded",
        "phase": state["phase"],
        "chunks_indexed": state["chunks_indexed"],
        "chroma_ready": is_ready,
        "chroma_error": state["error"],
        "version": "1.0.0"
    }), http_status


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
    app.run(host="0.0.0.0", port=5000, debug=False)
