"""Tests for the structured record service (ADR-0001 phase 4)."""

import pytest

from core import factories, models
from core.services import content_types, records
from core.services import metadata as metadata_service

pytestmark = pytest.mark.django_db


def test_create_record_makes_a_byteless_child():
    parent = factories.ItemFactory(type=models.ItemTypeChoices.FOLDER)

    record = records.create_record(parent, "Client ACME")

    assert record.type == models.ItemTypeChoices.RECORD
    assert record.filename is None
    assert record.size is None
    assert record.upload_state is None
    assert str(record.path).startswith(str(parent.path))
    assert models.AuditEvent.objects.filter(
        action="item.create", target_uuid=record.id
    ).exists()


def test_create_record_assigns_content_type_and_metadata():
    parent = factories.ItemFactory(type=models.ItemTypeChoices.FOLDER)

    record = records.create_record(
        parent,
        "Client ACME",
        content_type="fiche_client",
        metadata_values={"raison_sociale": "ACME", "segment": "pme"},
        actor=parent.creator,
    )

    record.refresh_from_db()
    assert record.content_type == "fiche_client"
    assert record.metadata["fiche_client"] == {
        "raison_sociale": "ACME",
        "segment": "pme",
    }


def test_create_record_rejects_non_record_content_type():
    """A workspace (base=folder) cannot type a record."""
    parent = factories.ItemFactory(type=models.ItemTypeChoices.FOLDER)

    with pytest.raises(content_types.ContentTypeError):
        records.create_record(parent, "Bad", content_type="workspace")

    assert not models.Item.objects.filter(
        type=models.ItemTypeChoices.RECORD
    ).exists()  # rolled back


def test_create_record_metadata_requires_template():
    """A type without a metadata template cannot carry metadata."""
    content_type = factories.ContentObjectTypeFactory(
        key="bare_record",
        base=models.ItemTypeChoices.RECORD,
        metadata_template=None,
    )
    parent = factories.ItemFactory(type=models.ItemTypeChoices.FOLDER)

    with pytest.raises(records.RecordError):
        records.create_record(
            parent,
            "Bad",
            content_type=content_type.key,
            metadata_values={"x": 1},
        )

    assert not models.Item.objects.filter(
        type=models.ItemTypeChoices.RECORD
    ).exists()  # rolled back


def test_create_record_invalid_metadata_rolls_back():
    parent = factories.ItemFactory(type=models.ItemTypeChoices.FOLDER)

    with pytest.raises(metadata_service.MetadataValidationError):
        records.create_record(
            parent,
            "Bad",
            content_type="fiche_client",
            metadata_values={"encours": "not-a-number"},
        )

    assert not models.Item.objects.filter(
        type=models.ItemTypeChoices.RECORD
    ).exists()  # rolled back


def test_fiche_client_type_is_seeded_with_record_base():
    content_type = content_types.get_type("fiche_client")
    assert content_type is not None
    assert content_type.base == models.ItemTypeChoices.RECORD
    assert content_type.metadata_template is not None
