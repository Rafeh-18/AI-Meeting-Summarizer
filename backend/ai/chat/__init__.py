"""
backend/ai/chat/__init__.py

Answers questions about ONE specific meeting, grounded in its transcript,
summary, decisions, and action items. Reuses the same Groq account already
configured for transcription and summarization.
"""

from groq import Groq
from flask import current_app

# Keep the raw transcript bounded so a very long meeting doesn't blow the
# context window or the per-request cost. The summary/key points/decisions
# already give the model a condensed view; this is just supporting detail.
MAX_TRANSCRIPT_CHARS = 20000

SYSTEM_PROMPT_TEMPLATE = """You are Clario, an assistant that answers questions about ONE specific meeting.

Only use the information below to answer. If something wasn't discussed in this meeting, say you don't see it in the meeting rather than guessing.

MEETING: {title}

SUMMARY:
{summary}

KEY POINTS:
{key_points}

DECISIONS:
{decisions}

ACTION ITEMS:
{action_items}

RISKS:
{risks}

TRANSCRIPT (may be truncated for length):
{transcript}
"""


def _format_list(items):
    if not items:
        return "None recorded."
    return "\n".join(f"- {i}" for i in items)


def _format_action_items(items):
    if not items:
        return "None recorded."
    lines = []
    for it in items:
        owner = it.get("owner") or "Unassigned"
        due = it.get("due_date") or "No deadline"
        lines.append(f"- {it.get('text', '')} (Owner: {owner}, Due: {due})")
    return "\n".join(lines)


def ask_about_meeting(meeting_dict, history, question):
    """
    meeting_dict: Meeting.to_dict() output for the meeting being discussed.
    history: list of {"role": "user"|"assistant", "content": str}, oldest first.
    question: the new user message.

    Returns the assistant's reply text.
    """
    client = Groq(api_key=current_app.config["GROQ_API_KEY"])

    transcript = meeting_dict.get("transcript_text") or "Transcript unavailable."
    if len(transcript) > MAX_TRANSCRIPT_CHARS:
        transcript = transcript[:MAX_TRANSCRIPT_CHARS] + "\n\n[...transcript truncated for length...]"

    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
        title=meeting_dict.get("title", "Untitled meeting"),
        summary=meeting_dict.get("summary_text") or "No summary available.",
        key_points=_format_list(meeting_dict.get("key_points")),
        decisions=_format_list(meeting_dict.get("decisions")),
        action_items=_format_action_items(meeting_dict.get("action_items")),
        risks=_format_list(meeting_dict.get("risks")),
        transcript=transcript,
    )

    messages = [{"role": "system", "content": system_prompt}]
    for m in history:
        messages.append({"role": m["role"], "content": m["content"]})
    messages.append({"role": "user", "content": question})

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=messages,
        temperature=0.3,
    )
    return response.choices[0].message.content