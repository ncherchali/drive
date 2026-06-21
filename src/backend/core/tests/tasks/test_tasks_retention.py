"""Tests for the retention disposition task (E3.1)."""

from datetime import timedelta

from django.test.utils import override_settings
from django.utils import timezone

import pytest

from core import factories
from core.tasks.retention import dispose_expired_items

pytestmark = pytest.mark.django_db


def _expired():
    item = factories.ItemFactory()
    item.retention_until = timezone.now() - timedelta(days=1)
    item.save(update_fields=["retention_until"])
    return item


@override_settings(FEATURES_RETENTION_DISPOSITION=False)
def test_task_is_noop_when_feature_off():
    item = _expired()
    assert dispose_expired_items() is None
    item.refresh_from_db()
    assert item.deleted_at is None


@override_settings(FEATURES_RETENTION_DISPOSITION=True)
def test_task_disposes_expired_items_when_feature_on():
    item = _expired()
    result = dispose_expired_items()
    assert result["disposed"] == 1
    item.refresh_from_db()
    assert item.deleted_at is not None
