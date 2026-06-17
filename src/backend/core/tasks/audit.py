"""Asynchronous audit-capture tasks (A2-5).

Media access is authorized on a high-frequency Nginx subrequest
(`media_auth`); auditing it inline would slow every byte-serving request.
These tasks let the access be recorded out of the request path.
"""

import logging
import re
from datetime import date, timedelta

from django.conf import settings
from django.db import connection
from django.utils import timezone

from core import models
from core.services import audit

from drive.celery_app import app

logger = logging.getLogger(__name__)

# Monthly partitions are named drive_audit_event_y<YYYY>m<MM>.
_PARTITION_RE = re.compile(r"^drive_audit_event_y(\d{4})m(\d{2})$")


def _next_month(year, month):
    """Return the (year, month) following the given month."""
    return (year + 1, 1) if month == 12 else (year, month + 1)


def _ensure_month_partition(cursor, year, month):
    """Create the monthly partition for (year, month) if it does not exist."""
    start = date(year, month, 1)
    next_year, next_month = _next_month(year, month)
    end = date(next_year, next_month, 1)
    name = f"drive_audit_event_y{year}m{month:02d}"
    # Bounds are computed (not user input): safe to interpolate as literals.
    cursor.execute(
        f'CREATE TABLE IF NOT EXISTS "{name}" PARTITION OF drive_audit_event '
        f"FOR VALUES FROM ('{start.isoformat()}') TO ('{end.isoformat()}');"
    )
    return name


@app.task
def record_media_access(action, actor_id, actor_type, item_id, path_snapshot=None):
    """Record an audit event for a media access, off the request path.

    Best-effort: a missing actor/item is logged rather than retried into the
    caller. When the item still exists it is used as the audit target; if it has
    since been purged, the access is still recorded with the denormalized id.
    """
    actor = models.User.objects.filter(pk=actor_id).first() if actor_id else None
    item = models.Item.objects.filter(pk=item_id).first()

    if item is None:
        logger.info("Auditing media access on a missing item %s", item_id)
        audit.record(
            action,
            actor=actor,
            actor_type=actor_type,
            target_type="item",
            path_snapshot=path_snapshot,
            metadata={"item_id": str(item_id)},
        )
        return

    audit.record(
        action,
        actor=actor,
        actor_type=actor_type,
        target=item,
        path_snapshot=path_snapshot,
    )


@app.task
def manage_audit_partitions(months_ahead=3):
    """Maintain the monthly partitions of the audit table (A2-4).

    - Pre-creates the next ``months_ahead`` monthly partitions (future months,
      where the DEFAULT partition holds no rows, so creation never conflicts).
    - When ``settings.AUDIT_RETENTION_DAYS`` is set, drops monthly partitions
      whose whole range is older than the cutoff (efficient retention by
      DROP PARTITION). The DEFAULT partition is never dropped.

    Idempotent — meant to run periodically (Celery beat). The current month's
    partition is provisioned by the conversion migration and by earlier runs,
    so it is intentionally not (re)created here.
    """
    created = []
    dropped = []
    today = timezone.now().date()

    with connection.cursor() as cursor:
        year, month = _next_month(today.year, today.month)
        for _ in range(months_ahead):
            created.append(_ensure_month_partition(cursor, year, month))
            year, month = _next_month(year, month)

        retention = settings.AUDIT_RETENTION_DAYS
        if retention:
            cutoff = today - timedelta(days=int(retention))
            cursor.execute(
                "SELECT c.relname FROM pg_inherits i "
                "JOIN pg_class c ON c.oid = i.inhrelid "
                "JOIN pg_class p ON p.oid = i.inhparent "
                "WHERE p.relname = 'drive_audit_event';"
            )
            for (relname,) in cursor.fetchall():
                matched = _PARTITION_RE.match(relname)
                if not matched:
                    continue
                part_year, part_month = int(matched.group(1)), int(matched.group(2))
                end_year, end_month = _next_month(part_year, part_month)
                if date(end_year, end_month, 1) <= cutoff:
                    cursor.execute(f'DROP TABLE IF EXISTS "{relname}";')
                    dropped.append(relname)

    logger.info("Audit partitions ensured=%s dropped=%s", created, dropped)
    return {"created": created, "dropped": dropped}
