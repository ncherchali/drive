"""Metadata provenance & governed promotion service (ADR-0001 §6, phase 3).

Derived/agentic metadata writes never mutate the authoritative source of truth
directly: they are recorded as `MetadataProposal` rows (status `proposed`) with
full provenance (source, model, confidence, prompt). A governance act then
PROMOTES them — `accept` applies the values to the item's authoritative
metadata via the MetadataService (E2.1) — or `reject`s them. Every step is
audited, keeping enrichment reversible and traceable (anti-hallucination).
"""

from django.utils import timezone

from core import models
from core.services import audit
from core.services import metadata as metadata_service


class ProvenanceError(Exception):
    """Raised when a proposal cannot be created or promoted."""


def propose(item, template, values, provenance=None, actor=None):
    """Record a proposed metadata enrichment (validated) and audit it.

    `provenance` carries the optional lineage: `source`, `source_ref`, `model`,
    `confidence`, `prompt` (ADR-0001 §6.2).
    """
    provenance = provenance or {}
    errors = metadata_service.validate_values(template, values)
    if errors:
        raise metadata_service.MetadataValidationError(errors)

    source = provenance.get("source") or models.MetadataSourceChoices.HUMAN
    proposal = models.MetadataProposal.objects.create(
        item=item,
        template=template,
        values=values,
        source=source,
        source_ref=provenance.get("source_ref") or "",
        model=provenance.get("model") or "",
        confidence=provenance.get("confidence"),
        prompt=provenance.get("prompt") or "",
        creator=actor if actor and actor.is_authenticated else None,
    )
    audit.record(
        "metadata.propose",
        actor=actor,
        target=item,
        metadata={
            "template": template.key,
            "source": source,
            "model": proposal.model,
            "confidence": proposal.confidence,
        },
    )
    return proposal


def accept(proposal, actor=None):
    """Promote a proposal into the item's authoritative metadata and audit it."""
    if proposal.status != models.ProposalStatusChoices.PROPOSED:
        raise ProvenanceError("This proposal has already been processed.")
    if proposal.template is None:
        raise ProvenanceError("This proposal has no template to apply.")

    metadata_service.apply_to_item(
        proposal.item, proposal.template, proposal.values, actor=actor
    )
    proposal.status = models.ProposalStatusChoices.ACCEPTED
    proposal.validated_by = actor if actor and actor.is_authenticated else None
    proposal.validated_at = timezone.now()
    proposal.save(update_fields=["status", "validated_by", "validated_at", "updated_at"])
    audit.record(
        "metadata.proposal_accept",
        actor=actor,
        target=proposal.item,
        metadata={"template": proposal.template.key, "proposal": str(proposal.pk)},
    )
    return proposal


def reject(proposal, actor=None):
    """Reject a proposal without touching authoritative metadata, and audit it."""
    if proposal.status != models.ProposalStatusChoices.PROPOSED:
        raise ProvenanceError("This proposal has already been processed.")

    proposal.status = models.ProposalStatusChoices.REJECTED
    proposal.validated_by = actor if actor and actor.is_authenticated else None
    proposal.validated_at = timezone.now()
    proposal.save(update_fields=["status", "validated_by", "validated_at", "updated_at"])
    audit.record(
        "metadata.proposal_reject",
        actor=actor,
        target=proposal.item,
        metadata={"proposal": str(proposal.pk)},
    )
    return proposal
