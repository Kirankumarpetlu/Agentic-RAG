"""
faiss_store.py – FAISS-based vector store for storing and searching chunk embeddings.
"""

import json
import os

import faiss
import numpy as np


class FAISSStore:
    """
    A lightweight FAISS vector store that maps embeddings to chunk texts.

    Args:
        dimension: Embedding vector dimension (default 384 for all-MiniLM-L6-v2).
    """

    def __init__(self, dimension: int = 384):
        self.dimension = dimension
        self.index = faiss.IndexFlatL2(dimension)
        self.chunks: list[dict] = []  # parallel list of chunk dicts

    def count(self) -> int:
        """Return the number of stored chunks."""
        return self.index.ntotal

    def add(self, embeddings: np.ndarray, chunks: list[dict]) -> None:
        """
        Add embeddings and their corresponding chunks to the store.

        Args:
            embeddings: Array of shape (n, dimension).
            chunks: List of chunk dicts (must have "text" key).
        """
        if embeddings.shape[0] != len(chunks):
            raise ValueError(
                f"Mismatch: {embeddings.shape[0]} embeddings vs {len(chunks)} chunks."
            )

        self.index.add(embeddings.astype(np.float32))
        self.chunks.extend(chunks)

    def search(self, query_embedding: np.ndarray, top_k: int = 5) -> list[dict]:
        """
        Search for the most similar chunks to a query embedding.

        Args:
            query_embedding: A 1-D or 2-D array of the query vector.
            top_k: Number of top results to return.

        Returns:
            List of dicts with "text", "metadata", "score" for each match.
        """
        if self.index.ntotal == 0:
            return []

        query = np.array(query_embedding, dtype=np.float32)
        if query.ndim == 1:
            query = query.reshape(1, -1)

        top_k = min(top_k, self.index.ntotal)
        distances, indices = self.index.search(query, top_k)

        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx == -1:
                continue
            chunk = self.chunks[idx]
            results.append({
                "text": chunk.get("text", ""),
                "metadata": chunk.get("metadata", {}),
                "score": float(dist),
            })

        return results

    # ------------------------------------------------------------------
    # Optional persistence
    # ------------------------------------------------------------------

    def save(self, directory: str) -> None:
        """
        Persist the FAISS index and chunk metadata to disk.

        Args:
            directory: Folder to save into (created if it doesn't exist).
        """
        os.makedirs(directory, exist_ok=True)
        faiss.write_index(self.index, os.path.join(directory, "index.faiss"))
        with open(os.path.join(directory, "chunks.json"), "w", encoding="utf-8") as f:
            json.dump(self.chunks, f, ensure_ascii=False)

    @classmethod
    def load(cls, directory: str, dimension: int = 384) -> "FAISSStore":
        """
        Load a previously saved FAISSStore from disk.

        Args:
            directory: Folder containing index.faiss and chunks.json.
            dimension: Embedding dimension (must match saved index).

        Returns:
            A populated FAISSStore instance.
        """
        store = cls(dimension=dimension)
        store.index = faiss.read_index(os.path.join(directory, "index.faiss"))
        with open(os.path.join(directory, "chunks.json"), "r", encoding="utf-8") as f:
            store.chunks = json.load(f)
        return store
