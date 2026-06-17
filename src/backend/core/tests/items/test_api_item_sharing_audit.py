"""Tests that sharing operations (accesses, invitations) record audit events (A2-3)."""

from unittest import mock

import pytest
from rest_framework.test import APIClient

from core import factories, models

pytestmark = pytest.mark.django_db


def _client(user):
    client = APIClient()
    client.force_login(user)
    return client


def test_api_item_access_create_records_audit_event():
    """Granting an access records an `access.create` event on the item (no PII)."""
    user = factories.UserFactory()
    grantee = factories.UserFactory()
    item = factories.ItemFactory(
        type=models.ItemTypeChoices.FOLDER, users=[(user, models.RoleChoices.OWNER)]
    )

    with mock.patch.object(models.Item, "send_invitation_email"):
        response = _client(user).post(
            f"/api/v1.0/items/{item.id!s}/accesses/",
            {"user_id": str(grantee.id), "role": models.RoleChoices.EDITOR},
            format="json",
        )
    assert response.status_code == 201

    event = models.AuditEvent.objects.get(action="access.create")
    assert event.actor == user
    assert str(event.target_uuid) == str(item.id)
    assert event.metadata["role"] == models.RoleChoices.EDITOR
    assert event.metadata["grantee_user"] == grantee.sub


def test_api_item_access_delete_records_audit_event():
    """Revoking an access records an `access.delete` event on the item."""
    user = factories.UserFactory()
    grantee = factories.UserFactory()
    item = factories.ItemFactory(
        type=models.ItemTypeChoices.FOLDER, users=[(user, models.RoleChoices.OWNER)]
    )
    access = factories.UserItemAccessFactory(
        item=item, user=grantee, role=models.RoleChoices.EDITOR
    )

    response = _client(user).delete(f"/api/v1.0/items/{item.id!s}/accesses/{access.id!s}/")
    assert response.status_code == 204

    event = models.AuditEvent.objects.get(action="access.delete")
    assert event.actor == user
    assert str(event.target_uuid) == str(item.id)
    assert event.metadata["grantee_user"] == grantee.sub


def test_api_item_invitation_create_records_audit_event_without_pii():
    """Inviting a user records an `invitation.create` event without the email (PII)."""
    user = factories.UserFactory()
    item = factories.ItemFactory(
        type=models.ItemTypeChoices.FOLDER, users=[(user, models.RoleChoices.OWNER)]
    )

    with mock.patch.object(models.Item, "send_invitation_email"):
        response = _client(user).post(
            f"/api/v1.0/items/{item.id!s}/invitations/",
            {"email": "newcomer@example.com", "role": models.RoleChoices.EDITOR},
            format="json",
        )
    assert response.status_code == 201

    event = models.AuditEvent.objects.get(action="invitation.create")
    assert event.actor == user
    assert str(event.target_uuid) == str(item.id)
    assert event.metadata["role"] == models.RoleChoices.EDITOR
    # No PII (email) must be stored in the audit metadata.
    assert "newcomer@example.com" not in str(event.metadata)
