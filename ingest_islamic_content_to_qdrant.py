import os, json, uuid
from typing import List, Dict
from pathlib import Path

from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# ========== CONFIG ==========
ISLAMIC_COLLECTION = "islamic_content"
BATCH_SIZE = 128
# ===========================

def create_islamic_content_data():
    """Create sample Islamic content data structure for ingestion"""
    # This would typically come from your existing Supabase export
    # or Islamic text files you want to ingest
    
    islamic_data = [
        # Quran verses example
        {
            "content_type": "quran",
            "text_arabic": "وَبَشِّرِ الصَّابِرِينَ",
            "text_english": "And give good tidings to the patient",
            "reference": "Quran 2:155",
            "chapter": 2,
            "verse": 155,
            "topic_tags": ["patience", "perseverance", "faith"]
        },
        {
            "content_type": "quran", 
            "text_arabic": "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
            "text_english": "Indeed, with hardship comes ease",
            "reference": "Quran 94:6",
            "chapter": 94,
            "verse": 6,
            "topic_tags": ["hardship", "ease", "hope", "comfort"]
        },
        
        # Hadith examples
        {
            "content_type": "hadith",
            "text_arabic": "المسلم من سلم المسلمون من لسانه ويده",
            "text_english": "A Muslim is one from whom other Muslims are safe from his tongue and hand",
            "reference": "Sahih Bukhari 10",
            "source_book": "Sahih Bukhari",
            "grading": "sahih",
            "topic_tags": ["character", "behavior", "speech", "actions"]
        },
        {
            "content_type": "hadith",
            "text_arabic": "إنما الأعمال بالنيات",
            "text_english": "Actions are but by intention",
            "reference": "Sahih Bukhari 1",
            "source_book": "Sahih Bukhari", 
            "grading": "sahih",
            "topic_tags": ["intention", "sincerity", "deeds"]
        },
        
        # Islamic concepts/teachings
        {
            "content_type": "concept",
            "text_english": "Sabr (patience) in Islam encompasses three types: patience in obeying Allah, patience in avoiding sins, and patience during trials and tribulations.",
            "reference": "Islamic Teachings on Patience",
            "topic_tags": ["sabr", "patience", "types", "obedience", "trials"]
        },
        {
            "content_type": "concept",
            "text_english": "The five pillars of Islam are: Shahada (faith), Salah (prayer), Zakat (charity), Sawm (fasting), and Hajj (pilgrimage).",
            "reference": "Five Pillars of Islam",
            "topic_tags": ["pillars", "shahada", "salah", "zakat", "sawm", "hajj"]
        }
    ]
    
    return islamic_data

def prepare_text_for_embedding(item: Dict) -> str:
    """Prepare text for embedding by combining relevant fields"""
    text_parts = []
    
    # Add English text (primary for embedding)
    if item.get("text_english"):
        text_parts.append(item["text_english"])
    
    # Add topic tags for better semantic search
    if item.get("topic_tags"):
        text_parts.append(" ".join(item["topic_tags"]))
    
    # Add context about content type
    text_parts.append(f"This is {item['content_type']} content")
    
    return " ".join(text_parts)

def main():
    print("🚀 Starting Islamic Content Ingestion to Qdrant...")
    
    # 1) Connect to Qdrant
    qdrant = QdrantClient(
        url=os.environ.get("QDRANT_URL"),
        api_key=os.environ.get("QDRANT_APIKEY"),
        prefer_grpc=False,
        timeout=120,
    )

    # 2) Load embedding model (same as documents)
    model_name = "intfloat/multilingual-e5-base"
    model = SentenceTransformer(model_name, trust_remote_code=True)
    vector_dim = model.get_sentence_embedding_dimension()

    # 3) Create/recreate Islamic content collection
    try:
        qdrant.delete_collection(ISLAMIC_COLLECTION)
        print(f"🗑️  Deleted existing '{ISLAMIC_COLLECTION}' collection")
    except Exception:
        print(f"📝 Collection '{ISLAMIC_COLLECTION}' doesn't exist, creating new...")
    
    qdrant.create_collection(
        collection_name=ISLAMIC_COLLECTION,
        vectors_config=VectorParams(size=vector_dim, distance=Distance.COSINE),
    )
    print(f"✅ Created collection '{ISLAMIC_COLLECTION}' with dimension {vector_dim}")

    # 4) Get Islamic content data
    islamic_data = create_islamic_content_data()
    
    # TODO: Replace this with actual data from your Supabase export or text files
    # You can export from Supabase using:
    # SELECT * FROM quran_verses; 
    # SELECT * FROM hadith_collection;
    
    print(f"📚 Processing {len(islamic_data)} Islamic content items...")

    # 5) Process in batches
    points = []
    for i, item in enumerate(islamic_data):
        # Prepare text for embedding
        embedding_text = prepare_text_for_embedding(item)
        
        # Create embedding using e5 format
        passage_text = f"passage: {embedding_text}"
        embedding = model.encode([passage_text], normalize_embeddings=True)[0]
        
        # Create payload with all metadata
        payload = {
            "content_type": item["content_type"],
            "text_english": item.get("text_english", ""),
            "text_arabic": item.get("text_arabic", ""),
            "reference": item["reference"],
            "topic_tags": item.get("topic_tags", []),
            "source_book": item.get("source_book"),
            "grading": item.get("grading"),
            "chapter": item.get("chapter"),
            "verse": item.get("verse"),
        }
        
        # Remove None values
        payload = {k: v for k, v in payload.items() if v is not None}
        
        points.append(
            PointStruct(
                id=str(uuid.uuid4()),
                vector=embedding.tolist(),
                payload=payload
            )
        )
        
        # Upsert in batches
        if len(points) >= BATCH_SIZE or i == len(islamic_data) - 1:
            qdrant.upsert(collection_name=ISLAMIC_COLLECTION, points=points)
            print(f"✅ Upserted batch of {len(points)} items")
            points = []

    print(f"🎉 Successfully ingested {len(islamic_data)} Islamic content items into '{ISLAMIC_COLLECTION}'!")
    
    # 6) Test search
    print("\n🔍 Testing search functionality...")
    test_query = "What does Islam say about patience?"
    query_embedding = model.encode([f"query: {test_query}"], normalize_embeddings=True)[0]
    
    search_results = qdrant.search(
        collection_name=ISLAMIC_COLLECTION,
        query_vector=query_embedding.tolist(),
        limit=3,
        score_threshold=0.5
    )
    
    print(f"\nTest query: '{test_query}'")
    print(f"Found {len(search_results)} results:")
    for i, hit in enumerate(search_results, 1):
        print(f"{i}. Score: {hit.score:.3f}")
        print(f"   Type: {hit.payload['content_type']}")
        print(f"   Text: {hit.payload.get('text_english', '')[:100]}...")
        print(f"   Reference: {hit.payload['reference']}")
        print()

if __name__ == "__main__":
    main()