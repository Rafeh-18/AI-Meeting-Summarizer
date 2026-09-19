from datetime import datetime, timedelta
from app.models.meeting import Meeting


def get_analytics_for_user(user_id):
    meetings = Meeting.query.filter_by(user_id=user_id).all()

    # Last 8 weeks, oldest first
    today = datetime.utcnow().date()
    week_starts = [today - timedelta(days=today.weekday() + 7 * i) for i in range(7, -1, -1)]

    weekly = []
    for start in week_starts:
        end = start + timedelta(days=7)
        in_week = [
            m for m in meetings
            if start <= m.created_at.date() < end
        ]
        weekly.append({
            "week_label": start.strftime("%b %d"),
            "meetings_count": len(in_week),
            "hours": round(sum(m.duration_seconds for m in in_week) / 3600, 1),
        })

    status_breakdown = {"uploaded": 0, "processing": 0, "processed": 0}
    for m in meetings:
        if m.status in status_breakdown:
            status_breakdown[m.status] += 1

    total_meetings = len(meetings)
    avg_duration = (
        round(sum(m.duration_seconds for m in meetings) / total_meetings / 60, 1)
        if total_meetings else 0
    )
    total_action_items = sum(m.action_item_count for m in meetings)

    return {
        "weekly": weekly,
        "status_breakdown": status_breakdown,
        "total_meetings": total_meetings,
        "avg_duration_minutes": avg_duration,
        "total_action_items": total_action_items,
    }