import os, re, math, uuid, json
from pathlib import Path
from typing import List, Dict

import fitz  # PyMuPDF
from tqdm import tqdm
from langdetect import detect, DetectorFactory
DetectorFactory.seed = 0

from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# ========== CONFIG ==========
COLLECTION = "documents_pdf_texts"
CHUNK_TOKENS   = 500      # ~approx by words here; good enough
CHUNK_OVERLAP  = 60
BATCH_SIZE     = 128
ACCEPT_EXTS    = {".pdf", ".txt", ".md", ".xml", ".sql"}
# ===========================

def read_text_from_pdf(path: Path) -> List[Dict]:
    """Return list of {text, page} for each page."""
    doc = fitz.open(str(path))
    pages = []
    for i, page in enumerate(doc):
        txt = page.get_text("text")
        if txt and txt.strip():
            pages.append({"text": txt, "page": i+1})
    doc.close()
    return pages

def read_text_simple(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")

def normalize_ws(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()

def chunk_text(s: str, chunk_words=CHUNK_TOKENS, overlap=CHUNK_OVERLAP) -> List[str]:
    words = s.split()
    if not words:
        return []
    chunks = []
    i = 0
    while i < len(words):
        chunk = words[i:i+chunk_words]
        if not chunk:
            break
        chunks.append(" ".join(chunk))
        i += chunk_words - overlap
    return chunks

def detect_lang_safe(s: str) -> str:
    try:
        return detect(s)
    except Exception:
        return "unknown"

def iter_files(folder: Path):
    for p in folder.rglob("*"):
        if p.is_file() and p.suffix.lower() in ACCEPT_EXTS:
            yield p

def main(input_folder: str):
    # 1) Connect Qdrant
    qdrant = QdrantClient(
        url=os.environ.get("QDRANT_URL"),
        api_key=os.environ.get("QDRANT_APIKEY"),
        prefer_grpc=False,  # HTTP is fine here
        timeout=120,
    )

    # 2) Load embedding model (multilingual)
    model_name = "intfloat/multilingual-e5-base"
    model = SentenceTransformer(model_name, trust_remote_code=True)
    vector_dim = model.get_sentence_embedding_dimension()

    # 3) Ensure collection exists
    if COLLECTION not in [c.name for c in qdrant.get_collections().collections]:
        qdrant.recreate_collection(
            collection_name=COLLECTION,
            vectors_config=VectorParams(size=vector_dim, distance=Distance.COSINE),
        )

    # 4) Walk folder, extract + chunk
    folder = Path(input_folder)
    all_points: List[PointStruct] = []
    total_chunks = 0

    files = list(iter_files(folder))
    print(f"Found {len(files)} files")

    for f in tqdm(files, desc="Processing files"):
        source = str(f.relative_to(folder))
        ext = f.suffix.lower()

        records = []  # list of (text, metadata)
        if ext == ".pdf":
            for page in read_text_from_pdf(f):
                text = normalize_ws(page["text"])
                for ch in chunk_text(text):
                    records.append((ch, {"page": page["page"]}))
        else:
            text = normalize_ws(read_text_simple(f))
            for ch in chunk_text(text):
                records.append((ch, {}))

        if not records:
            continue

        # 5) Embed in batches and upsert
        for i in range(0, len(records), BATCH_SIZE):
            batch = records[i:i+BATCH_SIZE]
            texts = [b[0] for b in batch]
            # e5 expects "query: ..." / "passage: ..." convention; for indexing use "passage: "
            passages = [f"passage: {t}" for t in texts]
            vecs = model.encode(passages, normalize_embeddings=True, show_progress_bar=False)

            points = []
            for vec, (txt, meta) in zip(vecs, batch):
                payload = {
                    "text": txt,
                    "source": source,
                    "file_ext": ext,
                    "lang": detect_lang_safe(txt),
                }
                payload.update(meta)
                points.append(
                    PointStruct(
                        id=str(uuid.uuid4()),
                        vector=vec.tolist(),
                        payload=payload,
                    )
                )

            qdrant.upsert(collection_name=COLLECTION, points=points)
            total_chunks += len(points)

    print(f"✅ Done. Upserted {total_chunks} chunks into '{COLLECTION}'.")

if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser(description="Ingest a folder of PDFs/TXT/XML/SQL into Qdrant.")
    ap.add_argument("--folder", required=True, help="Path to the folder (e.g., E:\\AETHON\\quran)")
    args = ap.parse_args()
    main(args.folder)