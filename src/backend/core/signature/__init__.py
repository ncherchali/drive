"""Pluggable e-signature provider (H1.8 / Sahla Sign)."""

import functools

from django.conf import settings
from django.utils.module_loading import import_string

from core.signature.base import SignatureProvider


@functools.cache
def get_signature_provider():
    """Return the configured signature provider instance."""
    return import_string(settings.SIGNATURE_PROVIDER_CLASS)()


__all__ = ["SignatureProvider", "get_signature_provider"]
