"""Asynchronous audit-capture tasks (A2-5).

Media access is authorized on a high-frequency Nginx subrequest
(`media_auth`); auditing it inline would slow every byte-serving request.
These tasks let the access be recorded out of the request path.
"""

import logging

from core import models
from core.services import audit

from drive.celery_app import app

logger = logging.getLogger(__name__)


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
