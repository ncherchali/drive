"""API tests for retention policies (E3.1): registry CRUD + apply."""

import pytest
from rest_framework.test import APIClient

from core import factories, models

pytestmark = pytest.mark.django_db

REGISTRY_URL = "/api/v1.0/retention-policies/"
APPLY_URL = "/api/v1.0/items/{id}/apply-retention-policy/"
R = models.RoleChoices


def _client(user):
    client = APIClient()
    client.force_login(user)
    return client


# --- Registry (admin-only) ---------------------------------------------------


def test_api_create_policy_requires_admin():
    user = factories.UserFactory()
    response = _client(user).post(
        REGISTRY_URL,
        {"key": "contracts", "name": "Contracts", "duration_days": 3650},
        format="json",
    )
    assert response.status_code == 403


def test_api_admin_creates_policy():
    admin = factories.UserFactory(is_staff=True)
    response = _client(admin).post(
        REGISTRY_URL,
        {"key": "contracts", "name": "Contracts", "duration_days": 3650},
        format="json",
    )
    assert response.status_code == 201
    assert models.RetentionPolicy.objects.get(key="contracts").duration_days == 3650


def test_api_registry_is_readable_by_any_authenticated_user():
    """Reading the registry is open (managers pick a policy to apply)."""
    user = factories.UserFactory()
    factories.RetentionPolicyFactory(key="contracts")
    response = _client(user).get(REGISTRY_URL)
    assert response.status_code == 200
    assert "contracts" in [p["key"] for p in response.json()]


# --- Apply to an item --------------------------------------------------------


def test_api_manager_applies_policy():
    owner = factories.UserFactory()
    item = factories.ItemFactory(users=[(owner, R.OWNER)])
    policy = factories.RetentionPolicyFactory(key="contracts", duration_days=100)

    response = _client(owner).post(
        APPLY_URL.format(id=item.id), {"policy": policy.key}, format="json"
    )

    assert response.status_code == 200
    item.refresh_from_db()
    assert item.is_under_retention


def test_api_apply_unknown_policy_returns_404():
    owner = factories.UserFactory()
    item = factories.ItemFactory(users=[(owner, R.OWNER)])

    response = _client(owner).post(
        APPLY_URL.format(id=item.id), {"policy": "ghost"}, format="json"
    )
    assert response.status_code == 404


def test_api_apply_forbidden_for_editor():
    owner = factories.UserFactory()
    editor = factories.UserFactory()
    item = factories.ItemFactory(
        users=[(owner, R.OWNER), (editor, R.EDITOR)],
    )
    policy = factories.RetentionPolicyFactory(key="contracts")

    response = _client(editor).post(
        APPLY_URL.format(id=item.id), {"policy": policy.key}, format="json"
    )
    assert response.status_code == 403
