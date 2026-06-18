"""API tests for content object types (E2.2): registry CRUD + item assignment."""

import pytest
from rest_framework.test import APIClient

from core import factories, models

pytestmark = pytest.mark.django_db

REGISTRY_URL = "/api/v1.0/content-object-types/"
ITEM_URL = "/api/v1.0/items/{id}/content-type/"


def _client(user):
    client = APIClient()
    client.force_login(user)
    return client


# --- Registry CRUD (admin-only) ----------------------------------------------


def test_api_create_type_requires_admin():
    user = factories.UserFactory()
    response = _client(user).post(
        REGISTRY_URL,
        {"key": "contract", "label": "Contract", "base": "file"},
        format="json",
    )
    assert response.status_code == 403


def test_api_admin_can_create_type():
    admin = factories.UserFactory(is_staff=True)
    response = _client(admin).post(
        REGISTRY_URL,
        {"key": "contract", "label": "Contract", "base": "file"},
        format="json",
    )
    assert response.status_code == 201
    content_type = models.ContentObjectType.objects.get(key="contract")
    assert content_type.creator == admin


def test_api_registry_lists_seeded_workspace():
    admin = factories.UserFactory(is_staff=True)
    response = _client(admin).get(REGISTRY_URL)
    assert response.status_code == 200
    keys = [t["key"] for t in response.json()]
    assert "workspace" in keys


# --- Item assignment ---------------------------------------------------------


def test_api_editor_assigns_workspace_to_folder():
    owner = factories.UserFactory()
    editor = factories.UserFactory()
    folder = factories.ItemFactory(
        type=models.ItemTypeChoices.FOLDER,
        users=[
            (owner, models.RoleChoices.OWNER),
            (editor, models.RoleChoices.EDITOR),
        ],
    )

    response = _client(editor).post(
        ITEM_URL.format(id=folder.id),
        {"content_type": "workspace"},
        format="json",
    )

    assert response.status_code == 200
    assert response.json() == {"content_type": "workspace"}
    folder.refresh_from_db()
    assert folder.content_type == "workspace"


def test_api_assign_base_mismatch_returns_400():
    owner = factories.UserFactory()
    file_item = factories.ItemFactory(
        type=models.ItemTypeChoices.FILE,
        users=[(owner, models.RoleChoices.OWNER)],
    )

    response = _client(owner).post(
        ITEM_URL.format(id=file_item.id),
        {"content_type": "workspace"},
        format="json",
    )
    assert response.status_code == 400


def test_api_assign_unknown_type_returns_400():
    owner = factories.UserFactory()
    folder = factories.ItemFactory(
        type=models.ItemTypeChoices.FOLDER,
        users=[(owner, models.RoleChoices.OWNER)],
    )

    response = _client(owner).post(
        ITEM_URL.format(id=folder.id),
        {"content_type": "ghost"},
        format="json",
    )
    assert response.status_code == 400


def test_api_clear_content_type_with_null():
    owner = factories.UserFactory()
    folder = factories.ItemFactory(
        type=models.ItemTypeChoices.FOLDER,
        content_type="workspace",
        users=[(owner, models.RoleChoices.OWNER)],
    )

    response = _client(owner).post(
        ITEM_URL.format(id=folder.id),
        {"content_type": None},
        format="json",
    )

    assert response.status_code == 200
    assert response.json() == {"content_type": None}
    folder.refresh_from_db()
    assert folder.content_type is None


def test_api_assign_forbidden_for_reader():
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
        ITEM_URL.format(id=folder.id),
        {"content_type": "workspace"},
        format="json",
    )
    assert response.status_code == 403


def test_api_reader_can_read_content_type():
    owner = factories.UserFactory()
    reader = factories.UserFactory()
    folder = factories.ItemFactory(
        type=models.ItemTypeChoices.FOLDER,
        content_type="workspace",
        users=[
            (owner, models.RoleChoices.OWNER),
            (reader, models.RoleChoices.READER),
        ],
    )

    response = _client(reader).get(ITEM_URL.format(id=folder.id))
    assert response.status_code == 200
    assert response.json() == {"content_type": "workspace"}
