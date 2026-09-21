"""
backend/ai/embeddings/embedder.py

Turns a meeting transcript into searchable chunks so you can build the
"Chat with meeting" (RAG) feature from the README roadmap, without paying
for a hosted embeddings API.
"""

from __future__ import annotations

import re
import warnings
from typing import Any, List, Optional, Protocol, Sequence

import numpy as np


# ---------------------------------------------------------------------------
# Chunking
# ---------------------------------------------------------------------------
def chunk_text(text: str, max_words: int = 180, overlap_words: int = 30) -> List[str]:
    """
    Split transcript text into overlapping word-based chunks.

    Overlap keeps context from being severed mid-thought at chunk
    boundaries, which matters for meeting transcripts where a decision or
    action item can span a couple of sentences.
    """
    if not text or not text.strip():
        return []

    words = re.sub(r"\s+", " ", text).strip().split(" ")
    if len(words) <= max_words:
        return [" ".join(words)]

    chunks: List[str] = []
    step = max(1, max_words - overlap_words)
    for start in range(0, len(words), step):
        chunk = words[start:start + max_words]
        if not chunk:
            break
        chunks.append(" ".join(chunk))
        if start + max_words >= len(words):
            break
    return chunks


# ---------------------------------------------------------------------------
# Backends
# ---------------------------------------------------------------------------
class EmbeddingBackend(Protocol):
    def embed(self, texts: Sequence[str]) -> np.ndarray:
        """Return an (n_texts, dim) float array."""
        ...

    def embed_query(self, text: str) -> np.ndarray:
        """Return a (dim,) float array for a single query string."""
        ...


class TfidfEmbeddingBackend:
    """
    Safe default backend. No torch, no external API calls, no GPU.
    Fits a fresh TF-IDF vectorizer per meeting (cheap at this scale —
    a one-hour transcript is a few hundred chunks at most).
    """

    def __init__(self) -> None:
        from sklearn.feature_extraction.text import TfidfVectorizer  # local import
        self._vectorizer_cls = TfidfVectorizer
        self._vectorizer = None

    def fit(self, texts: Sequence[str]) -> None:
        self._vectorizer = self._vectorizer_cls(
            stop_words="english", ngram_range=(1, 2), max_features=4096,
        )
        self._matrix = self._vectorizer.fit_transform(texts)

    def embed(self, texts: Sequence[str]) -> np.ndarray:
        self.fit(texts)
        return self._matrix.toarray()

    def embed_query(self, text: str) -> np.ndarray:
        if self._vectorizer is None:
            raise RuntimeError("Call embed() on the corpus before embed_query().")
        return self._vectorizer.transform([text]).toarray()[0]


class SentenceTransformerEmbeddingBackend:
    """
    Higher-quality optional backend. Requires `sentence-transformers`
    (and therefore torch). Only instantiate via get_embedder(prefer=...)
    so failures fall back gracefully.
    """

    def __init__(self, model_name: str = "all-MiniLM-L6-v2") -> None:
        from sentence_transformers import SentenceTransformer  # may raise
        self._model = SentenceTransformer(model_name)

    def embed(self, texts: Sequence[str]) -> np.ndarray:
        return np.asarray(self._model.encode(list(texts)))

    def embed_query(self, text: str) -> np.ndarray:
        return np.asarray(self._model.encode([text])[0])


def get_embedder(prefer: str = "tfidf") -> EmbeddingBackend:
    """
    Factory for the embedding backend.

    prefer:
        "tfidf"       -> always TfidfEmbeddingBackend (default, safest).
        "transformer" -> try SentenceTransformerEmbeddingBackend, fall back
                          to TF-IDF with a warning if torch/model loading
                          fails for any reason (e.g. Python 3.14 wheel gaps).
    """
    if prefer == "transformer":
        try:
            return SentenceTransformerEmbeddingBackend()
        except Exception as exc:  # noqa: BLE001 — deliberately broad, this is a soft fallback
            warnings.warn(
                f"sentence-transformers backend unavailable ({exc!r}); "
                "falling back to TF-IDF embeddings.",
                RuntimeWarning,
            )
    return TfidfEmbeddingBackend()


# ---------------------------------------------------------------------------
# Similarity search
# ---------------------------------------------------------------------------
def cosine_similarity(query_vec: np.ndarray, matrix: np.ndarray) -> np.ndarray:
    query_norm = np.linalg.norm(query_vec) or 1e-9
    matrix_norms = np.linalg.norm(matrix, axis=1)
    matrix_norms[matrix_norms == 0] = 1e-9
    return (matrix @ query_vec) / (matrix_norms * query_norm)


class MeetingKnowledgeBase:
    """
    Per-meeting in-memory index. Build once per transcript, query as many
    times as needed (e.g. across a chat session about that meeting).
    """

    def __init__(self, embedder: Optional[EmbeddingBackend] = None,
                 max_words: int = 180, overlap_words: int = 30) -> None:
        self.embedder = embedder or get_embedder()
        self.max_words = max_words
        self.overlap_words = overlap_words
        self.chunks: List[str] = []
        self.vectors: Optional[np.ndarray] = None

    def build(self, transcript_text: str) -> "MeetingKnowledgeBase":
        self.chunks = chunk_text(transcript_text, self.max_words, self.overlap_words)
        if not self.chunks:
            self.vectors = np.zeros((0, 0))
            return self
        self.vectors = np.asarray(self.embedder.embed(self.chunks))
        return self

    def query(self, question: str, top_k: int = 3) -> List[str]:
        if self.vectors is None or len(self.chunks) == 0:
            return []
        query_vec = self.embedder.embed_query(question)
        scores = cosine_similarity(query_vec, self.vectors)
        top_indices = np.argsort(scores)[::-1][:top_k]
        return [self.chunks[i] for i in top_indices if scores[i] > 0]


# ---------------------------------------------------------------------------
# RAG answer generation (reuses your existing Groq client)
# ---------------------------------------------------------------------------
def answer_with_context(question: str, context_chunks: Sequence[str],
                         client: Any,
                         model: str = "gpt-4o-mini") -> str:
    """
    Ask the LLM to answer a question about a meeting, grounded in the
    retrieved transcript chunks. Pass in an OpenAI client instance built the
    same way ai/summarizer does (OpenAI(api_key=current_app.config[...]))
    — this doesn't construct its own client, to avoid duplicating your API
    key handling / config. Swap `model` and the client instance if/when you
    migrate to Groq; the call shape is identical.
    """
    if not context_chunks:
        context_block = "(No relevant transcript excerpts were found.)"
    else:
        context_block = "\n\n---\n\n".join(context_chunks)

    system_prompt = (
        "You are Clario's meeting assistant. Answer the user's question "
        "using ONLY the transcript excerpts provided below. If the excerpts "
        "don't contain the answer, say so plainly instead of guessing."
    )
    user_prompt = f"Transcript excerpts:\n\n{context_block}\n\nQuestion: {question}"

    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.2,
    )
    return response.choices[0].message.content


if __name__ == "__main__":
    transcript = (
        "Raf: Let's talk about the Groq migration progress. "
        "Sam: We finished swapping Whisper and Llama over last week. "
        "It's cutting our per-meeting cost significantly. "
        "Raf: Good. Next up is enforcing the 25 megabyte upload limit "
        "client-side so users get a friendly error instead of a 413. "
        "Sam: I'll add that check to transcribe_audio before Friday."
    )
    kb = MeetingKnowledgeBase().build(transcript)
    hits = kb.query("What is the deadline for the file size check?")
    print("Retrieved chunks:")
    for h in hits:
        print(" -", h)
