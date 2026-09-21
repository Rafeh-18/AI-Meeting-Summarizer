
from __future__ import annotations

import os
import re
import unicodedata
from datetime import datetime
from typing import Any, Dict, List, Optional, Union
from xml.sax.saxutils import escape as _xml_escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    ListFlowable,
    ListItem,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

# ---------------------------------------------------------------------------
# Brand / style constants — tweak to match Clario's actual palette
# ---------------------------------------------------------------------------
BRAND_PRIMARY = colors.HexColor("#4F46E5")   # indigo, adjust to your CSS vars
BRAND_MUTED = colors.HexColor("#6B7280")
BRAND_BORDER = colors.HexColor("#E5E7EB")
BRAND_DANGER = colors.HexColor("#DC2626")

PAGE_SIZE = LETTER
MARGIN = 0.75 * inch

# ---------------------------------------------------------------------------
# Text sanitization
# ---------------------------------------------------------------------------

_UNICODE_REPLACEMENTS = {
    "\u2026": "...",  # … ellipsis
    "\u26a0": "[!]",  # ⚠ warning sign
    "\ufe0f": "",     # emoji variation selector
    "\u200b": "",     # zero-width space
    "\u200c": "",
    "\u200d": "",
}


def _sanitize(text: Any) -> str:
    """Make arbitrary text safe to pass into a ReportLab Paragraph, without
    ever silently deleting a character in a way that merges two words."""
    if text is None:
        return ""
    text = str(text)

    out = []
    for ch in text:
        if ch in _UNICODE_REPLACEMENTS:
            out.append(_UNICODE_REPLACEMENTS[ch])
        elif ord(ch) < 256:
            # Plain ASCII/Latin-1 — the base-14 fonts render these directly.
            out.append(ch)
        else:
            category = unicodedata.category(ch)
            if category == "Pd":  # any dash/hyphen variant (en, em, non-
                out.append("-")   # breaking hyphen, figure dash, etc.)
            elif category in ("Pi", "Pf"):  # any opening/closing quote mark
                out.append("'")
            elif category.startswith("Z"):  # any unusual space/separator
                out.append(" ")
            elif category == "Pc" or category.startswith("P"):
                # other punctuation-ish symbol we don't specifically know —
                # a safe generic dash keeps word boundaries intact.
                out.append("-")
            else:
                # Unknown letter/symbol outside Latin-1 (rare emoji, other
                # scripts): drop the glyph but keep a space so words don't
                # collide, rather than crash or render a missing-glyph box.
                out.append(" ")
    text = "".join(out)
    text = re.sub(r" {2,}", " ", text)

    # Escape & < > so Paragraph's mini-markup parser doesn't choke on plain
    # text like "MD&A" or a stray "<" in the transcript.
    return _xml_escape(text)


def _styles() -> Dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    styles = {
        "Title": ParagraphStyle(
            "ReportTitle", parent=base["Title"], fontSize=24,
            textColor=BRAND_PRIMARY, spaceAfter=6, alignment=TA_LEFT,
        ),
        "Meta": ParagraphStyle(
            "Meta", parent=base["Normal"], fontSize=10,
            textColor=BRAND_MUTED, spaceAfter=2,
        ),
        "Section": ParagraphStyle(
            "Section", parent=base["Heading2"], fontSize=14,
            textColor=BRAND_PRIMARY, spaceBefore=16, spaceAfter=8,
            borderColor=BRAND_BORDER, borderWidth=0, borderPadding=0,
        ),
        "Body": ParagraphStyle(
            "Body", parent=base["Normal"], fontSize=10.5, leading=15,
            spaceAfter=6,
        ),
        "BulletBody": ParagraphStyle(
            "BulletBody", parent=base["Normal"], fontSize=10.5, leading=14,
        ),
        "TranscriptSpeaker": ParagraphStyle(
            "TranscriptSpeaker", parent=base["Normal"], fontSize=9.5,
            textColor=BRAND_PRIMARY, spaceBefore=6,
        ),
        "TranscriptText": ParagraphStyle(
            "TranscriptText", parent=base["Normal"], fontSize=9.5, leading=13,
            spaceAfter=4,
        ),
        "CoverTitle": ParagraphStyle(
            "CoverTitle", parent=base["Title"], fontSize=30,
            alignment=TA_CENTER, textColor=colors.HexColor("#111827"),
            spaceAfter=14,
        ),
        "CoverMeta": ParagraphStyle(
            "CoverMeta", parent=base["Normal"], fontSize=12,
            alignment=TA_CENTER, textColor=BRAND_MUTED, spaceAfter=4,
        ),
    }
    return styles


