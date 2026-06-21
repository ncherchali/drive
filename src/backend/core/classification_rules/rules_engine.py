"""Sovereign default rules engine: declarative rules from settings (passe 6).

Reads `settings.CLASSIFICATION_RULES`, a list of rules evaluated against the
item; returns the MOST RESTRICTIVE level among the matching rules. No external
dependency — rules live in config (data-driven, swappable). A rule is a dict:

    {
        "level": "confidential",          # required: the level to suggest
        "content_type": "contract",       # optional: item.content_type equals
        "mimetype_prefix": "application/", # optional: item.mimetype starts with
        "title_regex": "(?i)secret",      # optional: re.search on item.title
        "metadata_key": "contract.parties" # optional: this JSON path is present
    }

A rule matches when ALL its present conditions match. Empty config = no rule
matches (auto-classification is opt-in and sovereign).
"""

import re

from django.conf import settings

from core import models
from core.classification_rules.base import ClassificationRulesEngine

ClassificationChoices = models.ClassificationChoices


def _metadata_has(item, dotted_key):
    """True when the dotted `namespace.field` path is present in item.metadata."""
    namespace, _, field = dotted_key.partition(".")
    block = (item.metadata or {}).get(namespace)
    if not isinstance(block, dict):
        return False
    return field in block if field else bool(block)


def _matches(rule, item):
    """Return True when every condition present in `rule` matches `item`."""
    if "content_type" in rule and item.content_type != rule["content_type"]:
        return False
    if "mimetype_prefix" in rule and not (item.mimetype or "").startswith(
        rule["mimetype_prefix"]
    ):
        return False
    if "title_regex" in rule and not re.search(rule["title_regex"], item.title or ""):
        return False
    if "metadata_key" in rule and not _metadata_has(item, rule["metadata_key"]):
        return False
    return True


class SettingsRulesEngine(ClassificationRulesEngine):
    """Suggest the most restrictive level among matching settings rules."""

    def suggest(self, item):
        matched = [
            rule["level"]
            for rule in getattr(settings, "CLASSIFICATION_RULES", [])
            if rule.get("level") and _matches(rule, item)
        ]
        if not matched:
            return None
        return max(matched, key=ClassificationChoices.get_priority)
