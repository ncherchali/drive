"""Item secrets service (E4.1 — concrete KMS wiring).

Stores sensitive values attached to an item, sealed via the KMS (ciphertext at
rest, never in clear). Setting seals the value under an active EncryptionKey;
revealing unseals it and is AUDITED (a sensitive read). Fail-closed: an
inactive/missing key or a KMS failure raises — a secret is never returned in
clear without a valid key. Shredding the key makes its secrets unrecoverable.
"""

from core import models
from core.services import audit, encryption


class SecretError(Exception):
    """Raised when a secret cannot be sealed or revealed."""


def set_secret(item, name, value, key, actor=None):
    """Seal `value` under `key` and upsert it as a named secret on `item`."""
    if key is None or not key.is_active:
        raise SecretError("No active encryption key for this secret.")
    token = encryption.seal(value, key)
    secret, _ = models.ItemSecret.objects.update_or_create(
        item=item,
        name=name,
        defaults={
            "sealed_value": token,
            "key_ref": key.key_ref,
            "creator": actor if actor and actor.is_authenticated else None,
        },
    )
    audit.record(
        "item.secret_set",
        actor=actor,
        target=item,
        metadata={"secret": name, "key_ref": key.key_ref},
    )
    return secret


def reveal_secret(secret, actor=None):
    """Unseal a secret's value (audited sensitive read). Fail-closed."""
    key = encryption.get_active_key(secret.key_ref)
    value = encryption.unseal(secret.sealed_value, key)
    audit.record(
        "item.secret_reveal",
        actor=actor,
        target=secret.item,
        metadata={"secret": secret.name},
    )
    return value
