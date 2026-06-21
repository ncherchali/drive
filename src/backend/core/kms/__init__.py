"""KMS provider factory (E4.1)."""

import functools

from django.conf import settings
from django.utils.module_loading import import_string

from core.kms.base import KMSError, KMSProvider

__all__ = ["KMSError", "KMSProvider", "get_kms_provider"]


@functools.cache
def get_kms_provider():
    """Return the configured KMS provider (sovereign by default)."""
    return import_string(settings.KMS_PROVIDER)(**settings.KMS_PROVIDER_PARAMETERS)
