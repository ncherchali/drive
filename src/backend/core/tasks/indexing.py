"""Semantic-indexing hooks (H1.11 / B1-4, AI-ready foundation).

Posts an indexing message on the dedicated `indexing` Celery queue when content
is uploaded and semantic indexing is enabled. The task is a no-op placeholder;
the real embedding pipeline (extract → embed → upsert into ItemEmbedding) lands
in H2.2.
"""

import logging

from django.conf import settings

from drive.celery_app import app

logger = logging.getLogger(__name__)


@app.task(queue="indexing")
def index_item(item_id):
    """Placeholder semantic-indexing task (no-op until H2.2)."""
    logger.info("Semantic indexing requested for item %s (no-op placeholder)", item_id)


def enqueue_indexing(item):
    """Post an indexing message for an item when semantic indexing is enabled."""
    if getattr(settings, "FEATURES_SEMANTIC_INDEX", False):
        index_item.delay(str(item.id))
