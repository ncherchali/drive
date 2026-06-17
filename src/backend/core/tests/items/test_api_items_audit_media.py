"""Tests for asynchronous media-access audit capture (A2-5)."""

import uuid

import pytest
from rest_framework.test import APIClient

from core import factories, models
from core.tasks.audit import record_media_access

pytestmark = pytest.mark.django_db


def test_task_record_media_access_creates_event():
    """The task records a download event targeting the item."""
    user = factories.UserFactory()
    item = factories.ItemFactory(type=models.ItemTypeChoices.FILE)

    record_media_access(
        "item.download",
        str(user.id),
        models.AuditActorTypeChoices.USER,
        str(item.id),
        str(item.path),
    )

    event = models.AuditEvent.objects.get(action="item.download")
    assert event.actor == user
    assert event.actor_type == models.AuditActorTypeChoices.USER
    assert str(event.target_uuid) == str(item.id)


def test_task_record_media_access_missing_item_still_records():
    """A purged item still yields an audit row with the denormalized id."""
    gone_id = uuid.uuid4()

    record_media_access(
        "item.download",
        None,
        models.AuditActorTypeChoices.ANONYMOUS,
        str(gone_id),
    )

    event = models.AuditEvent.objects.get(action="item.download")
    assert event.actor is None
    assert event.actor_type == models.AuditActorTypeChoices.ANONYMOUS
    assert event.metadata["item_id"] == str(gone_id)


def test_api_media_auth_download_records_audit():
    """A real download (non-preview) records an item.download event (Celery eager)."""
    item = factories.ItemFactory(
        link_reach="public",
        type=models.ItemTypeChoices.FILE,
        update_upload_state=models.ItemUploadStateChoices.READY,
    )

    # media-auth only signs S3 headers (no file read), so no object is needed.
    original_url = f"http://localhost/media/{item.file_key:s}"
    response = APIClient().get("/api/v1.0/items/media-auth/", HTTP_X_ORIGINAL_URL=original_url)

    assert response.status_code == 200
    assert models.AuditEvent.objects.filter(action="item.download", target_uuid=item.id).exists()


def test_api_media_auth_preview_does_not_record():
    """A preview (thumbnail) access must not flood the audit trail."""
    item = factories.ItemFactory(
        link_reach="public",
        type=models.ItemTypeChoices.FILE,
        filename="image.png",
        mimetype="image/png",
        update_upload_state=models.ItemUploadStateChoices.READY,
    )

    original_url = f"http://localhost/media/preview/{item.file_key:s}"
    response = APIClient().get("/api/v1.0/items/media-auth/", HTTP_X_ORIGINAL_URL=original_url)

    assert response.status_code == 200
    assert not models.AuditEvent.objects.filter(action="item.download").exists()
