"""
retriever.py – AutoGen-based retriever agent that searches FAISS for relevant chunks.
"""

import asyncio

import numpy as np
from autogen_agentchat.agents import BaseChatAgent
from autogen_agentchat.base import Response
from autogen_agentchat.messages import ChatMessage, TextMessage
from autogen_core import CancellationToken
from sentence_transformers import SentenceTransformer

from vector_store.faiss_store import FAISSStore

MODEL_NAME = "all-MiniLM-L6-v2"

_model: SentenceTransformer | None = None


def _load_model() -> SentenceTransformer:
    """Lazy-load the embedding model (singleton)."""
    global _model
    if _model is None:
        _model = SentenceTransformer(MODEL_NAME)
    return _model


def _retrieve_from_store(query: str, store: FAISSStore, top_k: int = 5) -> list[dict]:
    """Core retrieval logic: embed query and search FAISS."""
    model = _load_model()
    query_embedding = model.encode([query], show_progress_bar=False)
    query_vector = np.array(query_embedding, dtype=np.float32)
    return store.search(query_vector, top_k=top_k)


class RetrieverAgent(BaseChatAgent):
    """
    Custom AutoGen agent that embeds incoming queries and searches FAISS.
    """

    def __init__(self, name: str, store: FAISSStore, top_k: int = 5):
        super().__init__(name=name, description="Retrieves relevant document chunks from the vector store.")
        self._store = store
        self._top_k = top_k

    @property
    def produced_message_types(self) -> list[type[ChatMessage]]:
        return [TextMessage]

    async def on_messages(self, messages, cancellation_token: CancellationToken) -> Response:
        """Embed the last message and return matching chunks."""
        query = messages[-1].content if messages else ""
        results = _retrieve_from_store(query, self._store, self._top_k)

        formatted = "\n\n---\n\n".join(
            f"**Chunk {r['metadata'].get('chunk_index', i)}** (score: {r['score']:.4f})\n{r['text']}"
            for i, r in enumerate(results)
        )
        response_text = formatted or "No relevant chunks found."
        return Response(chat_message=TextMessage(content=response_text, source=self.name))

    async def on_reset(self, cancellation_token: CancellationToken) -> None:
        pass


def create_retriever_agent(store: FAISSStore, top_k: int = 5) -> RetrieverAgent:
    """Create and return an AutoGen RetrieverAgent."""
    return RetrieverAgent(name="RetrieverAgent", store=store, top_k=top_k)


def retrieve(query: str, store: FAISSStore, top_k: int = 5) -> list[dict]:
    """
    Convenience function: embed a query and return top_k chunks from the store.

    Args:
        query: The user's natural language question.
        store: A populated FAISSStore instance.
        top_k: Number of results to return.

    Returns:
        List of dicts with "text", "metadata", and "score" for each match.
    """
    return _retrieve_from_store(query, store, top_k)
