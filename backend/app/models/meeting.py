from datetime import datetime
from app.extensions import db


class Meeting(db.Model):
    __tablename__ = "meetings"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)

    title = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="uploaded")  # uploaded | processing | processed
    duration_seconds = db.Column(db.Integer, nullable=False, default=0)
    participant_count = db.Column(db.Integer, nullable=False, default=0)
    action_item_count = db.Column(db.Integer, nullable=False, default=0)
    has_pdf = db.Column(db.Boolean, nullable=False, default=False)

    file_path = db.Column(db.String(500), nullable=True)
    transcript_text = db.Column(db.Text, nullable=True)
    summary_text = db.Column(db.Text, nullable=True)
    key_points = db.Column(db.JSON, nullable=True)     # list[str]
    decisions = db.Column(db.JSON, nullable=True)      # list[str]
    risks = db.Column(db.JSON, nullable=True)          # list[str]
    action_items = db.Column(db.JSON, nullable=True)   # list[{text, owner, due_date}]
    processing_error = db.Column(db.Text, nullable=True)

    meeting_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self, include_transcript=True):
        data = {
            "id": self.id,
            "title": self.title,
            "status": self.status,
            "duration_seconds": self.duration_seconds,
            "participant_count": self.participant_count,
            "action_item_count": self.action_item_count,
            "has_pdf": self.has_pdf,
            "summary_text": self.summary_text,
            "key_points": self.key_points,
            "decisions": self.decisions,
            "risks": self.risks,
            "action_items": self.action_items,
            "processing_error": self.processing_error,
            "meeting_date": self.meeting_date.isoformat(),
            "created_at": self.created_at.isoformat(),
        }
        if include_transcript:
            data["transcript_text"] = self.transcript_text
        return data