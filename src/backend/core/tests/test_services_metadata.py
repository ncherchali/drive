"""Tests for the governed metadata service (E2.1 / MetadataService)."""

import pytest

from core import factories, models
from core.services import metadata

pytestmark = pytest.mark.django_db


def _template(fields=None):
    return models.MetadataTemplate.objects.create(
        key="contract",
        name="Contract",
        fields=fields
        or [
            {"key": "owner", "type": "string", "required": True},
            {"key": "year", "type": "number"},
            {"key": "signed", "type": "boolean"},
            {"key": "due", "type": "date"},
            {"key": "status", "type": "enum", "options": ["draft", "final"]},
        ],
    )


def test_validate_values_accepts_a_well_formed_instance():
    template = _template()
    errors = metadata.validate_values(
        template,
        {
            "owner": "legal",
            "year": 2026,
            "signed": True,
            "due": "2026-12-31",
            "status": "final",
        },
    )
    assert errors == {}


def test_validate_values_flags_unknown_field():
    template = _template()
    errors = metadata.validate_values(template, {"owner": "legal", "bogus": 1})
    assert "bogus" in errors


def test_validate_values_requires_required_field():
    template = _template()
    errors = metadata.validate_values(template, {"year": 2026})
    assert errors.get("owner") == "required"


def test_validate_values_rejects_type_mismatches():
    template = _template()
    errors = metadata.validate_values(
        template,
        {
            "owner": "legal",
            "year": "not-a-number",
            "signed": "yes",
            "due": "31/12/2026",
            "status": "archived",
        },
    )
    assert set(errors) == {"year", "signed", "due", "status"}


def test_validate_values_number_rejects_boolean():
    template = _template()
    errors = metadata.validate_values(template, {"owner": "legal", "year": True})
    assert "year" in errors


def test_apply_to_item_stores_namespaced_metadata_and_audits():
    template = _template()
    item = factories.ItemFactory(type=models.ItemTypeChoices.FILE)

    metadata.apply_to_item(item, template, {"owner": "legal"})

    item.refresh_from_db()
    assert item.metadata == {"contract": {"owner": "legal"}}
    assert models.AuditEvent.objects.filter(
        action="metadata.apply", target_uuid=item.id
    ).exists()


def test_apply_to_item_preserves_other_namespaces():
    template = _template()
    item = factories.ItemFactory(metadata={"other": {"x": 1}})

    metadata.apply_to_item(item, template, {"owner": "legal"})

    item.refresh_from_db()
    assert item.metadata == {"other": {"x": 1}, "contract": {"owner": "legal"}}


def test_apply_to_item_raises_on_invalid_values():
    template = _template()
    item = factories.ItemFactory()

    with pytest.raises(metadata.MetadataValidationError):
        metadata.apply_to_item(item, template, {"year": "nope"})


def test_cascade_to_subtree_applies_to_all_descendants():
    template = _template()
    folder = factories.ItemFactory(type=models.ItemTypeChoices.FOLDER)
    child = factories.ItemFactory(parent=folder, type=models.ItemTypeChoices.FILE)
    grandchild_parent = factories.ItemFactory(
        parent=folder, type=models.ItemTypeChoices.FOLDER
    )
    grandchild = factories.ItemFactory(
        parent=grandchild_parent, type=models.ItemTypeChoices.FILE
    )

    count = metadata.cascade_to_subtree(folder, template, {"owner": "legal"})

    assert count == 4
    for node in (folder, child, grandchild_parent, grandchild):
        node.refresh_from_db()
        assert node.metadata["contract"] == {"owner": "legal"}


def test_query_items_filters_by_metadata_containment():
    template = _template()
    match = factories.ItemFactory()
    other = factories.ItemFactory()
    metadata.apply_to_item(match, template, {"owner": "legal"})
    metadata.apply_to_item(other, template, {"owner": "finance"})

    results = list(metadata.query_items("contract", {"owner": "legal"}))

    assert match in results
    assert other not in results
