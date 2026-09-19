from app.extensions import db
from app.models.meeting import Meeting
from ai.whisper import transcribe_audio
from ai.summarizer import summarize_transcript
import os
from flask import current_app
from ai.pdf import generate_meeting_report
import traceback


def process_meeting(user_id, meeting_id):

    meeting = Meeting.query.filter_by(
        id=meeting_id,
        user_id=user_id
    ).first()


    if not meeting:
        return None, {
            "error": "Meeting not found"
        }, 404


    if not meeting.file_path:
        return None, {
            "error": "This meeting has no audio file to process."
        }, 400


    try:
        # Update status
        meeting.status = "processing"
        meeting.processing_error = None
        db.session.commit()


        print("Starting transcription...")
        
        transcript_text = transcribe_audio(
            meeting.file_path
        )


        print("Transcription completed")
        print("Transcript length:", len(transcript_text))


        print("Starting AI summarization...")

        analysis = summarize_transcript(
            transcript_text
        )


        print("AI summarization completed")


        # Save results
        meeting.transcript_text = transcript_text

        meeting.summary_text = analysis.get(
            "summary",
            ""
        )

        meeting.key_points = analysis.get(
            "key_points",
            []
        )

        meeting.decisions = analysis.get(
            "decisions",
            []
        )

        meeting.risks = analysis.get(
            "risks",
            []
        )

        meeting.action_items = analysis.get(
            "action_items",
            []
        )

        meeting.action_item_count = len(
            meeting.action_items or []
        )

        meeting.status = "processed"

        db.session.commit()


        return meeting.to_dict(), None, 200


    except Exception as e:

        # Print full error in terminal
        print("\n========== PROCESSING ERROR ==========")
        traceback.print_exc()
        print("======================================\n")


        meeting.status = "uploaded"

        meeting.processing_error = str(e)

        db.session.commit()


        return None, {
            "error": f"Processing failed: {str(e)}"
        }, 500

def generate_report(user_id, meeting_id):
    meeting = Meeting.query.filter_by(
        id=meeting_id,
        user_id=user_id
    ).first()

    if not meeting:
        return None, {"error": "Meeting not found"}, 404

    if meeting.status != "processed":
        return None, {
            "error": "This meeting must finish processing before a report can be generated."
        }, 400

    reports_dir = os.path.join(current_app.root_path, "..", "storage", "reports")
    os.makedirs(reports_dir, exist_ok=True)
    output_path = os.path.join(reports_dir, f"{meeting.id}.pdf")

    try:
        generate_meeting_report(meeting.to_dict(), output_path)
        meeting.has_pdf = True
        db.session.commit()
        return output_path, None, 200

    except Exception as e:
        print("\n========== REPORT GENERATION ERROR ==========")
        traceback.print_exc()
        print("===============================================\n")
        return None, {"error": f"Report generation failed: {str(e)}"}, 500