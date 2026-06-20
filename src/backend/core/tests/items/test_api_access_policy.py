"""API tests for effective access resolution (ADR-0001 §5.4, passe 4)."""

import pytest
from rest_framework.test import APIClient

from core import factories, models
from core.services import relations

pytestmark = pytest.mark.django_db

URL = "/api/v1.0/items/{id}/access-policy/"
R = models.RoleChoices


def _client(user):
    client = APIClient()
    client.force_login(user)
    return client


def _part_of(composite, part):
    relations.add_relation(composite, part, models.RelationTypeChoices.PART_OF)


def test_api_owner_resolves_fully_accessible_composite():
    owner = factories.UserFactory()
    composite = factories.ItemFactory(
        type=models.ItemTypeChoices.FOLDER, users=[(owner, R.OWNER)]
    )
    _part_of(composite, factories.ItemFactory(users=[(owner, R.EDITOR)]))

    response = _client(owner).get(URL.format(id=composite.id))

    assert response.status_code == 200
    body = response.json()
    assert body["own_role"] == R.OWNER
    assert body["effective_role"] == R.EDITOR
    assert body["fully_accessible"] is True
    assert len(body["parts"]) == 1


def test_api_reader_blocked_by_inaccessible_part():
    owner = factories.UserFactory()
    reader = factories.UserFactory()
    composite = factories.ItemFactory(
        type=models.ItemTypeChoices.FOLDER,
        users=[(owner, R.OWNER), (reader, R.READER)],
    )
    foreign = factories.ItemFactory(users=[(owner, R.OWNER)])  # reader has no access
    _part_of(composite, foreign)

    response = _client(reader).get(URL.format(id=composite.id))

    assert response.status_code == 200
    body = response.json()
    assert body["own_role"] == R.READER
    assert body["fully_accessible"] is False
    assert str(foreign.id) in body["inaccessible_part_ids"]


def test_api_access_policy_forbidden_without_read_access():
    owner = factories.UserFactory()
    stranger = factories.UserFactory()
    composite = factories.ItemFactory(
        type=models.ItemTypeChoices.FOLDER, users=[(owner, R.OWNER)]
    )

    response = _client(stranger).get(URL.format(id=composite.id))
    assert response.status_code in (403, 404)
