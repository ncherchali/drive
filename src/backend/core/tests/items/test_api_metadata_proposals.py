"""API tests for metadata proposals / provenance (E2.2 / ADR-0001 §6)."""

import pytest
from rest_framework.test import APIClient

from core import factories, models

pytestmark = pytest.mark.django_db

PROPOSALS_URL = "/api/v1.0/items/{id}/metadata-proposals/"
ACCEPT_URL = "/api/v1.0/items/{id}/metadata-proposals/{pid}/accept/"
REJECT_URL = "/api/v1.0/items/{id}/metadata-proposals/{pid}/reject/"


def _client(user):
    client = APIClient()
    client.force_login(user)
    return client


def _template():
    return factories.MetadataTemplateFactory(
        key="contract",
        fields=[{"key": "owner", "type": "string", "required": True}],
    )


def test_api_editor_proposes_enrichment():
    template = _template()
    owner = factories.UserFactory()
    editor = factories.UserFactory()
    item = factories.ItemFactory(
        users=[
            (owner, models.RoleChoices.OWNER),
            (editor, models.RoleChoices.EDITOR),
        ],
    )

    response = _client(editor).post(
        PROPOSALS_URL.format(id=item.id),
        {
            "template": template.key,
            "values": {"owner": "legal"},
            "source": "agent",
            "model": "claude-opus-4-8",
            "confidence": 0.9,
        },
        format="json",
    )

    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "proposed"
    assert body["source"] == "agent"
    item.refresh_from_db()
    assert item.metadata == {}  # authoritative untouched


def test_api_propose_invalid_values_returns_400():
    template = factories.MetadataTemplateFactory(
        key="contract",
        fields=[{"key": "amount", "type": "number"}],
    )
    owner = factories.UserFactory()
    item = factories.ItemFactory(users=[(owner, models.RoleChoices.OWNER)])

    response = _client(owner).post(
        PROPOSALS_URL.format(id=item.id),
        {"template": template.key, "values": {"amount": "nope"}},
        format="json",
    )
    assert response.status_code == 400


def test_api_manager_accepts_proposal_promotes_metadata():
    template = _template()
    owner = factories.UserFactory()
    item = factories.ItemFactory(users=[(owner, models.RoleChoices.OWNER)])
    proposal = factories.MetadataProposalFactory(
        item=item, template=template, values={"owner": "legal"}
    )

    response = _client(owner).post(
        ACCEPT_URL.format(id=item.id, pid=proposal.id)
    )

    assert response.status_code == 200
    item.refresh_from_db()
    assert item.metadata["contract"] == {"owner": "legal"}


def test_api_accept_forbidden_for_editor():
    """Promotion into the source of truth is a governance act (managers only)."""
    template = _template()
    owner = factories.UserFactory()
    editor = factories.UserFactory()
    item = factories.ItemFactory(
        users=[
            (owner, models.RoleChoices.OWNER),
            (editor, models.RoleChoices.EDITOR),
        ],
    )
    proposal = factories.MetadataProposalFactory(
        item=item, template=template, values={"owner": "legal"}
    )

    response = _client(editor).post(
        ACCEPT_URL.format(id=item.id, pid=proposal.id)
    )
    assert response.status_code == 403


def test_api_manager_rejects_proposal():
    template = _template()
    owner = factories.UserFactory()
    item = factories.ItemFactory(users=[(owner, models.RoleChoices.OWNER)])
    proposal = factories.MetadataProposalFactory(
        item=item, template=template, values={"owner": "legal"}
    )

    response = _client(owner).post(
        REJECT_URL.format(id=item.id, pid=proposal.id)
    )

    assert response.status_code == 200
    item.refresh_from_db()
    assert item.metadata == {}
    proposal.refresh_from_db()
    assert proposal.status == models.ProposalStatusChoices.REJECTED


def test_api_accept_already_processed_returns_400():
    template = _template()
    owner = factories.UserFactory()
    item = factories.ItemFactory(users=[(owner, models.RoleChoices.OWNER)])
    proposal = factories.MetadataProposalFactory(
        item=item,
        template=template,
        values={"owner": "legal"},
        status=models.ProposalStatusChoices.ACCEPTED,
    )

    response = _client(owner).post(
        ACCEPT_URL.format(id=item.id, pid=proposal.id)
    )
    assert response.status_code == 400


def test_api_reader_can_list_but_not_propose():
    template = _template()
    owner = factories.UserFactory()
    reader = factories.UserFactory()
    item = factories.ItemFactory(
        users=[
            (owner, models.RoleChoices.OWNER),
            (reader, models.RoleChoices.READER),
        ],
    )
    factories.MetadataProposalFactory(item=item, template=template)

    list_response = _client(reader).get(PROPOSALS_URL.format(id=item.id))
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1

    propose_response = _client(reader).post(
        PROPOSALS_URL.format(id=item.id),
        {"template": template.key, "values": {"owner": "legal"}},
        format="json",
    )
    assert propose_response.status_code == 403
