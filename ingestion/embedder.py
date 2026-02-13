"""
embedder.py – Generates embeddings for text chunks using sentence-transformers.
"""

import numpy as np
from sentence_transformers import SentenceTransformer

MODEL_NAME = "all-MiniLM-L6-v2"

_model: SentenceTransformer | None = None


def _load_model() -> SentenceTransformer:
    """Lazy-load the sentence-transformers model (singleton)."""
    global _model
    if _model is None:
        _model = SentenceTransformer(MODEL_NAME)
    return _model


def embed_chunks(chunks: list[dict]) -> np.ndarray:
    """
    Generate embeddings for a list of chunk dicts.

    Args:
        chunks: List of chunk dicts, each containing a "text" key.

    Returns:
        A numpy array of shape (n_chunks, embedding_dim) with
        the embedding vectors.

    Raises:
        ValueError: If chunks list is empty or missing "text" keys.
    """
    if not chunks:
        raise ValueError("Chunks list is empty.")

    texts = []
    for i, chunk in enumerate(chunks):
        if "text" not in chunk:
            raise ValueError(f"Chunk at index {i} is missing 'text' key.")
        texts.append(chunk["text"])

    model = _load_model()
    embeddings = model.encode(texts, show_progress_bar=False)

    return np.array(embeddings)
