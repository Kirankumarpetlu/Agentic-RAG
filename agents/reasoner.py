"""
reasoner.py – AutoGen-based reasoning agent that generates answers using Groq LLM.

Takes retrieved chunks, optional numeric metrics, and the user query
to produce a grounded, structured answer.
"""

import asyncio
import json
import os

from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.messages import TextMessage
from autogen_core import CancellationToken
from autogen_ext.models.openai import OpenAIChatCompletionClient

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
MODEL = "llama-3.1-8b-instant"

SYSTEM_PROMPT = """You are a reasoning agent for a document Q&A system.

You will receive:
1. A user query.
2. Retrieved document chunks (context).
3. Optionally, precomputed numeric metrics.

Your job:
- Answer the query using ONLY the provided context and metrics.
- If the context does not contain enough information, say so clearly.
- NEVER hallucinate or invent facts not present in the context.
- Structure your answer clearly with a short summary first, then details.

Respond with ONLY valid JSON (no extra text):
{
  "answer": "<your structured answer>",
  "confidence": "<high | medium | low>",
  "sources_used": <number of chunks you actually referenced>
}"""


def _create_groq_client() -> OpenAIChatCompletionClient:
    """Create an OpenAI-compatible model client pointing to Groq."""
    return OpenAIChatCompletionClient(
        model=MODEL,
        api_key=GROQ_API_KEY,
        base_url="https://api.groq.com/openai/v1",
        model_info={
            "vision": False,
            "function_calling": True,
            "json_output": True,
            "family": "unknown",
        },
    )


def create_reasoner_agent() -> AssistantAgent:
    """Create and return an AutoGen AssistantAgent configured as the reasoner."""
    client = _create_groq_client()
    return AssistantAgent(
        name="ReasonerAgent",
        model_client=client,
        system_message=SYSTEM_PROMPT,
    )


def _build_prompt(query: str, chunks: str, metrics: dict | list | None = None) -> str:
    """Assemble the user-facing prompt with context and optional metrics."""
    parts = [
        f"## User Query\n{query}",
        f"\n## Retrieved Context\n{chunks}",
    ]

    if metrics:
        formatted = json.dumps(metrics, indent=2) if isinstance(metrics, (dict, list)) else str(metrics)
        parts.append(f"\n## Numeric Metrics\n{formatted}")

    return "\n".join(parts)


async def _async_reason(query: str, chunks: str, metrics: dict | list | None = None) -> dict:
    """Async implementation of reason()."""
    prompt = _build_prompt(query, chunks, metrics)
    agent = create_reasoner_agent()

    response = await agent.on_messages(
        [TextMessage(content=prompt, source="user")],
        cancellation_token=CancellationToken(),
    )

    raw = response.chat_message.content.strip()

    try:
        result = json.loads(raw)
    except json.JSONDecodeError:
        raise ValueError(f"Failed to parse reasoner response as JSON:\n{raw}")

    for key in ("answer", "confidence", "sources_used"):
        if key not in result:
            raise ValueError(f"Missing key '{key}' in reasoner response: {result}")

    return result


def reason(query: str, chunks: str, metrics: dict | list | None = None) -> dict:
    """
    Generate a grounded answer from retrieved chunks and optional metrics.

    Args:
        query: The user's natural language question.
        chunks: Retrieved document chunk text (from the retriever).
        metrics: Optional precomputed numeric results (from tool_executor).

    Returns:
        A dict with keys: answer, confidence, sources_used.

    Raises:
        ValueError: If the LLM response cannot be parsed as JSON.
    """
    return asyncio.run(_async_reason(query, chunks, metrics))
