from datetime import datetime, timedelta
from app.extensions import db
from app.models.meeting import Meeting
import os
import uuid
from datetime import datetime
from werkzeug.utils import secure_filename
from flask import current_app
from app.utils.audio import get_duration_seconds


def allowed_file(filename):
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return ext in current_app.config["ALLOWED_EXTENSIONS"]


def create_meeting_from_file(user_id, file_storage, title=None):
    if not file_storage or file_storage.filename == "":
        return None, {"errors": {"file": "No file was provided."}}

    if not allowed_file(file_storage.filename):
        return None, {"errors": {"file": "Unsupported file type."}}

    upload_dir = os.path.join(current_app.config["UPLOAD_FOLDER"], str(user_id))
    os.makedirs(upload_dir, exist_ok=True)

    original_name = secure_filename(file_storage.filename)
    ext = original_name.rsplit(".", 1)[-1].lower()
    stored_name = f"{uuid.uuid4().hex}.{ext}"
    file_path = os.path.join(upload_dir, stored_name)
    file_storage.save(file_path)

    duration = get_duration_seconds(file_path)
    resolved_title = (
        title.strip() if title and title.strip() else original_name.rsplit(".", 1)[0]
    )
    meeting = Meeting(
        user_id=user_id,
        title=resolved_title,
        status="uploaded",
        duration_seconds=duration,
        participant_count=0,
        action_item_count=0,
        has_pdf=False,
        file_path=file_path,
        meeting_date=datetime.utcnow(),
    )
    db.session.add(meeting)
    db.session.commit()
    return meeting.to_dict(), None


def get_meetings_for_user(user_id):
    meetings = (
        Meeting.query.filter_by(user_id=user_id)
        .order_by(Meeting.meeting_date.desc())
        .all()
    )
    return [m.to_dict() for m in meetings]


def get_stats_for_user(user_id):
    meetings = Meeting.query.filter_by(user_id=user_id).all()
    week_ago = datetime.utcnow() - timedelta(days=7)

    total_meetings = len(meetings)
    meetings_this_week = sum(1 for m in meetings if m.created_at >= week_ago)

    total_seconds = sum(m.duration_seconds for m in meetings)
    seconds_this_week = sum(m.duration_seconds for m in meetings if m.created_at >= week_ago)

    total_action_items = sum(m.action_item_count for m in meetings)
    open_action_items = sum(
        m.action_item_count for m in meetings if m.status != "processed"
    )

    total_pdfs = sum(1 for m in meetings if m.has_pdf)
    pdfs_this_week = sum(1 for m in meetings if m.has_pdf and m.created_at >= week_ago)

    return {
        "total_meetings": total_meetings,
        "meetings_this_week": meetings_this_week,
        "hours_recorded": round(total_seconds / 3600, 1),
        "hours_this_week": round(seconds_this_week / 3600, 1),
        "action_items": total_action_items,
        "open_action_items": open_action_items,
        "pdf_reports": total_pdfs,
        "pdfs_this_week": pdfs_this_week,
    }


def create_meeting(user_id, data):
    meeting = Meeting(
        user_id=user_id,
        title=data.get("title", "Untitled meeting"),
        status=data.get("status", "uploaded"),
        duration_seconds=data.get("duration_seconds", 0),
        participant_count=data.get("participant_count", 0),
        action_item_count=data.get("action_item_count", 0),
        has_pdf=data.get("has_pdf", False),
        meeting_date=datetime.utcnow(),
    )
    db.session.add(meeting)
    db.session.commit()
    return meeting.to_dict()


def delete_meeting(user_id, meeting_id):
    meeting = Meeting.query.filter_by(id=meeting_id, user_id=user_id).first()
    if not meeting:
        return False
    db.session.delete(meeting)
    db.session.commit()
    return True

def get_meeting_by_id(user_id, meeting_id):
    meeting = Meeting.query.filter_by(id=meeting_id, user_id=user_id).first()
    return meeting.to_dict() if meeting else None