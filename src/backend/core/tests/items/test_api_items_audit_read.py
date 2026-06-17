"""Tests for the item audit trail read endpoint (A2-6)."""

import pytest
from rest_framework.test import APIClient

from core import factories, models

pytestmark = pytest.mark.django_db


def _client(user):
    client = APIClient()
    client.force_login(user)
    return client


def test_api_items_audit_anonymous_is_denied():
    """Anonymous users cannot read an item's audit trail."""
    item = factories.ItemFactory(type=models.ItemTypeChoices.FOLDER)
    response = APIClient().get(f"/api/v1.0/items/{item.id!s}/audit/")
    assert response.status_code == 401


def test_api_items_audit_owner_sees_trail():
    """An owner reads the item's audit trail, newest first."""
    user = factories.UserFactory()
    item = factories.ItemFactory(
        type=models.ItemTypeChoices.FOLDER, users=[(user, models.RoleChoices.OWNER)]
    )
    factories.AuditEventFactory(action="item.create", target=item, actor=user)
    factories.AuditEventFactory(action="item.update", target=item, actor=user)
    # An event on another item must not leak into this trail.
    factories.AuditEventFactory(action="item.update")

    response = _client(user).get(f"/api/v1.0/items/{item.id!s}/audit/")
    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 2
    actions = {event["action"] for event in body["results"]}
    assert actions == {"item.create", "item.update"}
    assert all(str(event["target_uuid"]) == str(item.id) for event in body["results"])


def test_api_items_audit_reader_is_forbidden():
    """A non-managing collaborator (reader) cannot read the audit trail."""
    owner = factories.UserFactory()
    reader = factories.UserFactory()
    item = factories.ItemFactory(
        type=models.ItemTypeChoices.FOLDER,
        users=[(owner, models.RoleChoices.OWNER), (reader, models.RoleChoices.READER)],
    )
    factories.AuditEventFactory(target=item, actor=owner)

    response = _client(reader).get(f"/api/v1.0/items/{item.id!s}/audit/")
    assert response.status_code == 403


def test_api_items_audit_end_to_end_records_and_lists_create():
    """Creating an item then reading its trail surfaces the item.create event."""
    user = factories.UserFactory()
    client = _client(user)
    created = client.post(
        "/api/v1.0/items/",
        {"title": "tracked", "type": models.ItemTypeChoices.FOLDER},
        format="json",
    )
    item_id = created.json()["id"]

    response = client.get(f"/api/v1.0/items/{item_id}/audit/")
    assert response.status_code == 200
    actions = [event["action"] for event in response.json()["results"]]
    assert "item.create" in actions
