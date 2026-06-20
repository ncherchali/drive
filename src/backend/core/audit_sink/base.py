"""AuditEventSink port (passe 3).

A sink ships an audit event to an external system (SIEM, analytics, governance
hub). Adapters must be **sovereign by default** (no SaaS US — replaces PostHog).
Implementations raise on delivery failure so the outbox can retry / dead-letter.
"""

import abc


class AuditEventSink(abc.ABC):
    """Port: deliver an audit event payload to an external sink."""

    @abc.abstractmethod
    def emit(self, payload):
        """Deliver a single audit event payload (a JSON-serializable dict).

        Must raise on failure so the caller (outbox) can retry or dead-letter.
        """
