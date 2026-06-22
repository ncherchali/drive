"""HashiCorp Vault Transit KMS adapter (E4.1 — real, sovereign KMS).

Encrypts/decrypts via Vault's `transit` secrets engine: the key material never
leaves Vault (HSM-like), and deleting the transit key is a true crypto-shred.
Vault is open-source and self-hostable (DZ/Europe) — a sovereign alternative to
US SaaS KMS. As an outbound port it has a timeout, a circuit breaker and is
**fail-closed**: any failure raises KMSError, never leaks plaintext.
"""

import base64

from django.conf import settings

import requests

from core.kms.base import KMSError, KMSProvider
from core.kms.circuit_breaker import CircuitBreaker, CircuitOpenError


class VaultTransitKMSProvider(KMSProvider):
    """KMS over Vault transit (`encrypt`/`decrypt` HTTP endpoints)."""

    def __init__(self, address=None, token=None, mount=None, timeout=None):
        self.address = (address or getattr(settings, "KMS_VAULT_ADDR", "")).rstrip("/")
        self.token = token or getattr(settings, "KMS_VAULT_TOKEN", "")
        self.mount = mount or getattr(settings, "KMS_VAULT_TRANSIT_MOUNT", "transit")
        self.timeout = timeout or getattr(settings, "KMS_TIMEOUT", 5)
        if not self.address or not self.token:
            raise KMSError("Vault KMS is not configured (address/token).")
        self._breaker = CircuitBreaker(
            failure_threshold=getattr(settings, "KMS_BREAKER_FAILURE_THRESHOLD", 5),
            reset_timeout=getattr(settings, "KMS_BREAKER_RESET_TIMEOUT", 30.0),
        )

    def _post(self, path, payload):
        url = f"{self.address}/v1/{self.mount}/{path}"
        headers = {"X-Vault-Token": self.token}

        def do():
            response = requests.post(
                url, json=payload, headers=headers, timeout=self.timeout
            )
            response.raise_for_status()
            return response.json()

        try:
            return self._breaker.call(do)
        except CircuitOpenError as exc:
            raise KMSError("Vault KMS circuit is open.") from exc
        except (requests.RequestException, ValueError) as exc:
            raise KMSError(f"Vault KMS request failed: {exc}") from exc

    def encrypt(self, key_ref, plaintext):
        b64 = base64.b64encode(plaintext.encode()).decode()
        data = self._post(f"encrypt/{key_ref}", {"plaintext": b64})
        try:
            return data["data"]["ciphertext"]
        except (KeyError, TypeError) as exc:
            raise KMSError("Vault KMS returned no ciphertext.") from exc

    def decrypt(self, key_ref, token):
        data = self._post(f"decrypt/{key_ref}", {"ciphertext": token})
        try:
            b64 = data["data"]["plaintext"]
            return base64.b64decode(b64).decode()
        except (KeyError, TypeError, ValueError) as exc:
            raise KMSError("Vault KMS returned no plaintext.") from exc
