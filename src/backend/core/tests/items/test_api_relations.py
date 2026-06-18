"""API tests for content relations & manifest (E2.2 / ADR-0001 §5)."""

import pytest
from rest_framework.test import APIClient

from core import factories, models

pytestmark = pytest.mark.django_db

RELATIONS_URL = "/api/v1.0/items/{id}/relations/"
RELATION_DETAIL_URL = "/api/v1.0/items/{id}/relations/{rid}/"
MANIFEST_URL = "/api/v1.0/items/{id}/manifest/"


def _client(user):
    client = APIClient()
    client.force_login(user)
    return client


def _composite(owner, **kwargs):
    return factories.ItemFactory(
        type=models.ItemTypeChoices.FOLDER,
        users=[(owner, models.RoleChoices.OWNER)],
        **kwargs,
    )


def test_api_add_relation_to_readable_target():
    owner = factories.UserFactory()
    composite = _composite(owner)
    part = factories.ItemFactory(users=[(owner, models.RoleChoices.READER)])

    response = _client(owner).post(
        RELATIONS_URL.format(id=composite.id),
        {
            "to_item": str(part.id),
            "relation_type": "part_of",
            "role": "cover",
            "order": 1,
        },
        format="json",
    )

    assert response.status_code == 201
    assert response.json()["to_item"] == str(part.id)
    assert composite.relations_from.filter(to_item=part).exists()


def test_api_add_relation_to_unreadable_target_is_forbidden():
    owner = factories.UserFactory()
    composite = _composite(owner)
    foreign_part = factories.ItemFactory()  # owner has no access

    response = _client(owner).post(
        RELATIONS_URL.format(id=composite.id),
        {"to_item": str(foreign_part.id), "relation_type": "part_of"},
        format="json",
    )
    assert response.status_code == 403


def test_api_add_self_relation_returns_400():
    owner = factories.UserFactory()
    composite = _composite(owner)

    response = _client(owner).post(
        RELATIONS_URL.format(id=composite.id),
        {"to_item": str(composite.id), "relation_type": "part_of"},
        format="json",
    )
    assert response.status_code == 400


def test_api_list_relations():
    owner = factories.UserFactory()
    composite = _composite(owner)
    part = factories.ItemFactory(users=[(owner, models.RoleChoices.READER)])
    factories.ContentRelationFactory(from_item=composite, to_item=part)

    response = _client(owner).get(RELATIONS_URL.format(id=composite.id))

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["to_item_title"] == part.title


def test_api_delete_relation():
    owner = factories.UserFactory()
    composite = _composite(owner)
    part = factories.ItemFactory(users=[(owner, models.RoleChoices.READER)])
    relation = factories.ContentRelationFactory(from_item=composite, to_item=part)

    response = _client(owner).delete(
        RELATION_DETAIL_URL.format(id=composite.id, rid=relation.id)
    )

    assert response.status_code == 204
    assert not models.ContentRelation.objects.filter(pk=relation.id).exists()


def test_api_add_relation_forbidden_for_reader():
    owner = factories.UserFactory()
    reader = factories.UserFactory()
    composite = factories.ItemFactory(
        type=models.ItemTypeChoices.FOLDER,
        users=[
            (owner, models.RoleChoices.OWNER),
            (reader, models.RoleChoices.READER),
        ],
    )
    part = factories.ItemFactory(users=[(reader, models.RoleChoices.READER)])

    response = _client(reader).post(
        RELATIONS_URL.format(id=composite.id),
        {"to_item": str(part.id), "relation_type": "part_of"},
        format="json",
    )
    assert response.status_code == 403


def test_api_manifest_reports_completeness():
    owner = factories.UserFactory()
    content_type = factories.ContentObjectTypeFactory(
        key="loan_file",
        base=models.ItemTypeChoices.FOLDER,
        required_roles=["formulaire", "contrat"],
    )
    composite = _composite(owner, content_type=content_type.key)
    part = factories.ItemFactory(users=[(owner, models.RoleChoices.READER)])
    factories.ContentRelationFactory(
        from_item=composite, to_item=part, role="formulaire"
    )

    response = _client(owner).get(MANIFEST_URL.format(id=composite.id))

    assert response.status_code == 200
    body = response.json()
    assert body["complete"] is False
    assert body["missing_roles"] == ["contrat"]
    assert len(body["parts"]) == 1
