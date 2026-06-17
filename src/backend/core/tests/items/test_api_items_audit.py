"""Tests that item operations record audit events (A2-2)."""

import pytest
from rest_framework.test import APIClient

from core import factories, models

pytestmark = pytest.mark.django_db


def _client(user):
    client = APIClient()
    client.force_login(user)
    return client


def test_api_items_create_records_audit_event():
    """Creating a top-level item records an `item.create` audit event."""
    user = factories.UserFactory()
    response = _client(user).post(
        "/api/v1.0/items/",
        {"title": "audited", "type": models.ItemTypeChoices.FOLDER},
        format="json",
    )
    assert response.status_code == 201
    item_id = response.json()["id"]

    event = models.AuditEvent.objects.get(action="item.create")
    assert event.actor == user
    assert event.actor_type == models.AuditActorTypeChoices.USER
    assert str(event.target_uuid) == item_id
    assert event.target_type == "item"
    assert event.metadata == {"type": models.ItemTypeChoices.FOLDER}


def test_api_items_create_child_records_audit_event():
    """Creating a child item records an `item.create` event with the parent id."""
    user = factories.UserFactory()
    parent = factories.ItemFactory(
        type=models.ItemTypeChoices.FOLDER, users=[(user, models.RoleChoices.OWNER)]
    )
    response = _client(user).post(
        f"/api/v1.0/items/{parent.id!s}/children/",
        {"title": "child", "type": models.ItemTypeChoices.FOLDER},
        format="json",
    )
    assert response.status_code == 201

    event = models.AuditEvent.objects.get(action="item.create")
    assert event.actor == user
    assert event.metadata["parent_id"] == str(parent.id)


def test_api_items_update_records_audit_event():
    """Updating an item records an `item.update` audit event."""
    user = factories.UserFactory()
    item = factories.ItemFactory(
        type=models.ItemTypeChoices.FOLDER, users=[(user, models.RoleChoices.OWNER)]
    )
    response = _client(user).patch(
        f"/api/v1.0/items/{item.id!s}/",
        {"title": "renamed"},
        format="json",
    )
    assert response.status_code == 200

    event = models.AuditEvent.objects.get(action="item.update")
    assert event.actor == user
    assert str(event.target_uuid) == str(item.id)


def test_api_items_trash_records_audit_event():
    """Soft-deleting an item records an `item.trash` audit event."""
    user = factories.UserFactory()
    item = factories.ItemFactory(
        type=models.ItemTypeChoices.FOLDER, users=[(user, models.RoleChoices.OWNER)]
    )
    response = _client(user).delete(f"/api/v1.0/items/{item.id!s}/")
    assert response.status_code == 204

    event = models.AuditEvent.objects.get(action="item.trash")
    assert event.actor == user
    assert str(event.target_uuid) == str(item.id)


def test_api_items_restore_records_audit_event():
    """Restoring a trashed item records an `item.restore` audit event."""
    user = factories.UserFactory()
    item = factories.ItemFactory(
        type=models.ItemTypeChoices.FOLDER, users=[(user, models.RoleChoices.OWNER)]
    )
    item.soft_delete()

    response = _client(user).post(f"/api/v1.0/items/{item.id!s}/restore/")
    assert response.status_code == 200

    event = models.AuditEvent.objects.get(action="item.restore")
    assert event.actor == user
    assert str(event.target_uuid) == str(item.id)
