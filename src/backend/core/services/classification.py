"""Data classification service (ADR-0001 §5.4, passe 6).

Resolves the EFFECTIVE data-sensitivity classification of an item: its own
explicit level combined with the MOST RESTRICTIVE classification of the items it
assembles (its `part_of` manifest). A composite is therefore at least as
restrictive as its most sensitive part — you cannot under-classify by assembly.
Thin orchestration over the fat Item core and the ContentRelation graph; setting
a classification is a governed act (audited).
"""

from core import models
from core.services import audit, relations

ClassificationChoices = models.ClassificationChoices


def most_restrictive(levels):
    """Return the most restrictive classification among `levels`, or None.

    None levels (unclassified) are ignored — they do not lower the result.
    """
    valid = [level for level in levels if level]
    if not valid:
        return None
    return max(valid, key=ClassificationChoices.get_priority)


def effective_classification(item):
    """Resolve an item's effective classification (own + most restrictive part)."""
    part_levels = [
        relation.to_item.classification
        for relation in relations.manifest(item)
    ]
    return most_restrictive([item.classification, *part_levels])


def classify(item, level, actor=None):
    """Set an item's own explicit classification (validated) and audit it."""
    if level is not None and level not in ClassificationChoices.values:
        raise ValueError(f"Unknown classification '{level}'.")
    item.classification = level
    item.save(update_fields=["classification", "updated_at"])
    audit.record(
        "item.classify",
        actor=actor,
        target=item,
        metadata={"classification": level},
    )
    return item