def _fmt_datetime(value: Union[str, datetime, None]) -> str:
    if value is None:
        return "Unknown date"
    if isinstance(value, str):
        try:
            value = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return value
    return value.strftime("%B %d, %Y at %I:%M %p")


def _pick_date(meeting: Dict[str, Any]) -> Union[str, datetime, None]:
    # Meeting.to_dict() exposes both meeting_date and created_at; prefer
    # meeting_date since that's the user-facing "when the meeting happened".
    return meeting.get("meeting_date") or meeting.get("created_at")


def _fmt_duration(seconds: Optional[int]) -> str:
    if not seconds:
        return "—"
    minutes, sec = divmod(int(seconds), 60)
    hours, minutes = divmod(minutes, 60)
    if hours:
        return f"{hours}h {minutes}m"
    return f"{minutes}m {sec}s"


def _normalize_action_item(item: Union[str, Dict[str, Any]]) -> Dict[str, str]:
    # Matches the shape your summarizer actually emits:
    # {"text": "...", "owner": "name or null", "due_date": "date or null"}
    if isinstance(item, str):
        return {"task": item, "owner": "", "deadline": ""}
    return {
        "task": item.get("text") or item.get("task") or item.get("description") or "",
        "owner": item.get("owner") or item.get("assignee") or "",
        "deadline": item.get("due_date") or item.get("deadline") or "",
    }


def _bullet_list(items: List[str], styles: Dict[str, ParagraphStyle]):
    if not items:
        return Paragraph("<i>None identified.</i>", styles["Body"])
    return ListFlowable(
        [ListItem(Paragraph(_sanitize(i), styles["BulletBody"]), leftIndent=6)
         for i in items],
        bulletType="bullet",
        start="circle",
        leftIndent=14,
    )


def _action_items_table(items: List[Dict[str, Any]], styles: Dict[str, ParagraphStyle]) -> Any:
    if not items:
        return Paragraph("<i>No action items identified.</i>", styles["Body"])

    normalized = [_normalize_action_item(i) for i in items]
    header = ["Task", "Owner", "Deadline"]
    rows = [header] + [
        [
            Paragraph(_sanitize(n["task"]), styles["BulletBody"]),
            Paragraph(_sanitize(n["owner"]) or "-", styles["BulletBody"]),
            Paragraph(_sanitize(n["deadline"]) or "-", styles["BulletBody"]),
        ]
        for n in normalized
    ]
    table = Table(rows, colWidths=[3.4 * inch, 1.5 * inch, 1.5 * inch])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BRAND_PRIMARY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, 0), 10),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.5, BRAND_BORDER),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F9FAFB")]),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ]))
    return table


def _transcript_flowables(transcript: Optional[str],
                           styles: Dict[str, ParagraphStyle]) -> List[Any]:
    # Meeting.transcript_text is a plain string (no diarization/segments yet
    # per app/models/meeting.py) — split on blank lines for readability.
    flowables: List[Any] = []
    if not transcript or not transcript.strip():
        flowables.append(Paragraph("<i>Transcript unavailable.</i>", styles["Body"]))
        return flowables

    for para in transcript.split("\n\n"):
        para = para.strip()
        if para:
            safe = _sanitize(para).replace("\n", "<br/>")
            flowables.append(Paragraph(safe, styles["TranscriptText"]))
    return flowables


def _footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(BRAND_BORDER)
    canvas.line(MARGIN, 0.6 * inch, PAGE_SIZE[0] - MARGIN, 0.6 * inch)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(BRAND_MUTED)
    canvas.drawString(MARGIN, 0.4 * inch, "Generated by Clario")
    canvas.drawRightString(
        PAGE_SIZE[0] - MARGIN, 0.4 * inch, f"Page {doc.page}"
    )
    canvas.restoreState()


