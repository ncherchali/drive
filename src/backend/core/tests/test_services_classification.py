"""Tests for the data classification service (ADR-0001 §5.4, passe 6)."""

import pytest

from core import factories, models
from core.services import classification, relations

pytestmark = pytest.mark.django_db

C = models.ClassificationChoices


def _part_of(composite, part):
    relations.add_relation(composite, part, models.RelationTypeChoices.PART_OF)


def test_most_restrictive_picks_highest_level():
    assert classification.most_restrictive([C.PUBLIC, C.SECRET, C.INTERNAL]) == C.SECRET
    assert classification.most_restrictive([C.PUBLIC, C.INTERNAL]) == C.INTERNAL


def test_most_restrictive_ignores_none_and_empty():
    assert classification.most_restrictive([None, C.INTERNAL, None]) == C.INTERNAL
    assert classification.most_restrictive([None, None]) is None
    assert classification.most_restrictive([]) is None


def test_classify_sets_level_and_audits():
    item = factories.ItemFactory()

    classification.classify(item, C.CONFIDENTIAL)

    item.refresh_from_db()
    assert item.classification == C.CONFIDENTIAL
    assert models.AuditEvent.objects.filter(
        action="item.classify", target_uuid=item.id
    ).exists()


def test_classify_clear_sets_none():
    item = factories.ItemFactory(classification=C.SECRET)
    classification.classify(item, None)
    item.refresh_from_db()
    assert item.classification is None


def test_classify_rejects_unknown_level():
    item = factories.ItemFactory()
    with pytest.raises(ValueError):
        classification.classify(item, "cosmic-top-secret")


def test_effective_classification_inherits_most_restrictive_part():
    composite = factories.ItemFactory(
        type=models.ItemTypeChoices.FOLDER, classification=C.INTERNAL
    )
    _part_of(composite, factories.ItemFactory(classification=C.PUBLIC))
    _part_of(composite, factories.ItemFactory(classification=C.SECRET))

    # Own=INTERNAL but a part is SECRET → effective is SECRET (cannot under-classify).
    assert classification.effective_classification(composite) == C.SECRET


def test_effective_classification_without_parts_is_own():
    item = factories.ItemFactory(classification=C.CONFIDENTIAL)
    assert classification.effective_classification(item) == C.CONFIDENTIAL


def test_effective_classification_unclassified_is_none():
    composite = factories.ItemFactory(type=models.ItemTypeChoices.FOLDER)
    _part_of(composite, factories.ItemFactory())  # part also unclassified
    assert classification.effective_classification(composite) is None
