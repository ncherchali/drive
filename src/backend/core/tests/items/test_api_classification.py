"""API tests for item classification (ADR-0001 §5.4, passe 6)."""

import pytest
from rest_framework.test import APIClient

from core import factories, models
from core.services import relations

pytestmark = pytest.mark.django_db

URL = "/api/v1.0/items/{id}/classification/"
C = models.ClassificationChoices
R = models.RoleChoices


def _client(user):
    client = APIClient()
    client.force_login(user)
    return client


def test_api_manager_sets_classification_and_audits():
    owner = factories.UserFactory()
    item = factories.ItemFactory(users=[(owner, R.OWNER)])

    response = _client(owner).post(
        URL.format(id=item.id), {"classification": "confidential"}, format="json"
    )

    assert response.status_code == 200
    assert response.json()["classification"] == "confidential"
    item.refresh_from_db()
    assert item.classification == C.CONFIDENTIAL


def test_api_get_returns_effective_over_parts():
    owner = factories.UserFactory()
    composite = factories.ItemFactory(
        type=models.ItemTypeChoices.FOLDER,
        classification=C.INTERNAL,
        users=[(owner, R.OWNER)],
    )
    relations.add_relation(
        composite,
        factories.ItemFactory(classification=C.SECRET),
        models.RelationTypeChoices.PART_OF,
    )

    response = _client(owner).get(URL.format(id=composite.id))

    assert response.status_code == 200
    body = response.json()
    assert body["classification"] == "internal"
    assert body["effective_classification"] == "secret"


def test_api_set_classification_forbidden_for_editor():
    """Setting the level is a governance act (managers only)."""
    owner = factories.UserFactory()
    editor = factories.UserFactory()
    item = factories.ItemFactory(
        users=[(owner, R.OWNER), (editor, R.EDITOR)],
    )

    response = _client(editor).post(
        URL.format(id=item.id), {"classification": "secret"}, format="json"
    )
    assert response.status_code == 403


def test_api_reader_can_read_classification():
    owner = factories.UserFactory()
    reader = factories.UserFactory()
    item = factories.ItemFactory(
        classification=C.PUBLIC,
        users=[(owner, R.OWNER), (reader, R.READER)],
    )

    response = _client(reader).get(URL.format(id=item.id))
    assert response.status_code == 200
    assert response.json()["classification"] == "public"


def test_api_reject_unknown_classification():
    owner = factories.UserFactory()
    item = factories.ItemFactory(users=[(owner, R.OWNER)])

    response = _client(owner).post(
        URL.format(id=item.id), {"classification": "bogus"}, format="json"
    )
    assert response.status_code == 400


def test_api_batch_classifications_returns_map_for_readable_items():
    owner = factories.UserFactory()
    secret = factories.ItemFactory(
        classification=C.SECRET, users=[(owner, R.OWNER)]
    )
    plain = factories.ItemFactory(users=[(owner, R.OWNER)])
    foreign = factories.ItemFactory(classification=C.SECRET)  # not readable

    response = _client(owner).get(
        f"/api/v1.0/items/classifications/?ids={secret.id},{plain.id},{foreign.id}"
    )

    assert response.status_code == 200
    body = response.json()
    assert body[str(secret.id)] == "secret"
    assert body[str(plain.id)] is None
    assert str(foreign.id) not in body  # access-filtered out
