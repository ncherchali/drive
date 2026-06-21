"""Sovereign default KMS: self-managed local keys (E4.1).

Derives a distinct symmetric key per `key_ref` from a master secret
(`KMS_MASTER_KEY`) and encrypts with Fernet (AES-128-CBC + HMAC). No external
dependency — suitable for self-hosted/DZ deployments. A real cloud/HSM KMS (or a
customer BYOK endpoint) can replace it via the KMS_PROVIDER setting.

Note: keys are derived deterministically, so true key destruction (crypto-shred)
requires rotating the master or a real KMS; at the app boundary, shredding is
modeled by deactivating the EncryptionKey (the service then refuses to unseal).
"""

import base64
import hashlib

from django.conf import settings

from cryptography.fernet import Fernet, InvalidToken

from core.kms.base import KMSError, KMSProvider


class LocalKMSProvider(KMSProvider):
    """Fernet over a per-key_ref key derived from KMS_MASTER_KEY."""

    def __init__(self, master_key=None):
        self.master_key = master_key or getattr(settings, "KMS_MASTER_KEY", "")
        if not self.master_key:
            raise KMSError("KMS_MASTER_KEY is not configured.")

    def _fernet(self, key_ref):
        digest = hashlib.sha256(f"{self.master_key}:{key_ref}".encode()).digest()
        return Fernet(base64.urlsafe_b64encode(digest))

    def encrypt(self, key_ref, plaintext):
        try:
            return self._fernet(key_ref).encrypt(plaintext.encode()).decode()
        except (AttributeError, ValueError, TypeError) as exc:
            raise KMSError(f"Encryption failed for key '{key_ref}'.") from exc

    def decrypt(self, key_ref, token):
        try:
            return self._fernet(key_ref).decrypt(token.encode()).decode()
        except (InvalidToken, ValueError, TypeError) as exc:
            raise KMSError(f"Decryption failed for key '{key_ref}'.") from exc
