"""Sovereign default audit sink: structured logging (passe 3).

Emits each audit event to the application logger — no external dependency, no
SaaS. Suitable for self-hosted/DZ deployments where logs are collected locally;
a real SIEM/analytics adapter can replace it via the AUDIT_EVENT_SINK setting.
"""

import json
import logging

from core.audit_sink.base import AuditEventSink

logger = logging.getLogger("core.audit.sink")


class LoggingAuditSink(AuditEventSink):
    """Ship audit events to the standard logger as structured JSON."""

    def __init__(self, level=logging.INFO):
        self.level = level

    def emit(self, payload):
        logger.log(self.level, "audit %s", json.dumps(payload, sort_keys=True, default=str))
