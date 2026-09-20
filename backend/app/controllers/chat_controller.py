import traceback

from app.extensions import db
from app.models.meeting import Meeting
from app.models.chat_message import ChatMessage
from ai.chat import ask_about_meeting


def get_chat_history(user_id, meeting_id):
    meeting = Meeting.query.filter_by(id=meeting_id, user_id=user_id).first()
    if not meeting:
        return None, {"error": "Meeting not found"}, 404

    messages = (
        ChatMessage.query
        .filter_by(meeting_id=meeting_id, user_id=user_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    return [m.to_dict() for m in messages], None, 200


def send_chat_message(user_id, meeting_id, text):
    meeting = Meeting.query.filter_by(id=meeting_id, user_id=user_id).first()
    if not meeting:
        return None, {"error": "Meeting not found"}, 404

    if meeting.status != "processed":
        return None, {"error": "This meeting hasn't been summarized yet — process it first."}, 400

    text = (text or "").strip()
    if not text:
        return None, {"error": "Message cannot be empty."}, 400

    history_rows = (
        ChatMessage.query
        .filter_by(meeting_id=meeting_id, user_id=user_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    history = [{"role": m.role, "content": m.content} for m in history_rows]

    user_msg = ChatMessage(meeting_id=meeting_id, user_id=user_id, role="user", content=text)
    db.session.add(user_msg)
    db.session.commit()

    try:
        reply_text = ask_about_meeting(meeting.to_dict(), history, text)
    except Exception as e:
        print("\n========== CHAT ERROR ==========")
        traceback.print_exc()
        print("=================================\n")
        return None, {"error": f"Chat failed: {str(e)}"}, 500

    assistant_msg = ChatMessage(meeting_id=meeting_id, user_id=user_id, role="assistant", content=reply_text)
    db.session.add(assistant_msg)
    db.session.commit()

    return {
        "user_message": user_msg.to_dict(),
        "assistant_message": assistant_msg.to_dict(),
    }, None, 200