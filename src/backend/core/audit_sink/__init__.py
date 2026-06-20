"""Audit event sink factory (passe 3)."""

import functools

from django.conf import settings
from django.utils.module_loading import import_string


@functools.cache
def get_audit_event_sink():
    """Return the configured audit event sink (sovereign by default)."""
    return import_string(settings.AUDIT_EVENT_SINK)(
        **settings.AUDIT_EVENT_SINK_PARAMETERS
    )
