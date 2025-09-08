# Qdrant Document Ingestion System

This system ingests documents (PDFs, text files, XML, SQL) into Qdrant Cloud with multilingual embedding support.

## Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Configure environment variables:
   ```bash
   # Copy the example file
   cp .env.example .env
   
   # Edit .env with your Qdrant Cloud credentials
   QDRANT_URL=https://<your-cluster-id>.<region>.aws.cloud.qdrant.io:6333
   QDRANT_APIKEY=<your_api_key_or_token>
   ```

3. For Windows PowerShell:
   ```powershell
   $env:QDRANT_URL = "https://<your-cluster-id>.<region>.aws.cloud.qdrant.io:6333"
   $env:QDRANT_APIKEY = "<your_api_key_or_token>"
   ```

## Usage

### Ingest Documents

```bash
python ingest_folder_to_qdrant.py --folder "path/to/your/documents"
```

Example:
```bash
python ingest_folder_to_qdrant.py --folder "E:\AETHON\quran-and-texts"
```

### Query Documents

```bash
python query_qdrant.py
```

This opens an interactive interface where you can search your documents.

## Supported File Types

- `.pdf` - Extracted page by page
- `.txt` - Plain text files
- `.md` - Markdown files
- `.xml` - XML files
- `.sql` - SQL files

## Configuration

Edit the config section in `ingest_folder_to_qdrant.py`:

- `COLLECTION`: Qdrant collection name (default: "documents_pdf_texts")
- `CHUNK_TOKENS`: Words per chunk (default: 500)
- `CHUNK_OVERLAP`: Overlap between chunks (default: 60)
- `BATCH_SIZE`: Embedding batch size (default: 128)

## Embedding Model

Uses `intfloat/multilingual-e5-base` for multilingual support (Arabic, Bangla, English, etc.)