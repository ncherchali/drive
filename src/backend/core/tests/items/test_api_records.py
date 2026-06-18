"""API tests for structured records (E2.2 / ADR-0001 phase 4)."""

import pytest
from rest_framework.test import APIClient

from core import factories, models

pytestmark = pytest.mark.django_db

RECORDS_URL = "/api/v1.0/items/{id}/records/"
CHILDREN_URL = "/api/v1.0/items/{id}/children/"


def _client(user):
    client = APIClient()
    client.force_login(user)
    return client


def test_api_create_record_via_dedicated_action():
    owner = factories.UserFactory()
    folder = factories.ItemFactory(
        type=models.ItemTypeChoices.FOLDER,
        users=[(owner, models.RoleChoices.OWNER)],
    )

    response = _client(owner).post(
        RECORDS_URL.format(id=folder.id),
        {
            "title": "Client ACME",
            "content_type": "fiche_client",
            "metadata": {"raison_sociale": "ACME", "segment": "pme"},
        },
        format="json",
    )

    assert response.status_code == 201
    body = response.json()
    assert body["type"] == "record"
    record = models.Item.objects.get(id=body["id"])
    assert record.content_type == "fiche_client"
    assert record.metadata["fiche_client"]["raison_sociale"] == "ACME"


def test_api_create_record_invalid_metadata_returns_400():
    owner = factories.UserFactory()
    folder = factories.ItemFactory(
        type=models.ItemTypeChoices.FOLDER,
        users=[(owner, models.RoleChoices.OWNER)],
    )

    response = _client(owner).post(
        RECORDS_URL.format(id=folder.id),
        {
            "title": "Bad",
            "content_type": "fiche_client",
            "metadata": {"encours": "nope"},
        },
        format="json",
    )
    assert response.status_code == 400


def test_api_create_record_forbidden_for_reader():
    owner = factories.UserFactory()
    reader = factories.UserFactory()
    folder = factories.ItemFactory(
        type=models.ItemTypeChoices.FOLDER,
        users=[
            (owner, models.RoleChoices.OWNER),
            (reader, models.RoleChoices.READER),
        ],
    )

    response = _client(reader).post(
        RECORDS_URL.format(id=folder.id),
        {"title": "Nope"},
        format="json",
    )
    assert response.status_code == 403


def test_api_record_can_be_created_as_plain_child_with_type():
    """RECORD is a first-class item type accepted by the generic children API."""
    owner = factories.UserFactory()
    folder = factories.ItemFactory(
        type=models.ItemTypeChoices.FOLDER,
        users=[(owner, models.RoleChoices.OWNER)],
    )

    response = _client(owner).post(
        CHILDREN_URL.format(id=folder.id),
        {"title": "Fiche", "type": "record"},
        format="json",
    )

    assert response.status_code == 201
    assert response.json()["type"] == "record"


def test_api_record_is_shared_like_any_item():
    """A record lives in the tree: access rules apply (a reader can see it)."""
    owner = factories.UserFactory()
    reader = factories.UserFactory()
    folder = factories.ItemFactory(
        type=models.ItemTypeChoices.FOLDER,
        users=[
            (owner, models.RoleChoices.OWNER),
            (reader, models.RoleChoices.READER),
        ],
    )
    record = factories.ItemFactory(
        parent=folder, type=models.ItemTypeChoices.RECORD
    )

    response = _client(reader).get(f"/api/v1.0/items/{record.id}/")
    assert response.status_code == 200
    assert response.json()["type"] == "record"
