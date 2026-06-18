"""Tests for personal-data rights: export & erasure (H1.10 / ANPDP)."""

import pytest
from rest_framework.test import APIClient

from core import factories, models

pytestmark = pytest.mark.django_db

EXPORT_URL = "/api/v1.0/users/me/data-export/"
DELETION_URL = "/api/v1.0/users/me/data-deletion/"


def _client(user):
    client = APIClient()
    client.force_login(user)
    return client


def test_data_export_anonymous_is_denied():
    assert APIClient().get(EXPORT_URL).status_code == 401


def test_data_export_returns_personal_data_and_audits():
    user = factories.UserFactory()
    item = factories.ItemFactory(creator=user)

    response = _client(user).get(EXPORT_URL)
    assert response.status_code == 200
    body = response.json()
    assert body["profile"]["email"] == user.email
    assert body["profile"]["sub"] == user.sub
    item_ids = [entry["id"] for entry in body["items_created"]]
    assert str(item.id) in item_ids
    assert models.AuditEvent.objects.filter(action="user.data_export").exists()


def test_data_deletion_anonymizes_and_deactivates():
    user = factories.UserFactory(full_name="Jane Doe", short_name="Jane")

    response = _client(user).post(DELETION_URL)
    assert response.status_code == 200

    user.refresh_from_db()
    assert user.email is None
    assert user.full_name is None
    assert user.short_name is None
    assert user.is_active is False
    assert models.AuditEvent.objects.filter(action="user.data_deletion").exists()


def test_data_deletion_anonymous_is_denied():
    assert APIClient().post(DELETION_URL).status_code == 401
