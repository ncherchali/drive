"""Tests for the metadata provenance & promotion service (ADR-0001 §6)."""

import pytest

from core import factories, models
from core.services import metadata as metadata_service
from core.services import provenance

pytestmark = pytest.mark.django_db


def _template():
    return factories.MetadataTemplateFactory(
        key="contract",
        fields=[
            {"key": "owner", "type": "string", "required": True},
            {"key": "amount", "type": "number"},
        ],
    )


def test_propose_records_proposal_with_provenance_and_audits():
    template = _template()
    item = factories.ItemFactory()

    proposal = provenance.propose(
        item,
        template,
        {"owner": "legal", "amount": 1000},
        provenance={
            "source": models.MetadataSourceChoices.AGENT,
            "source_ref": "agent:42",
            "model": "claude-opus-4-8",
            "confidence": 0.91,
            "prompt": "Extract the contract owner.",
        },
    )

    assert proposal.status == models.ProposalStatusChoices.PROPOSED
    assert proposal.source == models.MetadataSourceChoices.AGENT
    assert proposal.model == "claude-opus-4-8"
    assert proposal.confidence == 0.91
    assert models.AuditEvent.objects.filter(
        action="metadata.propose", target_uuid=item.id
    ).exists()


def test_propose_does_not_touch_authoritative_metadata():
    template = _template()
    item = factories.ItemFactory()

    provenance.propose(item, template, {"owner": "legal"})

    item.refresh_from_db()
    assert item.metadata == {}


def test_propose_rejects_invalid_values():
    template = _template()
    item = factories.ItemFactory()

    with pytest.raises(metadata_service.MetadataValidationError):
        provenance.propose(item, template, {"amount": "not-a-number"})


def test_accept_promotes_into_authoritative_metadata():
    template = _template()
    item = factories.ItemFactory()
    validator = factories.UserFactory()
    proposal = provenance.propose(item, template, {"owner": "legal"})

    provenance.accept(proposal, actor=validator)

    item.refresh_from_db()
    proposal.refresh_from_db()
    assert item.metadata["contract"] == {"owner": "legal"}
    assert proposal.status == models.ProposalStatusChoices.ACCEPTED
    assert proposal.validated_by == validator
    assert proposal.validated_at is not None
    assert models.AuditEvent.objects.filter(
        action="metadata.proposal_accept", target_uuid=item.id
    ).exists()


def test_reject_leaves_authoritative_metadata_untouched():
    template = _template()
    item = factories.ItemFactory()
    proposal = provenance.propose(item, template, {"owner": "legal"})

    provenance.reject(proposal)

    item.refresh_from_db()
    proposal.refresh_from_db()
    assert item.metadata == {}
    assert proposal.status == models.ProposalStatusChoices.REJECTED
    assert models.AuditEvent.objects.filter(
        action="metadata.proposal_reject", target_uuid=item.id
    ).exists()


def test_accept_twice_is_rejected():
    template = _template()
    item = factories.ItemFactory()
    proposal = provenance.propose(item, template, {"owner": "legal"})
    provenance.accept(proposal)

    with pytest.raises(provenance.ProvenanceError):
        provenance.accept(proposal)


def test_reject_after_accept_is_rejected():
    template = _template()
    item = factories.ItemFactory()
    proposal = provenance.propose(item, template, {"owner": "legal"})
    provenance.accept(proposal)

    with pytest.raises(provenance.ProvenanceError):
        provenance.reject(proposal)
