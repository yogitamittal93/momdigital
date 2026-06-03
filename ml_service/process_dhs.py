"""
Run this ONCE per DHS file to convert raw .DTA data
into insight text files that go into your RAG.

Usage:
  python process_dhs.py path/to/IAPR74FL.DTA
  python process_dhs.py path/to/IAIR7EDT.DTA
  python process_dhs.py path/to/IAKR7EDT.DTA
  python process_dhs.py path/to/IABR7EDT.DTA
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from processors.dhs_processor import process_dhs_to_insights

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python process_dhs.py path/to/FILE.DTA")
        sys.exit(1)

    dta_path      = sys.argv[1]
    output_folder = os.path.join(os.path.dirname(__file__), 'data', 'insights')

    print(f"Processing: {dta_path}")
    out_path = process_dhs_to_insights(dta_path, output_folder)
    print(f"Done. Insights saved to: {out_path}")
    print("\nNow re-run ingest.py to add these insights to ChromaDB.")