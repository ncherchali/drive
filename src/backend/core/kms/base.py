"""KMSProvider port (E4.1 — encryption key management / BYOK).

Wraps an item of plaintext under a key identified by an opaque `key_ref` (the
key material lives in the KMS, never in the app DB). Adapters must be **sovereign
by default** (no SaaS US) and **fail-closed**: any KMS failure raises
:class:`KMSError` — never return plaintext on an encrypt failure, never return
garbage on a decrypt failure. BYOK = the `key_ref` points to the customer's own
key in their KMS.
"""

import abc


class KMSError(Exception):
    """Raised when a KMS operation fails (fail-closed)."""


class KMSProvider(abc.ABC):
    """Port: encrypt/decrypt under a key referenced by `key_ref`."""

    @abc.abstractmethod
    def encrypt(self, key_ref, plaintext):
        """Return a ciphertext token (str) for `plaintext` (str) under `key_ref`.

        Raises KMSError on any failure (fail-closed — never leak plaintext).
        """

    @abc.abstractmethod
    def decrypt(self, key_ref, token):
        """Return the plaintext (str) for a ciphertext `token` under `key_ref`.

        Raises KMSError when the token is invalid or the key is unavailable.
        """
