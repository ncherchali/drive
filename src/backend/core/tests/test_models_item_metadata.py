"""Unit tests for the Item content-object metadata fields (B1-1)."""

from django.core.exceptions import ValidationError

import pytest

from core import factories

pytestmark = pytest.mark.django_db


def test_models_item_metadata_defaults_to_empty_dict():
    """A freshly created item exposes an empty metadata object."""
    item = factories.ItemFactory()
    item.refresh_from_db()
    assert item.metadata == {}


def test_models_item_metadata_persists_object():
    """Arbitrary business metadata is stored and read back as-is."""
    item = factories.ItemFactory()
    item.metadata = {"client": "ACME", "tags": ["contrat", "2026"]}
    item.save()
    item.refresh_from_db()
    assert item.metadata == {"client": "ACME", "tags": ["contrat", "2026"]}


@pytest.mark.parametrize("invalid", [["a", "b"], "string", 42])
def test_models_item_metadata_rejects_non_object(invalid):
    """Metadata must be a JSON object; lists/scalars are rejected on save."""
    item = factories.ItemFactory()
    item.metadata = invalid
    with pytest.raises(ValidationError) as excinfo:
        item.save()
    assert "metadata" in excinfo.value.message_dict
    codes = [error.code for error in excinfo.value.error_dict["metadata"]]
    assert "item_metadata_not_object" in codes


def test_models_item_content_type_defaults_to_none():
    """The content-object type axis is optional (NULL = plain file/folder)."""
    item = factories.ItemFactory()
    item.refresh_from_db()
    assert item.content_type is None


def test_models_item_content_type_persists():
    """A content-object type key (ADR-0001) is stored on the item."""
    item = factories.ItemFactory()
    item.content_type = "room"
    item.save()
    item.refresh_from_db()
    assert item.content_type == "room"
