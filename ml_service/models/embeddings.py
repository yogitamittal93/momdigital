from sentence_transformers import SentenceTransformer
import chromadb
from langchain_text_splitters import RecursiveCharacterTextSplitter
import logging
import os

logger = logging.getLogger(__name__)

_model = None
_collection = None

# matrny_db/ always lives next to this file, inside ml_service/
_ML_SERVICE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_DB_PATH = os.path.normpath(os.path.join(_ML_SERVICE_DIR, "matrny_db"))

# Set this in your .env — format: "your-hf-username/matrny-db"
_HF_REPO_ID = os.getenv("HF_REPO_ID", "")
_HF_TOKEN   = os.getenv("HF_TOKEN", "")
_HF_DOWNLOAD_MAX_WORKERS = max(1, int(os.getenv("HF_DOWNLOAD_MAX_WORKERS", "1")))


def _ensure_db_downloaded():
    """
    If matrny_db/ doesn't exist locally (fresh clone, Docker container,
    new server), download it from Hugging Face Hub before starting.
    Skipped entirely if HF_REPO_ID is not set — assumes local DB exists.
    """
    if not _HF_REPO_ID:
        return  # running locally with a pre-existing DB — nothing to do

    chroma_marker = os.path.join(_DB_PATH, "chroma.sqlite3")
    if os.path.exists(chroma_marker):
        logger.info("✓ matrny_db/ already present — skipping download")
        return

    logger.info(
        "matrny_db/ not found locally. Downloading from Hugging Face: %s",
        _HF_REPO_ID,
    )

    try:
        from huggingface_hub import snapshot_download
        snapshot_download(
            repo_id=_HF_REPO_ID,
            repo_type="dataset",
            local_dir=_DB_PATH,
            token=_HF_TOKEN or None,  # None = use cached login if available
            ignore_patterns=["*.md", ".gitattributes", "*.pdf"],
            max_workers=_HF_DOWNLOAD_MAX_WORKERS,
        )
        logger.info("✓ matrny_db/ downloaded successfully to %s", _DB_PATH)
    except Exception as e:
        logger.error(
            "Failed to download matrny_db/ from Hugging Face: %s\n"
            "The service will start with an empty ChromaDB. "
            "Run `python ingest.py` to build the knowledge base.",
            e,
        )
        # DO NOT raise — let the service start with empty DB.
        # Health endpoint returns 200 with degraded status (handled in main.py).


def get_model():
    global _model
    if _model is None:
        logger.info("Loading embedding model...")
        _model = SentenceTransformer('all-MiniLM-L6-v2')
        logger.info("✓ Embedding model loaded")
    return _model


def get_collection():
    global _collection
    if _collection is None:
        _ensure_db_downloaded()
        logger.info("Opening ChromaDB at: %s", _DB_PATH)
        client = chromadb.PersistentClient(path=_DB_PATH)
        _collection = client.get_or_create_collection(
            name="matrny_knowledge",
            metadata={"hnsw:space": "cosine"}
        )
        count = _collection.count()
        if count == 0:
            logger.warning(
                "⚠️  ChromaDB is EMPTY. "
                "Run `python ingest.py` from ml_service/ to build the knowledge base."
            )
        else:
            logger.info("✓ ChromaDB ready — %d chunks indexed", count)
    return _collection


def chunk_documents(documents: list) -> list:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=512,
        chunk_overlap=50,
        separators=["\n\n", "\n", ". ", " "]
    )
    all_chunks = []
    for doc in documents:
        chunks = splitter.split_text(doc["text"])
        for i, chunk in enumerate(chunks):
            if len(chunk.strip()) > 50:
                all_chunks.append({
                    "text": chunk,
                    "metadata": {
                        "source": doc["source"],
                        "category": doc["category"],
                        "chunk_id": i
                    }
                })
    logger.info("Total chunks created: %d", len(all_chunks))
    return all_chunks


def embed_and_store(chunks: list):
    model = get_model()
    collection = get_collection()
    stored = 0
    for i in range(0, len(chunks), 32):
        batch      = chunks[i:i+32]
        texts      = [c["text"] for c in batch]
        metadatas  = [c["metadata"] for c in batch]
        ids        = [f"chunk_{i+j}" for j in range(len(batch))]
        embeddings = model.encode(texts).tolist()
        collection.add(
            documents=texts,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids
        )
        stored += len(batch)
        logger.info("Stored %d/%d chunks...", stored, len(chunks))
    logger.info("✓ All chunks stored in ChromaDB")
