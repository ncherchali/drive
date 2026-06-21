"""Classification rules engine factory (passe 6)."""

import functools

from django.conf import settings
from django.utils.module_loading import import_string


@functools.cache
def get_classification_rules_engine():
    """Return the configured classification rules engine (sovereign by default)."""
    return import_string(settings.CLASSIFICATION_RULES_ENGINE)()
