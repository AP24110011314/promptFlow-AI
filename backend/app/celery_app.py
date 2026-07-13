import os
from celery import Celery

# Initialize Celery app
celery_broker = os.getenv("CELERY_BROKER_URL", "redis://redis:6379/0")
celery_backend = os.getenv("CELERY_RESULT_BACKEND", "redis://redis:6379/0")

celery_app = Celery(
    "crd_tasks",
    broker=celery_broker,
    backend=celery_backend,
    include=["app.tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
)
