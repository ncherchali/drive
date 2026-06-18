"""Tests for retention and legal holds (H1.6 / Coffre)."""

from datetime import timedelta

from django.core.exceptions import ValidationError
from django.utils import timezone

import pytest
from rest_framework.test import APIClient

from core import factories, models
from core.tasks.item import process_item_purge

pytestmark = pytest.mark.django_db


def _client(user):
    client = APIClient()
    client.force_login(user)
    return client


def _folder(owner, *extra_users):
    return factories.ItemFactory(
        type=models.ItemTypeChoices.FOLDER,
        users=[(owner, models.RoleChoices.OWNER), *extra_users],
    )


# --- model interception ----------------------------------------------------


def test_soft_delete_blocked_under_retention():
    item = factories.ItemFactory(type=models.ItemTypeChoices.FOLDER)
    item.retention_until = timezone.now() + timedelta(days=10)
    item.save()
    assert item.is_locked is True
    with pytest.raises(ValidationError):
        item.soft_delete()


def test_soft_delete_blocked_under_legal_hold():
    item = factories.ItemFactory(type=models.ItemTypeChoices.FOLDER)
    factories.LegalHoldFactory(item=item, is_active=True)
    assert item.is_under_legal_hold is True
    with pytest.raises(ValidationError):
        item.soft_delete()


def test_expired_retention_does_not_lock():
    item = factories.ItemFactory(type=models.ItemTypeChoices.FOLDER)
    item.retention_until = timezone.now() - timedelta(days=1)
    item.save()
    assert item.is_locked is False


def test_purge_skips_item_under_legal_hold():
    item = factories.ItemFactory(type=models.ItemTypeChoices.FOLDER)
    # Soft-delete far in the past so it would otherwise be purgeable.
    past = timezone.now() - timedelta(days=999)
    item.deleted_at = item.ancestors_deleted_at = past
    item.save()
    factories.LegalHoldFactory(item=item, is_active=True)

    process_item_purge(item.id)

    assert models.Item.objects.filter(id=item.id).exists()


# --- retention API ---------------------------------------------------------


def test_api_retention_blocks_deletion_and_audits():
    owner = factories.UserFactory()
    item = _folder(owner)

    response = _client(owner).post(
        f"/api/v1.0/items/{item.id!s}/retention/",
        {"duration_days": 30},
        format="json",
    )
    assert response.status_code == 200
    assert models.AuditEvent.objects.filter(
        action="item.retention_set", target_uuid=item.id
    ).exists()

    deleted = _client(owner).delete(f"/api/v1.0/items/{item.id!s}/")
    assert deleted.status_code == 400


def test_api_retention_get_reads_current_deadline():
    owner = factories.UserFactory()
    item = _folder(owner)
    client = _client(owner)

    assert client.get(f"/api/v1.0/items/{item.id!s}/retention/").json() == {
        "retention_until": None
    }
    client.post(
        f"/api/v1.0/items/{item.id!s}/retention/",
        {"duration_days": 30},
        format="json",
    )
    assert client.get(f"/api/v1.0/items/{item.id!s}/retention/").json()[
        "retention_until"
    ] is not None


def test_api_retention_is_extend_only():
    owner = factories.UserFactory()
    item = _folder(owner)
    client = _client(owner)
    client.post(
        f"/api/v1.0/items/{item.id!s}/retention/",
        {"duration_days": 30},
        format="json",
    )
    response = client.post(
        f"/api/v1.0/items/{item.id!s}/retention/",
        {"duration_days": 10},
        format="json",
    )
    assert response.status_code == 400


def test_api_retention_forbidden_for_reader():
    owner = factories.UserFactory()
    reader = factories.UserFactory()
    item = _folder(owner, (reader, models.RoleChoices.READER))
    response = _client(reader).post(
        f"/api/v1.0/items/{item.id!s}/retention/",
        {"duration_days": 30},
        format="json",
    )
    assert response.status_code == 403


# --- legal hold API --------------------------------------------------------


def test_api_legal_hold_blocks_then_release_allows_deletion():
    owner = factories.UserFactory()
    item = _folder(owner)
    client = _client(owner)

    placed = client.post(
        f"/api/v1.0/items/{item.id!s}/legal-hold/",
        {"reason": "litigation"},
        format="json",
    )
    assert placed.status_code == 201
    hold_id = placed.json()["id"]
    assert models.AuditEvent.objects.filter(action="legal_hold.place").exists()

    assert client.delete(f"/api/v1.0/items/{item.id!s}/").status_code == 400

    released = client.delete(f"/api/v1.0/items/{item.id!s}/legal-hold/{hold_id}/")
    assert released.status_code == 204
    assert models.AuditEvent.objects.filter(action="legal_hold.release").exists()

    assert client.delete(f"/api/v1.0/items/{item.id!s}/").status_code == 204


def test_api_legal_hold_forbidden_for_reader():
    owner = factories.UserFactory()
    reader = factories.UserFactory()
    item = _folder(owner, (reader, models.RoleChoices.READER))
    response = _client(reader).post(
        f"/api/v1.0/items/{item.id!s}/legal-hold/",
        {"reason": "x"},
        format="json",
    )
    assert response.status_code == 403
