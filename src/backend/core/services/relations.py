"""Content relation graph & composite manifest service (ADR-0001 §5, phase 2).

Manages the composition/reference graph (`ContentRelation`) that sits ALONGSIDE
containment (the ltree `path`, mono-parent): edges are multi-parent, ordered and
shareable. A composite's `part_of` edges form its MANIFEST; this service builds
the manifest and computes completeness (required roles vs present, broken parts)
per ADR-0001 §5.3/§5.4.
"""

from django.core.exceptions import ValidationError
from django.db import IntegrityError

from core import models
from core.services import audit, content_types


class ContentRelationError(Exception):
    """Raised when a content relation cannot be created."""


def add_relation(from_item, to_item, relation_type, attributes=None, actor=None):
    """Create a graph edge between two items (validated) and audit it.

    `attributes` carries the optional edge data: `role`, `order`,
    `pinned_version` (ADR-0001 §5.3).
    """
    attributes = attributes or {}
    if from_item.pk == to_item.pk:
        raise ContentRelationError("An item cannot relate to itself.")
    if relation_type not in models.RelationTypeChoices.values:
        raise ContentRelationError(f"Unknown relation type '{relation_type}'.")

    role = attributes.get("role") or ""
    try:
        relation = models.ContentRelation.objects.create(
            from_item=from_item,
            to_item=to_item,
            relation_type=relation_type,
            role=role,
            order=attributes.get("order") or 0,
            pinned_version=attributes.get("pinned_version") or "",
            creator=actor if actor and actor.is_authenticated else None,
        )
    except (IntegrityError, ValidationError) as excpt:
        raise ContentRelationError("This relation already exists.") from excpt

    audit.record(
        "item.relation_add",
        actor=actor,
        target=from_item,
        metadata={
            "to_item": str(to_item.pk),
            "relation_type": relation_type,
            "role": role,
        },
    )
    return relation


def remove_relation(relation, actor=None):
    """Delete a graph edge and audit it."""
    from_item = relation.from_item
    metadata = {
        "to_item": str(relation.to_item_id),
        "relation_type": relation.relation_type,
        "role": relation.role,
    }
    relation.delete()
    audit.record(
        "item.relation_remove", actor=actor, target=from_item, metadata=metadata
    )


def manifest(composite):
    """Return the ordered `part_of` edges of a composite (its manifest)."""
    return (
        composite.relations_from.filter(
            relation_type=models.RelationTypeChoices.PART_OF
        )
        .select_related("to_item")
        .order_by("order")
    )


def manifest_status(composite):
    """Compute a composite's manifest completeness (ADR-0001 §5.3/§5.4).

    Completeness = every role required by the composite's content type is
    present AND no referenced part is missing (soft-deleted).
    """
    content_type = content_types.get_type(composite.content_type)
    required = list((content_type.required_roles if content_type else []) or [])

    parts = list(manifest(composite))
    present_roles = {part.role for part in parts if part.role}
    missing_roles = [role for role in required if role not in present_roles]
    broken = [part for part in parts if part.to_item.deleted_at is not None]

    return {
        "relations": parts,
        "required_roles": required,
        "present_roles": sorted(present_roles),
        "missing_roles": missing_roles,
        "broken_part_ids": [str(part.to_item_id) for part in broken],
        "complete": not missing_roles and not broken,
    }
