"""
tasks.py — Celery background task definitions
Covers: async risk assessment, message auto-destruct, threat monitoring.
Celery + Redis as message broker (as per report Table 3.1).
"""

import os
from celery import Celery
from celery.schedules import crontab

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "lifeline",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="Africa/Nairobi",
    enable_utc=True,
    task_track_started=True,
    worker_max_tasks_per_child=100,
    beat_schedule={
        # Purge expired auto-destruct messages every 5 minutes
        "purge-expired-messages": {
            "task": "tasks.purge_expired_messages",
            "schedule": crontab(minute="*/5"),
        },
        # Health-check ping every minute
        "health-ping": {
            "task": "tasks.health_ping",
            "schedule": crontab(minute="*"),
        },
    },
)


@celery_app.task(name="tasks.schedule_message_destruct", bind=True, max_retries=3)
def schedule_message_destruct(self, message_id: str):
    """
    Permanently delete a message after its auto_destruct_at time.
    Scheduled via apply_async(eta=...) from websocket.py.
    """
    from database import SessionLocal
    from models import Message
    from datetime import datetime, timezone

    db = SessionLocal()
    try:
        msg = db.query(Message).filter_by(id=message_id).first()
        if msg and msg.auto_destruct_at and msg.auto_destruct_at <= datetime.now(timezone.utc):
            db.delete(msg)
            db.commit()
            print(f"[Celery] Auto-destructed message {message_id}")
    except Exception as exc:
        db.rollback()
        raise self.retry(exc=exc, countdown=30)
    finally:
        db.close()


@celery_app.task(name="tasks.purge_expired_messages")
def purge_expired_messages():
    """Periodic sweep for any messages past their auto_destruct_at."""
    from database import SessionLocal
    from models import Message
    from datetime import datetime, timezone
    from sqlalchemy import and_

    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        deleted = (
            db.query(Message)
            .filter(
                Message.auto_destruct_at.isnot(None),
                Message.auto_destruct_at <= now,
            )
            .delete(synchronize_session=False)
        )
        db.commit()
        if deleted:
            print(f"[Celery] Purged {deleted} expired message(s)")
    except Exception as e:
        db.rollback()
        print(f"[Celery] purge_expired_messages error: {e}")
    finally:
        db.close()


@celery_app.task(name="tasks.async_risk_assessment", bind=True, max_retries=2)
def async_risk_assessment(self, assessment_id: str, text: str, case_id: str = None):
    """
    Run risk assessment asynchronously (Celery task).
    Updates the risk_assessment record in DB when done.
    Triggers case escalation if high/critical.
    """
    import asyncio
    from database import SessionLocal
    from models import RiskAssessment, Case, Alert
    from risk_engine import assess_risk
    import uuid as _uuid
    from datetime import datetime, timezone

    db = SessionLocal()
    try:
        loop = asyncio.new_event_loop()
        result = loop.run_until_complete(assess_risk(text))
        loop.close()

        ra = db.query(RiskAssessment).filter_by(id=assessment_id).first()
        if ra:
            ra.risk_level  = result["risk_level"]
            ra.confidence  = result["confidence"]
            ra.explanation = result.get("explanation", {})
            ra.model_version = result.get("model_version", "openrouter-v1")

        if case_id:
            case = db.query(Case).filter_by(id=case_id).first()
            if case:
                risk_order = {"low": 0, "medium": 1, "high": 2, "critical": 3}
                if risk_order.get(result["risk_level"], 0) > risk_order.get(case.risk_level, 0):
                    case.risk_level = result["risk_level"]
                    case.is_flagged = result["risk_level"] in ("high", "critical")

                if result["risk_level"] in ("high", "critical"):
                    alert = Alert(
                        id=_uuid.uuid4(),
                        case_id=case_id,
                        risk_level=result["risk_level"],
                        trigger_text=text[:500],
                        risk_score=result["confidence"],
                        explanation=result.get("explanation", {}),
                    )
                    db.add(alert)

        db.commit()
        return result
    except Exception as exc:
        db.rollback()
        raise self.retry(exc=exc, countdown=10)
    finally:
        db.close()


@celery_app.task(name="tasks.send_email_notification")
def send_email_notification(to_email: str, subject: str, body: str):
    """
    Send email via SendGrid (production) or log (development).
    Swap SENDGRID_API_KEY in .env to enable real emails.
    """
    sendgrid_key = os.environ.get("SENDGRID_API_KEY")
    if sendgrid_key:
        try:
            import sendgrid
            from sendgrid.helpers.mail import Mail
            sg = sendgrid.SendGridAPIClient(sendgrid_key)
            message = Mail(
                from_email=os.environ.get("EMAIL_FROM", "noreply@lifeline.ke"),
                to_emails=to_email,
                subject=subject,
                html_content=body,
            )
            sg.send(message)
            print(f"[Email] Sent to {to_email}: {subject}")
        except Exception as e:
            print(f"[Email] SendGrid error: {e}")
    else:
        print(f"[Email DEV] To: {to_email}\nSubject: {subject}\n{body}")


@celery_app.task(name="tasks.health_ping")
def health_ping():
    """Heartbeat task to confirm Celery worker is alive."""
    from datetime import datetime
    return {"status": "ok", "ts": datetime.utcnow().isoformat()}