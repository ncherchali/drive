"""Audit outbox processing (passe 3).

Ships PENDING `AuditOutboxEntry` rows to the configured `AuditEventSink`. A row
is locked (`select_for_update(skip_locked=True)`) so concurrent workers never
double-deliver, emitted, then marked DELIVERED — or its attempt count is bumped
and, past `max_attempts`, dead-lettered (FAILED). Idempotent: delivered/failed
rows are never reprocessed.
"""

import logging

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from core import models
from core.audit_sink import get_audit_event_sink

logger = logging.getLogger(__name__)

Status = models.AuditOutboxStatusChoices


def process_pending(batch_size=100, max_attempts=None):
    """Deliver a batch of pending outbox entries; return per-status counts."""
    if max_attempts is None:
        max_attempts = getattr(settings, "AUDIT_OUTBOX_MAX_ATTEMPTS", 5)

    sink = get_audit_event_sink()
    counts = {"delivered": 0, "retried": 0, "failed": 0}

    with transaction.atomic():
        entries = list(
            models.AuditOutboxEntry.objects.select_for_update(skip_locked=True)
            .filter(status=Status.PENDING)
            .order_by("created_at")[:batch_size]
        )
        for entry in entries:
            try:
                sink.emit(entry.payload)
            except Exception as exc:  # noqa: BLE001  pylint: disable=broad-except
                # Any sink failure must be captured (retry / dead-letter), never
                # propagated — that is the whole point of the outbox.
                entry.attempts += 1
                entry.last_error = str(exc)[:1000]
                if entry.attempts >= max_attempts:
                    entry.status = Status.FAILED
                    counts["failed"] += 1
                    logger.error(
                        "Audit outbox entry %s dead-lettered after %d attempts",
                        entry.pk,
                        entry.attempts,
                    )
                else:
                    counts["retried"] += 1
                entry.save(
                    update_fields=["attempts", "last_error", "status", "updated_at"]
                )
                continue
            entry.status = Status.DELIVERED
            entry.delivered_at = timezone.now()
            entry.save(update_fields=["status", "delivered_at", "updated_at"])
            counts["delivered"] += 1

    return counts
