"""Retention disposition task (E3.1).

Scheduled disposal of items past retention (soft-delete to trashbin), gated by
FEATURES_RETENTION_DISPOSITION so it is a cheap no-op when disabled.
"""

import logging

from django.conf import settings

from core.services import retention

from drive.celery_app import app

logger = logging.getLogger(__name__)


@app.task
def dispose_expired_items(batch_size=100):
    """Dispose of a batch of items whose retention has expired (E3.1).

    No-op when FEATURES_RETENTION_DISPOSITION is off.
    """
    if not getattr(settings, "FEATURES_RETENTION_DISPOSITION", False):
        return None

    result = retention.run_disposition(batch_size=batch_size)
    logger.info("Retention disposition: %s", result)
    return result
