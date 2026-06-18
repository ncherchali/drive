"""Tests for the content relation graph & manifest service (ADR-0001 §5)."""

import pytest

from core import factories, models
from core.services import relations

pytestmark = pytest.mark.django_db


def _composite(**kwargs):
    return factories.ItemFactory(type=models.ItemTypeChoices.FOLDER, **kwargs)


def test_add_relation_creates_edge_and_audits():
    composite = _composite()
    part = factories.ItemFactory()

    relation = relations.add_relation(
        composite,
        part,
        models.RelationTypeChoices.PART_OF,
        attributes={"role": "cover", "order": 1},
    )

    assert relation.from_item_id == composite.id
    assert relation.to_item_id == part.id
    assert models.AuditEvent.objects.filter(
        action="item.relation_add", target_uuid=composite.id
    ).exists()


def test_add_relation_rejects_self_loop():
    composite = _composite()
    with pytest.raises(relations.ContentRelationError):
        relations.add_relation(
            composite, composite, models.RelationTypeChoices.PART_OF
        )


def test_add_relation_rejects_unknown_type():
    composite = _composite()
    part = factories.ItemFactory()
    with pytest.raises(relations.ContentRelationError):
        relations.add_relation(composite, part, "teleports_to")


def test_add_relation_rejects_duplicate_edge():
    composite = _composite()
    part = factories.ItemFactory()
    relations.add_relation(composite, part, models.RelationTypeChoices.PART_OF)
    with pytest.raises(relations.ContentRelationError):
        relations.add_relation(composite, part, models.RelationTypeChoices.PART_OF)


def test_part_can_belong_to_several_composites():
    """A shared part has multiple parents in the graph (not in the ltree)."""
    composite_a = _composite()
    composite_b = _composite()
    shared = factories.ItemFactory()

    relations.add_relation(composite_a, shared, models.RelationTypeChoices.PART_OF)
    relations.add_relation(composite_b, shared, models.RelationTypeChoices.PART_OF)

    assert shared.relations_to.count() == 2


def test_remove_relation_deletes_and_audits():
    composite = _composite()
    part = factories.ItemFactory()
    relation = relations.add_relation(
        composite, part, models.RelationTypeChoices.PART_OF
    )

    relations.remove_relation(relation)

    assert not models.ContentRelation.objects.filter(pk=relation.pk).exists()
    assert models.AuditEvent.objects.filter(
        action="item.relation_remove", target_uuid=composite.id
    ).exists()


def test_manifest_returns_part_of_edges_ordered():
    composite = _composite()
    relations.add_relation(
        composite, factories.ItemFactory(), models.RelationTypeChoices.PART_OF,
        attributes={"role": "b", "order": 2},
    )
    relations.add_relation(
        composite, factories.ItemFactory(), models.RelationTypeChoices.PART_OF,
        attributes={"role": "a", "order": 1},
    )
    relations.add_relation(
        composite, factories.ItemFactory(), models.RelationTypeChoices.REFERENCES,
    )

    parts = list(relations.manifest(composite))

    assert [p.role for p in parts] == ["a", "b"]  # references edge excluded


def test_manifest_status_complete_when_required_roles_present():
    content_type = factories.ContentObjectTypeFactory(
        key="loan_file",
        base=models.ItemTypeChoices.FOLDER,
        required_roles=["formulaire", "contrat"],
    )
    composite = _composite(content_type=content_type.key)
    relations.add_relation(
        composite, factories.ItemFactory(), models.RelationTypeChoices.PART_OF,
        attributes={"role": "formulaire"},
    )
    relations.add_relation(
        composite, factories.ItemFactory(), models.RelationTypeChoices.PART_OF,
        attributes={"role": "contrat"},
    )

    status = relations.manifest_status(composite)

    assert status["complete"] is True
    assert status["missing_roles"] == []


def test_manifest_status_incomplete_when_role_missing():
    content_type = factories.ContentObjectTypeFactory(
        key="loan_file",
        base=models.ItemTypeChoices.FOLDER,
        required_roles=["formulaire", "contrat"],
    )
    composite = _composite(content_type=content_type.key)
    relations.add_relation(
        composite, factories.ItemFactory(), models.RelationTypeChoices.PART_OF,
        attributes={"role": "formulaire"},
    )

    status = relations.manifest_status(composite)

    assert status["complete"] is False
    assert status["missing_roles"] == ["contrat"]


def test_manifest_status_flags_broken_part():
    composite = _composite()
    part = factories.ItemFactory()
    relations.add_relation(composite, part, models.RelationTypeChoices.PART_OF)

    part.soft_delete()

    status = relations.manifest_status(composite)

    assert status["complete"] is False
    assert str(part.id) in status["broken_part_ids"]
