"""Tests for the AI-ready foundations: embeddings table & indexing hook (H1.11)."""

from unittest import mock

from django.test import override_settings

import pytest

from core import factories, models
from core.tasks.indexing import enqueue_indexing, index_item

pytestmark = pytest.mark.django_db


def test_item_embedding_stores_vector():
    """The embeddings table accepts a vector and its dimension (B1-3)."""
    item = factories.ItemFactory()
    embedding = models.ItemEmbedding.objects.create(
        item=item,
        model_name="test-model",
        dimension=3,
        embedding=[1.0, 2.0, 3.0],
    )
    embedding.refresh_from_db()
    assert embedding.embedding == [1.0, 2.0, 3.0]
    assert embedding.dimension == 3


@override_settings(FEATURES_SEMANTIC_INDEX=False)
def test_enqueue_indexing_noop_when_flag_off():
    """No indexing message is posted while the feature is off (B1-4)."""
    item = factories.ItemFactory()
    with mock.patch("core.tasks.indexing.index_item.delay") as delay:
        enqueue_indexing(item)
    delay.assert_not_called()


@override_settings(FEATURES_SEMANTIC_INDEX=True)
def test_enqueue_indexing_posts_when_flag_on():
    """An indexing message is posted when the feature is on (B1-4)."""
    item = factories.ItemFactory()
    with mock.patch("core.tasks.indexing.index_item.delay") as delay:
        enqueue_indexing(item)
    delay.assert_called_once_with(str(item.id))


def test_index_item_task_is_a_noop():
    """The placeholder task runs without error."""
    assert index_item("00000000-0000-0000-0000-000000000000") is None
