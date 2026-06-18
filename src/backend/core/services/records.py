"""Structured record service (ADR-0001 phase 4 — byte-less content objects).

A RECORD is a first-class content object that carries DATA as governed
metadata fields rather than bytes (no S3 object). It lives in the ltree like
any item, so sharing/access/search apply. This service creates a record under
a folder and, in one governed act, types it (ContentObjectType, base=record)
and validates/stores its initial metadata via the MetadataService (E2.1).
"""

from django.db import transaction

from core import models
from core.services import audit, content_types
from core.services import metadata as metadata_service


class RecordError(Exception):
    """Raised when a record cannot be created as requested."""


@transaction.atomic
def create_record(parent, title, content_type=None, metadata_values=None, actor=None):
    """Create a structured RECORD under a folder, optionally typed and filled.

    `content_type` (a registry key whose base is RECORD) and `metadata_values`
    are optional; if metadata is supplied, the content type must carry a
    metadata template to validate it against.
    """
    record = models.Item.objects.create_child(
        parent=parent,
        type=models.ItemTypeChoices.RECORD,
        title=title,
        creator=actor if actor and actor.is_authenticated else None,
    )
    audit.record(
        "item.create",
        actor=actor,
        target=record,
        metadata={"type": record.type, "parent_id": str(parent.pk)},
    )

    if content_type:
        content_types.assign_content_type(record, content_type, actor=actor)

    if metadata_values:
        content_object_type = content_types.get_type(content_type)
        if content_object_type is None or content_object_type.metadata_template is None:
            raise RecordError(
                "Metadata requires a content type carrying a metadata template."
            )
        metadata_service.apply_to_item(
            record,
            content_object_type.metadata_template,
            metadata_values,
            actor=actor,
        )

    return record
