"""Sovereign mock signature provider (H1.8 / A8-1).

Implements the full flow locally so the signature feature is testable end to end
without any external dependency. The signer's action is simulated through the
API `complete` endpoint.
"""

import uuid

from core.signature.base import SignatureProvider


class MockSignatureProvider(SignatureProvider):
    """In-process mock: `create_request` just mints a fake external id."""

    is_sandbox = False

    def create_request(self, *, document_key, signer_email, reference):
        """Return a fake external id; no external call is made."""
        return f"mock-{uuid.uuid4()}"
