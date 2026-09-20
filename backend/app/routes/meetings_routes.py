from flask import Blueprint, request, jsonify, send_file
from app.controllers.ai_controller import process_meeting, generate_report
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import user, meeting, chat_message
from app.controllers.chat_controller import get_chat_history, send_chat_message
 
from app.controllers.meetings_controller import (
    get_meetings_for_user,
    get_stats_for_user,
    create_meeting,
    delete_meeting,
    get_meeting_by_id,
    create_meeting_from_file,
)

meetings_bp = Blueprint("meetings", __name__)


@meetings_bp.get("/meetings")
@jwt_required()
def list_meetings():
    user_id = int(get_jwt_identity())
    return jsonify({"meetings": get_meetings_for_user(user_id)}), 200


@meetings_bp.get("/meetings/stats")
@jwt_required()
def stats():
    user_id = int(get_jwt_identity())
    return jsonify({"stats": get_stats_for_user(user_id)}), 200


@meetings_bp.get("/meetings/<int:meeting_id>")
@jwt_required()
def get_one(meeting_id):
    user_id = int(get_jwt_identity())
    meeting = get_meeting_by_id(user_id, meeting_id)
    if not meeting:
        return jsonify({"error": "Meeting not found"}), 404
    return jsonify({"meeting": meeting}), 200


@meetings_bp.post("/meetings")
@jwt_required()
def create():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    meeting = create_meeting(user_id, data)
    return jsonify({"meeting": meeting}), 201


@meetings_bp.post("/meetings/upload")
@jwt_required()
def upload():
    user_id = int(get_jwt_identity())
    file = request.files.get("file")
    title = request.form.get("title")
    meeting, error = create_meeting_from_file(user_id, file, title)
    if error:
        return jsonify(error), 400
    return jsonify({"meeting": meeting}), 201


@meetings_bp.delete("/meetings/<int:meeting_id>")
@jwt_required()
def remove(meeting_id):
    user_id = int(get_jwt_identity())
    if not delete_meeting(user_id, meeting_id):
        return jsonify({"error": "Meeting not found"}), 404
    return jsonify({"message": "Deleted"}), 200

from app.controllers.analytics_controller import get_analytics_for_user  # add to existing import block


@meetings_bp.get("/meetings/analytics")
@jwt_required()
def analytics():
    user_id = int(get_jwt_identity())
    return jsonify({"analytics": get_analytics_for_user(user_id)}), 200




@meetings_bp.post("/meetings/<int:meeting_id>/process")
@jwt_required()
def process(meeting_id):
    user_id = int(get_jwt_identity())
    meeting, error, status = process_meeting(user_id, meeting_id)
    if error:
        return jsonify(error), status
    return jsonify({"meeting": meeting}), status

@meetings_bp.get("/meetings/<int:meeting_id>/pdf")
@jwt_required()
def download_report(meeting_id):
    user_id = int(get_jwt_identity())
    path, error, status = generate_report(user_id, meeting_id)
    if error:
        return jsonify(error), status
    return send_file(
        path,
        as_attachment=True,
        download_name=f"meeting-{meeting_id}-report.pdf",
        mimetype="application/pdf",
    )

@meetings_bp.get("/meetings/<int:meeting_id>/chat")
@jwt_required()
def chat_history(meeting_id):
    user_id = int(get_jwt_identity())
    messages, error, status = get_chat_history(user_id, meeting_id)
    if error:
        return jsonify(error), status
    return jsonify({"messages": messages}), status
 
 
@meetings_bp.post("/meetings/<int:meeting_id>/chat")
@jwt_required()
def chat_send(meeting_id):
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    result, error, status = send_chat_message(user_id, meeting_id, data.get("message", ""))
    if error:
        return jsonify(error), status
    return jsonify(result), status