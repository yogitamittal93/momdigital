from sentence_transformers import SentenceTransformer
import chromadb
from langchain_text_splitters import RecursiveCharacterTextSplitter
import logging

logger = logging.getLogger(__name__)

_model = None
_collection = None

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
        client = chromadb.PersistentClient(path="./matrny_db")
        _collection = client.get_or_create_collection(
            name="matrny_knowledge",
            metadata={"hnsw:space": "cosine"}
        )
        logger.info(f"✓ ChromaDB loaded — {_collection.count()} chunks indexed")
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
    logger.info(f"Total chunks created: {len(all_chunks)}")
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
        logger.info(f"Stored {stored}/{len(chunks)} chunks...")
    logger.info("✓ All chunks stored in ChromaDB")