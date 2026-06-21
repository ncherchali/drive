"""ClassificationRulesEngine port (passe 6 — auto-classification).

Suggests a data-sensitivity level for an item from rules (its content type,
mimetype, title, metadata…). Adapters must be **sovereign by default** (no SaaS):
the suggestion stays local. The ClassificationService raises an item's level to
the suggestion (never lowers it — you cannot under-classify by rule).
"""

import abc


class ClassificationRulesEngine(abc.ABC):
    """Port: suggest a classification level for an item, or None."""

    @abc.abstractmethod
    def suggest(self, item):
        """Return a suggested `ClassificationChoices` value for `item`, or None."""
