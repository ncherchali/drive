"""API tests for governed metadata (E2.1): templates CRUD + item apply/cascade."""

import pytest
from rest_framework.test import APIClient

from core import factories, models

pytestmark = pytest.mark.django_db

TEMPLATES_URL = "/api/v1.0/metadata-templates/"
ITEM_URL = "/api/v1.0/items/{id}/metadata/"


def _client(user):
    client = APIClient()
    client.force_login(user)
    return client


def _template(**kwargs):
    return factories.MetadataTemplateFactory(
        key="contract",
        fields=[
            {"key": "owner", "type": "string", "required": True},
            {"key": "year", "type": "number"},
        ],
        **kwargs,
    )


# --- Template CRUD (admin-only) ----------------------------------------------


def test_api_create_template_requires_admin():
    user = factories.UserFactory()
    response = _client(user).post(
        TEMPLATES_URL,
        {"key": "contract", "name": "Contract", "fields": []},
        format="json",
    )
    assert response.status_code == 403


def test_api_admin_can_create_template():
    admin = factories.UserFactory(is_staff=True)
    response = _client(admin).post(
        TEMPLATES_URL,
        {
            "key": "contract",
            "name": "Contract",
            "fields": [{"key": "owner", "type": "string"}],
        },
        format="json",
    )
    assert response.status_code == 201
    template = models.MetadataTemplate.objects.get(key="contract")
    assert template.creator == admin


def test_api_create_template_rejects_invalid_schema():
    admin = factories.UserFactory(is_staff=True)
    response = _client(admin).post(
        TEMPLATES_URL,
        {"key": "bad", "name": "Bad", "fields": [{"key": "x", "type": "wat"}]},
        format="json",
    )
    assert response.status_code == 400


def test_api_admin_can_list_templates():
    admin = factories.UserFactory(is_staff=True)
    _template()
    response = _client(admin).get(TEMPLATES_URL)
    assert response.status_code == 200
    keys = [t["key"] for t in response.json()]
    assert "contract" in keys


# --- Apply metadata to an item -----------------------------------------------


def test_api_editor_applies_metadata_to_item():
    template = _template()
    owner = factories.UserFactory()
    editor = factories.UserFactory()
    item = factories.ItemFactory(
        type=models.ItemTypeChoices.FILE,
        users=[
            (owner, models.RoleChoices.OWNER),
            (editor, models.RoleChoices.EDITOR),
        ],
    )

    response = _client(editor).post(
        ITEM_URL.format(id=item.id),
        {"template": template.key, "values": {"owner": "legal", "year": 2026}},
        format="json",
    )

    assert response.status_code == 200
    item.refresh_from_db()
    assert item.metadata["contract"] == {"owner": "legal", "year": 2026}


def test_api_apply_invalid_values_returns_400():
    template = _template()
    owner = factories.UserFactory()
    item = factories.ItemFactory(
        type=models.ItemTypeChoices.FILE,
        users=[(owner, models.RoleChoices.OWNER)],
    )

    response = _client(owner).post(
        ITEM_URL.format(id=item.id),
        {"template": template.key, "values": {"year": "nope"}},
        format="json",
    )
    assert response.status_code == 400


def test_api_apply_unknown_template_returns_404():
    owner = factories.UserFactory()
    item = factories.ItemFactory(users=[(owner, models.RoleChoices.OWNER)])

    response = _client(owner).post(
        ITEM_URL.format(id=item.id),
        {"template": "ghost", "values": {}},
        format="json",
    )
    assert response.status_code == 404


def test_api_apply_forbidden_for_reader():
    template = _template()
    owner = factories.UserFactory()
    reader = factories.UserFactory()
    item = factories.ItemFactory(
        users=[
            (owner, models.RoleChoices.OWNER),
            (reader, models.RoleChoices.READER),
        ],
    )

    response = _client(reader).post(
        ITEM_URL.format(id=item.id),
        {"template": template.key, "values": {"owner": "legal"}},
        format="json",
    )
    assert response.status_code == 403


def test_api_reader_can_read_metadata():
    template = _template()
    owner = factories.UserFactory()
    reader = factories.UserFactory()
    item = factories.ItemFactory(
        users=[
            (owner, models.RoleChoices.OWNER),
            (reader, models.RoleChoices.READER),
        ],
        metadata={"contract": {"owner": "legal"}},
    )
    _ = template

    response = _client(reader).get(ITEM_URL.format(id=item.id))
    assert response.status_code == 200
    assert response.json() == {"contract": {"owner": "legal"}}


def test_api_cascade_applies_to_folder_subtree():
    template = _template()
    owner = factories.UserFactory()
    folder = factories.ItemFactory(
        type=models.ItemTypeChoices.FOLDER,
        users=[(owner, models.RoleChoices.OWNER)],
    )
    child = factories.ItemFactory(parent=folder, type=models.ItemTypeChoices.FILE)

    response = _client(owner).post(
        ITEM_URL.format(id=folder.id),
        {
            "template": template.key,
            "values": {"owner": "legal"},
            "cascade": True,
        },
        format="json",
    )

    assert response.status_code == 200
    assert response.json() == {"cascaded": 2}
    child.refresh_from_db()
    assert child.metadata["contract"] == {"owner": "legal"}