def generate_meeting_report(meeting: Dict[str, Any], output_path: str) -> str:
    """
    Build a multi-section PDF report for a single meeting.

    Args:
        meeting: dict from Meeting.to_dict() (see module docstring).
        output_path: full filesystem path to write the .pdf to. Parent
            directories are created if missing.

    Returns:
        The output_path (for convenience when chaining into a route handler).
    """
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    styles = _styles()

    frame = Frame(MARGIN, MARGIN, PAGE_SIZE[0] - 2 * MARGIN,
                   PAGE_SIZE[1] - 2 * MARGIN, id="normal")
    doc = BaseDocTemplate(
        output_path, pagesize=PAGE_SIZE,
        title=meeting.get("title", "Meeting Report"),
        author="Clario",
    )
    doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=_footer)])

    story: List[Any] = []

    # --- Cover ---
    story.append(Spacer(1, 1.6 * inch))
    story.append(Paragraph(_sanitize(meeting.get("title", "Untitled Meeting")), styles["CoverTitle"]))
    story.append(Paragraph(_fmt_datetime(_pick_date(meeting)), styles["CoverMeta"]))
    story.append(Paragraph(f"Duration: {_fmt_duration(meeting.get('duration_seconds'))}", styles["CoverMeta"]))
    participant_count = meeting.get("participant_count") or 0
    if participant_count:
        noun = "participant" if participant_count == 1 else "participants"
        story.append(Paragraph(f"{participant_count} {noun}", styles["CoverMeta"]))
    if meeting.get("status") and meeting["status"] != "processed":
        story.append(Spacer(1, 0.15 * inch))
        story.append(Paragraph(
            f"Note: this meeting's status is '{meeting['status']}' — "
            "some sections below may be incomplete.", styles["CoverMeta"],
        ))
    story.append(PageBreak())

    # --- Executive summary ---
    story.append(Paragraph("Executive Summary", styles["Section"]))
    story.append(Paragraph(_sanitize(meeting.get("summary_text")) or "No summary available.", styles["Body"]))

    # --- Key discussion points ---
    story.append(Paragraph("Key Discussion Points", styles["Section"]))
    story.append(_bullet_list(meeting.get("key_points") or [], styles))

    # --- Decisions ---
    story.append(Paragraph("Decisions Made", styles["Section"]))
    story.append(_bullet_list(meeting.get("decisions") or [], styles))

    # --- Action items ---
    story.append(Paragraph("Action Items", styles["Section"]))
    story.append(_action_items_table(meeting.get("action_items") or [], styles))

    # --- Risks ---
    risks = meeting.get("risks") or []
    if risks:
        story.append(Paragraph("Risks & Issues", styles["Section"]))
        risk_paras = [Paragraph(f"[!] {_sanitize(r)}", styles["BulletBody"]) for r in risks]
        story.append(ListFlowable(
            [ListItem(p, leftIndent=6) for p in risk_paras],
            bulletType="bullet", start="circle", leftIndent=14,
        ))

    # --- Transcript ---
    story.append(PageBreak())
    story.append(Paragraph("Full Transcript", styles["Section"]))
    story.extend(_transcript_flowables(meeting.get("transcript_text"), styles))

    doc.build(story)
    return output_path


if __name__ == "__main__":
    # Quick manual smoke test using the real Meeting.to_dict() shape.
    sample = {
        "id": 1,
        "title": "Q3 Roadmap Sync",
        "status": "processed",
        "duration_seconds": 2130,
        "participant_count": 2,
        "action_item_count": 2,
        "has_pdf": False,
        "summary_text": "The team aligned on Q3 priorities, agreeing to defer the "
                         "mobile app in favor of hardening the core transcription "
                         "pipeline.",
        "key_points": ["OpenAI migration to Groq is planned", "Cost per meeting matters"],
        "decisions": ["Ship Alembic migrations before onboarding real users"],
        "risks": ["25MB upload limit not yet enforced client-side"],
        "action_items": [
            {"text": "Add pre-flight file size check", "owner": "Raf", "due_date": "Fri"},
            {"text": "Remove obsolete docker-compose version field", "owner": None, "due_date": None},
        ],
        "processing_error": None,
        "meeting_date": datetime.now().isoformat(),
        "created_at": datetime.now().isoformat(),
        "transcript_text": "Raf: Let's talk about the Groq migration.\n\nSam: Sounds good, it's saving us a lot on cost.",
    }
    out = generate_meeting_report(sample, "/tmp/sample_report.pdf")
    print(f"Wrote {out}")
