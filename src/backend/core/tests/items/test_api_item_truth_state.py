"""Tests for the canonical status (truth_state) of items (B1-2)."""

import pytest
from rest_framework.test import APIClient

from core import factories, models

pytestmark = pytest.mark.django_db

URL = "/api/v1.0/items/{id}/truth-state/"


def _client(user):
    client = APIClient()
    client.force_login(user)
    return client


def test_models_item_truth_state_defaults_to_draft():
    """A new item carries the DRAFT status from creation."""
    item = factories.ItemFactory()
    item.refresh_from_db()
    assert item.truth_state == models.TruthStateChoices.DRAFT


def test_api_item_promote_to_canonical_as_editor_records_audit():
    """An editor can promote an item to CANONICAL; the act is audited."""
    owner = factories.UserFactory()
    editor = factories.UserFactory()
    item = factories.ItemFactory(
        type=models.ItemTypeChoices.FOLDER,
        users=[(owner, models.RoleChoices.OWNER), (editor, models.RoleChoices.EDITOR)],
    )

    response = _client(editor).post(
        URL.format(id=item.id),
        {"truth_state": models.TruthStateChoices.CANONICAL},
        format="json",
    )

    assert response.status_code == 200
    assert response.json()["truth_state"] == models.TruthStateChoices.CANONICAL
    item.refresh_from_db()
    assert item.truth_state == models.TruthStateChoices.CANONICAL
    assert models.AuditEvent.objects.filter(
        action="item.truth_state", target_uuid=item.id
    ).exists()


def test_api_item_truth_state_forbidden_for_reader():
    """A reader cannot change the canonical status."""
    owner = factories.UserFactory()
    reader = factories.UserFactory()
    item = factories.ItemFactory(
        type=models.ItemTypeChoices.FOLDER,
        users=[(owner, models.RoleChoices.OWNER), (reader, models.RoleChoices.READER)],
    )

    response = _client(reader).post(
        URL.format(id=item.id),
        {"truth_state": models.TruthStateChoices.CANONICAL},
        format="json",
    )
    assert response.status_code == 403


def test_api_item_truth_state_rejects_invalid_value():
    """An unknown status value is rejected."""
    owner = factories.UserFactory()
    item = factories.ItemFactory(
        type=models.ItemTypeChoices.FOLDER,
        users=[(owner, models.RoleChoices.OWNER)],
    )

    response = _client(owner).post(
        URL.format(id=item.id), {"truth_state": "bogus"}, format="json"
    )
    assert response.status_code == 400


def test_api_item_truth_state_anonymous_is_denied():
    """Anonymous users cannot change the canonical status."""
    item = factories.ItemFactory(type=models.ItemTypeChoices.FOLDER)
    response = APIClient().post(
        URL.format(id=item.id),
        {"truth_state": models.TruthStateChoices.CANONICAL},
        format="json",
    )
    assert response.status_code in (401, 403)
