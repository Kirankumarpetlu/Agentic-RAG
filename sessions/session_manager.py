"""
session_manager.py – Manages conversation sessions via Supabase.

Required tables in Supabase:

  sessions:
    - id           UUID  (primary key, default gen_random_uuid())
    - created_at   TIMESTAMPTZ (default now())

  conversations:
    - id           UUID  (primary key, default gen_random_uuid())
    - session_id   UUID  (foreign key → sessions.id)
    - user_query   TEXT
    - system_response TEXT
    - created_at   TIMESTAMPTZ (default now())
"""

import os
from datetime import datetime

from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

_client: Client | None = None


def _get_client() -> Client:
    """Lazy-init the Supabase client (singleton)."""
    global _client
    if _client is None:
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise ValueError(
                "SUPABASE_URL and SUPABASE_KEY environment variables must be set."
            )
        _client = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _client


def create_session() -> str:
    """
    Insert a new row in the sessions table.

    Returns:
        The session_id (UUID string) of the newly created session.
    """
    client = _get_client()
    response = client.table("sessions").insert({}).execute()
    session_id = response.data[0]["id"]
    return session_id


def store_conversation(
    session_id: str,
    user_query: str,
    system_response: str,
) -> dict:
    """
    Store a single conversation turn (query + response) in the conversations table.

    Args:
        session_id: The UUID of the active session.
        user_query: The user's question.
        system_response: The system's answer.

    Returns:
        The inserted row as a dict.
    """
    client = _get_client()
    row = {
        "session_id": session_id,
        "user_query": user_query,
        "system_response": system_response,
    }
    response = client.table("conversations").insert(row).execute()
    return response.data[0]


def get_session_history(session_id: str) -> list[dict]:
    """
    Retrieve all conversation turns for a given session, ordered by time.

    Args:
        session_id: The UUID of the session.

    Returns:
        List of dicts with user_query, system_response, and created_at.
    """
    client = _get_client()
    response = (
        client.table("conversations")
        .select("user_query, system_response, created_at")
        .eq("session_id", session_id)
        .order("created_at", desc=False)
        .execute()
    )
    return response.data
