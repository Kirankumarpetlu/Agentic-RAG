"""
chunker.py – Splits raw text into sentence-aware chunks of ~400 tokens.
"""

import re

DEFAULT_CHUNK_SIZE = 400  # approximate token target per chunk
APPROX_CHARS_PER_TOKEN = 4  # rough English average


def _split_sentences(text: str) -> list[str]:
    """Split text into sentences using a simple regex."""
    sentences = re.split(r"(?<=[.!?])\s+", text)
    return [s.strip() for s in sentences if s.strip()]


def _estimate_tokens(text: str) -> int:
    """Rough token count based on character length."""
    return len(text) // APPROX_CHARS_PER_TOKEN


def chunk_text(
    text: str,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    source: str = "",
) -> list[dict]:
    """
    Split text into chunks of approximately `chunk_size` tokens,
    avoiding mid-sentence breaks where possible.

    Args:
        text: The raw text to chunk.
        chunk_size: Target token count per chunk (default 400).
        source: Optional source identifier for metadata.

    Returns:
        A list of chunk dicts, each containing:
        - "text": the chunk content
        - "metadata": placeholder dict with chunk_index, source,
          and estimated token count.
    """
    sentences = _split_sentences(text)
    chunks: list[dict] = []
    current_sentences: list[str] = []
    current_tokens = 0

    for sentence in sentences:
        sentence_tokens = _estimate_tokens(sentence)

        # If a single sentence exceeds the limit, emit it as its own chunk
        if sentence_tokens >= chunk_size:
            # Flush anything accumulated first
            if current_sentences:
                chunks.append(_build_chunk(current_sentences, len(chunks), source))
                current_sentences = []
                current_tokens = 0
            chunks.append(_build_chunk([sentence], len(chunks), source))
            continue

        # Would adding this sentence exceed the target?
        if current_tokens + sentence_tokens > chunk_size and current_sentences:
            chunks.append(_build_chunk(current_sentences, len(chunks), source))
            current_sentences = []
            current_tokens = 0

        current_sentences.append(sentence)
        current_tokens += sentence_tokens

    # Flush remaining sentences
    if current_sentences:
        chunks.append(_build_chunk(current_sentences, len(chunks), source))

    return chunks


def _build_chunk(sentences: list[str], index: int, source: str) -> dict:
    """Assemble a chunk dict with text and metadata placeholder."""
    text = " ".join(sentences)
    return {
        "text": text,
        "metadata": {
            "chunk_index": index,
            "source": source,
            "estimated_tokens": _estimate_tokens(text),
        },
    }
