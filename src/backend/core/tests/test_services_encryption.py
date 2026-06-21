"""Tests for the KMS provider + envelope encryption service (E4.1)."""

from django.test.utils import override_settings

import pytest

from core import factories, models
from core.kms import KMSError, get_kms_provider
from core.kms.local_provider import LocalKMSProvider
from core.services import encryption

pytestmark = pytest.mark.django_db


# --- Local KMS provider ------------------------------------------------------


def test_default_provider_is_the_sovereign_local_one():
    get_kms_provider.cache_clear()
    assert isinstance(get_kms_provider(), LocalKMSProvider)


def test_local_provider_roundtrip():
    provider = LocalKMSProvider(master_key="master")
    token = provider.encrypt("k1", "secret value")
    assert token != "secret value"
    assert provider.decrypt("k1", token) == "secret value"


def test_local_provider_different_key_ref_cannot_decrypt():
    provider = LocalKMSProvider(master_key="master")
    token = provider.encrypt("k1", "secret")
    with pytest.raises(KMSError):
        provider.decrypt("k2", token)  # different derived key → fail-closed


def test_local_provider_invalid_token_raises():
    provider = LocalKMSProvider(master_key="master")
    with pytest.raises(KMSError):
        provider.decrypt("k1", "not-a-token")


@override_settings(KMS_MASTER_KEY="")
def test_local_provider_requires_master_key():
    with pytest.raises(KMSError):
        LocalKMSProvider()  # no arg + empty setting → fail-closed


# --- Encryption service ------------------------------------------------------


@override_settings(KMS_MASTER_KEY="svc-master")
def test_seal_unseal_roundtrip():
    get_kms_provider.cache_clear()
    key = factories.EncryptionKeyFactory(key_ref="contracts")
    token = encryption.seal("classified payload", key)
    assert encryption.unseal(token, key) == "classified payload"


@override_settings(KMS_MASTER_KEY="svc-master")
def test_crypto_shred_makes_unseal_fail_closed():
    get_kms_provider.cache_clear()
    key = factories.EncryptionKeyFactory(key_ref="contracts")
    token = encryption.seal("classified payload", key)

    encryption.crypto_shred(key)

    key.refresh_from_db()
    assert key.is_active is False
    with pytest.raises(KMSError):
        encryption.unseal(token, key)  # shredded → fail-closed
    assert models.AuditEvent.objects.filter(
        action="encryption_key.shred", target_uuid=key.id
    ).exists()


def test_seal_with_inactive_key_is_fail_closed():
    key = factories.EncryptionKeyFactory(is_active=False)
    with pytest.raises(KMSError):
        encryption.seal("x", key)


def test_get_active_key_ignores_shredded():
    factories.EncryptionKeyFactory(key_ref="k", is_active=False)
    assert encryption.get_active_key("k") is None
