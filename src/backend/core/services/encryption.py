"""Envelope encryption service over the KMS (E4.1).

Seals/unseals values under a governed `EncryptionKey` via the configured KMS
provider. Fail-closed: an inactive/missing key or any KMS failure raises — a
sealed value is never returned in clear, and an encrypt that cannot complete
raises rather than storing plaintext. Crypto-shred = deactivate the key (its
sealed values become unrecoverable through the app); the act is audited.
"""

from core import models
from core.kms import KMSError, get_kms_provider
from core.services import audit


def _require_active(key):
    """Raise KMSError unless `key` is an active EncryptionKey."""
    if key is None or not key.is_active:
        raise KMSError("Encryption key is missing or has been shredded.")


def seal(value, key):
    """Encrypt `value` (str) under an active key; return a ciphertext token."""
    _require_active(key)
    return get_kms_provider().encrypt(key.key_ref, value)


def unseal(token, key):
    """Decrypt a ciphertext `token` under an active key; return the plaintext."""
    _require_active(key)
    return get_kms_provider().decrypt(key.key_ref, token)


def crypto_shred(key, actor=None):
    """Logically destroy a key: deactivate it (sealed values become unreadable)."""
    key.is_active = False
    key.save(update_fields=["is_active", "updated_at"])
    audit.record(
        "encryption_key.shred",
        actor=actor,
        target=key,
        target_type="encryptionkey",
        metadata={"key_ref": key.key_ref},
    )
    return key


def get_active_key(key_ref):
    """Return the active EncryptionKey for `key_ref`, or None."""
    return models.EncryptionKey.objects.filter(key_ref=key_ref, is_active=True).first()
