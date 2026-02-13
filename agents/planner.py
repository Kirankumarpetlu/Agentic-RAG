"""
planner.py – AutoGen-based planner agent that uses Groq LLM to analyze user queries.
"""

import asyncio
import json
import os

from autogen_agentchat.agents import AssistantAgent
from autogen_ext.models.openai import OpenAIChatCompletionClient

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
MODEL = "llama-3.1-8b-instant"

SYSTEM_PROMPT = """You are a query planner for a document Q&A system.
Given a user query, analyze what type of analysis is needed and respond with ONLY valid JSON (no extra text):

{
  "analysis_type": "<one of: summarization, factual_lookup, comparison, numeric_analysis, general_qa>",
  "needs_numeric": <true or false>,
  "retrieval_focus": "<short description of what to retrieve from the documents>"
}

Rules:
- Set needs_numeric to true only if the query involves numbers, statistics, calculations, or tabular data.
- Keep retrieval_focus concise — one sentence max.
- Always respond with valid JSON only."""


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


def create_planner_agent() -> AssistantAgent:
    """
    Create and return an AutoGen AssistantAgent configured as the planner.
    """
    client = _create_groq_client()
    planner = AssistantAgent(
        name="PlannerAgent",
        model_client=client,
        system_message=SYSTEM_PROMPT,
    )
    return planner


async def _async_plan_query(query: str) -> dict:
    """Async implementation of plan_query."""
    from autogen_core import CancellationToken
    from autogen_agentchat.messages import TextMessage

    planner = create_planner_agent()

    response = await planner.on_messages(
        [TextMessage(content=query, source="user")],
        cancellation_token=CancellationToken(),
    )

    raw = response.chat_message.content.strip()

    try:
        plan = json.loads(raw)
    except json.JSONDecodeError:
        raise ValueError(f"Failed to parse planner response as JSON:\n{raw}")

    for key in ("analysis_type", "needs_numeric", "retrieval_focus"):
        if key not in plan:
            raise ValueError(f"Missing key '{key}' in planner response: {plan}")

    return plan


def plan_query(query: str) -> dict:
    """
    Convenience function: send a query to the PlannerAgent and return a structured plan.

    Args:
        query: The user's natural language question.

    Returns:
        A dict with keys: analysis_type, needs_numeric, retrieval_focus.

    Raises:
        ValueError: If the LLM response cannot be parsed as JSON.
    """
    return asyncio.run(_async_plan_query(query))
