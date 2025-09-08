import os
from typing import List, Dict
from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer

COLLECTION = "documents_pdf_texts"

def query_documents(query: str, limit: int = 5, score_threshold: float = 0.5) -> List[Dict]:
    """Query the Qdrant collection for relevant documents."""
    
    # Connect to Qdrant Cloud
    qdrant = QdrantClient(
        url=os.environ.get("QDRANT_URL"),
        api_key=os.environ.get("QDRANT_APIKEY"),
        prefer_grpc=False,
        timeout=120,
    )
    
    # Load the same embedding model used for ingestion
    model = SentenceTransformer("intfloat/multilingual-e5-base", trust_remote_code=True)
    
    # Encode query with e5 convention
    query_vector = model.encode([f"query: {query}"], normalize_embeddings=True)[0].tolist()
    
    # Search
    hits = qdrant.search(
        collection_name=COLLECTION,
        query_vector=query_vector,
        limit=limit,
        score_threshold=score_threshold
    )
    
    results = []
    for hit in hits:
        result = {
            "text": hit.payload["text"],
            "source": hit.payload["source"],
            "score": hit.score,
            "lang": hit.payload.get("lang", "unknown"),
            "file_ext": hit.payload.get("file_ext", ""),
        }
        if "page" in hit.payload:
            result["page"] = hit.payload["page"]
        results.append(result)
    
    return results

def main():
    """Interactive query interface."""
    print("Qdrant Document Query Interface")
    print("Type 'quit' to exit\n")
    
    while True:
        query = input("Enter your query: ").strip()
        if query.lower() in ['quit', 'exit', 'q']:
            break
        
        if not query:
            continue
        
        try:
            results = query_documents(query)
            
            if not results:
                print("No results found.\n")
                continue
            
            print(f"\nFound {len(results)} results:")
            print("-" * 60)
            
            for i, result in enumerate(results, 1):
                print(f"{i}. Score: {result['score']:.3f}")
                print(f"   Source: {result['source']}")
                if 'page' in result:
                    print(f"   Page: {result['page']}")
                print(f"   Language: {result['lang']}")
                print(f"   Text: {result['text'][:200]}...")
                print()
                
        except Exception as e:
            print(f"Error: {e}\n")

if __name__ == "__main__":
    main()