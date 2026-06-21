"""Tests for the classification rules engine + auto-classification (passe 6)."""

from django.test.utils import override_settings

import pytest

from core import factories, models
from core.classification_rules import get_classification_rules_engine
from core.classification_rules.rules_engine import SettingsRulesEngine
from core.services import classification

pytestmark = pytest.mark.django_db

C = models.ClassificationChoices


def test_default_engine_is_the_sovereign_settings_engine():
    get_classification_rules_engine.cache_clear()
    assert isinstance(get_classification_rules_engine(), SettingsRulesEngine)


@override_settings(CLASSIFICATION_RULES=[])
def test_no_rules_suggests_none():
    item = factories.ItemFactory(content_type="contract")
    assert SettingsRulesEngine().suggest(item) is None


@override_settings(
    CLASSIFICATION_RULES=[{"content_type": "contract", "level": "confidential"}]
)
def test_rule_matches_on_content_type():
    item = factories.ItemFactory(content_type="contract")
    other = factories.ItemFactory(content_type="invoice")
    assert SettingsRulesEngine().suggest(item) == C.CONFIDENTIAL
    assert SettingsRulesEngine().suggest(other) is None


@override_settings(
    CLASSIFICATION_RULES=[
        {"title_regex": "(?i)secret", "level": "confidential"},
        {"mimetype_prefix": "application/pdf", "level": "secret"},
    ]
)
def test_engine_returns_most_restrictive_among_matches():
    item = factories.ItemFactory(
        type=models.ItemTypeChoices.FILE,
        filename="x.pdf",
        title="Secret plan",
        mimetype="application/pdf",
    )
    # Both rules match → most restrictive (secret) wins.
    assert SettingsRulesEngine().suggest(item) == C.SECRET


@override_settings(
    CLASSIFICATION_RULES=[{"metadata_key": "contract.parties", "level": "internal"}]
)
def test_rule_matches_on_metadata_key_presence():
    item = factories.ItemFactory(metadata={"contract": {"parties": ["ACME"]}})
    bare = factories.ItemFactory(metadata={})
    assert SettingsRulesEngine().suggest(item) == C.INTERNAL
    assert SettingsRulesEngine().suggest(bare) is None


# --- Service auto_classify ---------------------------------------------------


@override_settings(
    CLASSIFICATION_RULES=[{"content_type": "contract", "level": "confidential"}]
)
def test_auto_classify_raises_unclassified_item():
    item = factories.ItemFactory(content_type="contract")
    classification.auto_classify(item)
    item.refresh_from_db()
    assert item.classification == C.CONFIDENTIAL
    assert models.AuditEvent.objects.filter(
        action="item.classify", target_uuid=item.id
    ).exists()


@override_settings(
    CLASSIFICATION_RULES=[{"content_type": "contract", "level": "internal"}]
)
def test_auto_classify_never_lowers_a_higher_manual_level():
    item = factories.ItemFactory(content_type="contract", classification=C.SECRET)
    result = classification.auto_classify(item)
    item.refresh_from_db()
    assert result == C.SECRET  # suggestion (internal) does not lower secret
    assert item.classification == C.SECRET


@override_settings(CLASSIFICATION_RULES=[])
def test_auto_classify_no_rule_keeps_current():
    item = factories.ItemFactory(classification=C.INTERNAL)
    assert classification.auto_classify(item) == C.INTERNAL
    item.refresh_from_db()
    assert item.classification == C.INTERNAL
