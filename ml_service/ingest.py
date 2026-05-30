import os, sys
sys.path.insert(0, os.path.dirname(__file__))

from processors.document_processor import ingest_folder
from processors.csv_processor import ingest_csv_folder
from models.embeddings import chunk_documents, embed_and_store, get_model, get_collection
import logging

logging.basicConfig(level=logging.INFO)

BASE_DIR        = os.path.dirname(__file__)
PDF_FOLDER      = os.path.join(BASE_DIR, 'data', 'pdfs')
CSV_FOLDER      = os.path.join(BASE_DIR, 'data', 'csvs')
INSIGHTS_FOLDER = os.path.join(BASE_DIR, 'data', 'insights')

if __name__ == "__main__":
    print("=" * 50)
    print("MATRNY — Knowledge Base Builder")
    print("=" * 50)

    all_documents = []

    # ── PDFs ──────────────────────────────────────────
    print("\n📄 Processing PDFs...")
    pdf_docs = ingest_folder(PDF_FOLDER)
    if not pdf_docs:
        print("No PDFs found. Check your PDF folder path.")
        sys.exit(1)
    print(f"   PDFs processed: {len(pdf_docs)}")
    all_documents.extend(pdf_docs)

    # ── Insight text files (from DHS processing) ──────
    print("\n📝 Processing insight text files...")
    insight_docs = ingest_folder(INSIGHTS_FOLDER)
    print(f"   Insight files processed: {len(insight_docs)}")
    all_documents.extend(insight_docs)

    # ── Chunk + store PDFs and insight text files ─────
    if all_documents:
        print("\n💾 Chunking and storing documents...")
        chunks = chunk_documents(all_documents)
        embed_and_store(chunks)

    # ── CSVs (stored directly, no chunking needed) ────
    print("\n📊 Processing CSVs...")
    csv_insights = ingest_csv_folder(CSV_FOLDER)
    print(f"   CSV insights generated: {len(csv_insights)}")

    if csv_insights:
        print("\n💾 Storing CSV insights...")
        model      = get_model()
        collection = get_collection()
        stored = 0
        for i in range(0, len(csv_insights), 32):
            batch      = csv_insights[i:i+32]
            texts      = [c["text"] for c in batch]
            metadatas  = [{"source": c["source"],
                           "category": c["category"],
                           "chunk_id": i+j}
                          for j, c in enumerate(batch)]
            ids        = [f"csv_chunk_{i+j}" for j in range(len(batch))]
            embeddings = model.encode(texts).tolist()
            collection.add(
                documents=texts,
                embeddings=embeddings,
                metadatas=metadatas,
                ids=ids
            )
            stored += len(batch)
        print(f"   CSV chunks stored: {stored}")

    # ── Summary ───────────────────────────────────────
    collection = get_collection()
    print("\n" + "=" * 50)
    print("✓ Knowledge base built successfully!")
    print(f"  PDFs processed     : {len(pdf_docs)}")
    print(f"  Insight files      : {len(insight_docs)}")
    print(f"  CSV insights       : {len(csv_insights)}")
    print(f"  Total chunks in DB : {collection.count()}")
    print("=" * 50)
    print("\nYou can now start main.py")