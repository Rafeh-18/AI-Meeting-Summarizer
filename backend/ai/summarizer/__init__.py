import json
from groq import Groq
from flask import current_app

SYSTEM_PROMPT = """You analyze meeting transcripts for a meeting-summarization product.

Given a raw transcript, return ONLY a valid JSON object (no markdown, no code fences, no extra text) with exactly these keys:

{
  "summary": "a 3-5 sentence executive summary of the meeting, written in your own words - never copy sentences directly from the transcript",
  "key_points": ["short bullet point", "..."],
  "decisions": ["decision that was made", "..."],
  "action_items": [{"text": "what needs to be done", "owner": "person's name or null", "due_date": "date mentioned or null"}],
  "risks": ["risk or blocker mentioned", "..."]
}

Rules:
- The summary must be a genuine synthesis, not a copy or near-copy of transcript text. Never quote long verbatim passages.
- You MUST populate key_points, decisions, action_items, and risks whenever the transcript contains relevant content for them - do not leave them empty just because the transcript is long.
- If a category truly has nothing relevant, return an empty array for it.
- Do not invent information not present in the transcript."""


def summarize_transcript(transcript_text):
    client = Groq(api_key=current_app.config["GROQ_API_KEY"])
    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": transcript_text},
        ],
        temperature=0.3,
        max_tokens=4096,
        response_format={"type": "json_object"},
    )
    content = response.choices[0].message.content

    print("\n===== RAW SUMMARIZER OUTPUT =====")
    print(content[:2000])
    print("==================================\n")

    return json.loads(content)
