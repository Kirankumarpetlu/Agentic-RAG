"""
server.py – FastAPI backend that wires the full RAG pipeline.

Endpoints:
    POST /api/upload   — accept a file (PDF, CSV, JSON, TXT, DOCX), ingest into FAISS
    POST /api/query    — run planner → retriever → tool_executor → reasoner
"""

import os
import sys
import json
import tempfile
import traceback
from concurrent.futures import ThreadPoolExecutor

# Load .env file before anything else
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ── Ensure project root is on sys.path ──
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# ── App Setup ──
app = FastAPI(title="RAG API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Root endpoint ──
@app.get("/")
def root():
    return {"message": "Agentic RAG API is running successfully 🚀"}

# ── Shared State ──
_faiss_store = None
uploaded_files: list[str] = []
csv_dataframes: dict = {}  # filename → pd.DataFrame

# Thread pool for running sync functions that use asyncio.run() internally
_executor = ThreadPoolExecutor(max_workers=4)


def get_store():
    """Lazy-load the FAISS store."""
    global _faiss_store
    if _faiss_store is None:
        from vector_store.faiss_store import FAISSStore
        _faiss_store = FAISSStore(dimension=384)
    return _faiss_store


# ── Request / Response Models ──
class QueryRequest(BaseModel):
    question: str


class QueryResponse(BaseModel):
    answer: str
    sources: list[str]
    confidence: float


# ── Upload Endpoint ──
@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """Accept a file, parse → chunk → embed → store in FAISS."""

    suffix = os.path.splitext(file.filename or "")[1]
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    try:
        content = await file.read()
        tmp.write(content)
        tmp.close()
        tmp_path = tmp.name

        from ingestion.file_router import route_file
        from ingestion.pdf_parser import parse_pdf
        from ingestion.csv_parser import parse_csv
        from ingestion.json_parser import parse_json
        from ingestion.chunker import chunk_text
        from ingestion.embedder import embed_chunks

        # Route file type
        ext = route_file(file.filename)

        # Parse
        text = ""
        df = None

        if ext == "pdf":
            text = parse_pdf(tmp_path)
        elif ext == "csv":
            text, df = parse_csv(tmp_path)
            csv_dataframes[file.filename] = df
        elif ext == "json":
            text, _ = parse_json(tmp_path)
        elif ext in ("txt", "docx"):
            with open(tmp_path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")

        if not text.strip():
            raise HTTPException(status_code=400, detail="No text could be extracted from file.")

        # Chunk — returns list[dict] with "text" and "metadata" keys
        chunks = chunk_text(text)

        # Embed — accepts list[dict] with "text" key
        embeddings = embed_chunks(chunks)

        # Store
        faiss_store = get_store()
        # Add source filename to each chunk's metadata before storing
        for chunk in chunks:
            chunk.setdefault("metadata", {})
            chunk["metadata"]["source"] = file.filename
        faiss_store.add(embeddings, chunks)

        uploaded_files.append(file.filename)

        return {
            "status": "success",
            "filename": file.filename,
            "chunks_added": len(chunks),
            "total_chunks": faiss_store.count(),
        }

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(tmp.name):
            os.unlink(tmp.name)


def _format_answer(answer) -> str:
    """Convert a potentially structured answer (dict/list) into readable markdown."""
    if isinstance(answer, str):
        return answer

    if isinstance(answer, dict):
        parts = []

        # Handle summary + details pattern
        if "summary" in answer:
            parts.append(str(answer["summary"]))

        if "details" in answer and isinstance(answer["details"], list):
            parts.append("")
            for item in answer["details"]:
                if isinstance(item, dict):
                    # Look for common key patterns
                    title = item.get("project") or item.get("title") or item.get("name") or item.get("key", "")
                    desc = item.get("description") or item.get("value") or item.get("detail") or item.get("text", "")
                    if title:
                        parts.append(f"**{title}**")
                    if desc:
                        parts.append(f"  {desc}")
                    parts.append("")
                else:
                    parts.append(f"- {item}")
        else:
            # Generic dict — format all key-value pairs
            for key, value in answer.items():
                if key == "summary":
                    continue
                if isinstance(value, list):
                    parts.append(f"\n**{key.replace('_', ' ').title()}:**")
                    for v in value:
                        parts.append(f"- {v}")
                else:
                    parts.append(f"**{key.replace('_', ' ').title()}:** {value}")

        return "\n".join(parts).strip() if parts else str(answer)

    if isinstance(answer, list):
        return "\n".join(f"- {item}" for item in answer)

    return str(answer)


def _run_query_pipeline(question: str) -> dict:
    """
    Run the full RAG pipeline synchronously in a separate thread.
    This avoids the asyncio.run() conflict with FastAPI's event loop.
    """
    from agents.planner import plan_query
    from agents.retriever import retrieve
    from agents.tool_executor import execute as tool_execute
    from agents.reasoner import reason

    store = get_store()

    # 1. Plan
    plan = plan_query(question)

    # 2. Retrieve
    results = retrieve(question, store, top_k=5)
    chunks_text = "\n\n---\n\n".join(r["text"] for r in results)
    sources = list(set(r["metadata"].get("source", "unknown") for r in results))

    # 3. Tool execution (if numeric analysis needed + CSV data available)
    metrics = None
    if plan.get("needs_numeric") and csv_dataframes:
        try:
            first_df_name = list(csv_dataframes.keys())[0]
            df = csv_dataframes[first_df_name]
            numeric_cols = df.select_dtypes(include=["number"]).columns.tolist()
            if numeric_cols:
                metrics = []
                for col in numeric_cols[:3]:
                    try:
                        metrics.append(tool_execute(df, "average", col))
                        metrics.append(tool_execute(df, "sum", col))
                    except Exception:
                        pass
        except Exception:
            pass

    # 4. Reason
    result = reason(question, chunks_text, metrics)

    # Map confidence string to number
    conf_map = {"high": 0.92, "medium": 0.65, "low": 0.35}
    confidence_raw = result.get("confidence", "medium")
    if isinstance(confidence_raw, str):
        confidence = conf_map.get(confidence_raw.lower(), 0.5)
    else:
        try:
            confidence = float(confidence_raw)
        except (ValueError, TypeError):
            confidence = 0.5

    # Ensure answer is a clean readable string
    answer = result.get("answer", "No answer generated.")
    answer = _format_answer(answer)

    return {
        "answer": answer,
        "sources": [str(s) for s in sources],
        "confidence": confidence,
    }


# ── Query Endpoint ──
@app.post("/api/query", response_model=QueryResponse)
async def query_documents(req: QueryRequest):
    """Run the full RAG pipeline: plan → retrieve → (optional tools) → reason."""

    store = get_store()

    if store.count() == 0:
        return QueryResponse(
            answer="No documents have been uploaded yet. Please upload a document first using the + button.",
            sources=[],
            confidence=0.0,
        )

    try:
        import asyncio
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(_executor, _run_query_pipeline, req.question)
        return QueryResponse(**result)

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ── Health Check ──
@app.get("/api/health")
async def health_check():
    store = get_store()
    return {
        "status": "ok",
        "uploaded_files": uploaded_files,
        "total_chunks": store.count(),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
