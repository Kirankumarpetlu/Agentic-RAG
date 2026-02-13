"""
orchestrator.py – Wires PlannerAgent and RetrieverAgent together using AutoGen.
"""

import asyncio
import json

from autogen_agentchat.messages import TextMessage
from autogen_core import CancellationToken

from agents.planner import create_planner_agent
from agents.retriever import create_retriever_agent
from vector_store.faiss_store import FAISSStore


async def _async_run_pipeline(query: str, store: FAISSStore, top_k: int = 5) -> dict:
    """Async implementation of run_pipeline."""
    cancellation_token = CancellationToken()

    # --- Step 1: Plan ---
    planner = create_planner_agent()
    plan_response = await planner.on_messages(
        [TextMessage(content=query, source="user")],
        cancellation_token=cancellation_token,
    )

    raw_plan = plan_response.chat_message.content.strip()
    try:
        plan = json.loads(raw_plan)
    except json.JSONDecodeError:
        plan = {"raw_response": raw_plan, "error": "Failed to parse plan"}

    # --- Step 2: Retrieve ---
    retrieval_query = plan.get("retrieval_focus", query)

    retriever = create_retriever_agent(store, top_k=top_k)
    retrieval_response = await retriever.on_messages(
        [TextMessage(content=retrieval_query, source="PlannerAgent")],
        cancellation_token=cancellation_token,
    )

    chunks_text = retrieval_response.chat_message.content

    return {
        "query": query,
        "plan": plan,
        "chunks": chunks_text,
    }


def run_pipeline(query: str, store: FAISSStore, top_k: int = 5) -> dict:
    """
    End-to-end pipeline: plan the query, then retrieve relevant chunks.

    Args:
        query: The user's natural language question.
        store: A populated FAISSStore instance.
        top_k: Number of chunks to retrieve.

    Returns:
        A dict containing:
        - "plan": the structured analysis plan from the planner.
        - "chunks": the retrieved chunk texts from the retriever.
        - "query": the original query.
    """
    return asyncio.run(_async_run_pipeline(query, store, top_k))
