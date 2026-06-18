"""Port for an e-signature provider (H1.8 / Sahla Sign).

Decided (06/2026): no DZ provider exposes a public API yet, so the abstraction
is mandatory and the sovereign mock is the default. A foreign sandbox adapter
(YouSign/DocuSign) may be wired with dummy documents only (loi 25-11) until a DZ
provider ships an API; a sovereign DZ adapter then replaces it without touching
the call surface.
"""

from abc import ABC, abstractmethod


class SignatureProvider(ABC):
    """Abstract e-signature provider."""

    #: True when the provider runs against a (foreign) sandbox — never feed it
    #: real documents.
    is_sandbox = False

    @abstractmethod
    def create_request(self, *, document_key, signer_email, reference):
        """Initiate a signature request and return the provider's external id."""
