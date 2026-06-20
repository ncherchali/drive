"""Tests for the audit outbox / AuditEventSink (passe 3)."""

from unittest import mock

from django.test.utils import override_settings

import pytest

from core import factories, models
from core.audit_sink import get_audit_event_sink
from core.audit_sink.base import AuditEventSink
from core.services import audit, audit_outbox

pytestmark = pytest.mark.django_db

Status = models.AuditOutboxStatusChoices


class _CollectingSink(AuditEventSink):
    """Test sink that records emitted payloads."""

    def __init__(self):
        self.emitted = []

    def emit(self, payload):
        self.emitted.append(payload)


class _FailingSink(AuditEventSink):
    def emit(self, payload):
        raise RuntimeError("sink down")


def _item():
    return factories.ItemFactory()


# --- Enqueue (record) --------------------------------------------------------


@override_settings(FEATURES_AUDIT_OUTBOX=False)
def test_record_does_not_enqueue_when_feature_off():
    audit.record("item.test", target=_item())
    assert models.AuditOutboxEntry.objects.count() == 0


@override_settings(FEATURES_AUDIT_OUTBOX=True)
def test_record_enqueues_outbox_entry_when_feature_on():
    item = _item()
    event = audit.record("item.test", target=item)

    entry = models.AuditOutboxEntry.objects.get()
    assert entry.status == Status.PENDING
    assert entry.audit_event_id == event.id
    assert entry.payload["action"] == "item.test"
    assert entry.payload["target_uuid"] == str(item.id)


# --- Sink factory ------------------------------------------------------------


def test_default_sink_is_the_sovereign_logging_sink():
    get_audit_event_sink.cache_clear()
    sink = get_audit_event_sink()
    assert sink.__class__.__name__ == "LoggingAuditSink"


# --- Processing --------------------------------------------------------------


@override_settings(FEATURES_AUDIT_OUTBOX=True)
def test_process_pending_delivers_and_is_idempotent():
    audit.record("item.a", target=_item())
    audit.record("item.b", target=_item())
    sink = _CollectingSink()

    with mock.patch(
        "core.services.audit_outbox.get_audit_event_sink", return_value=sink
    ):
        first = audit_outbox.process_pending()
        second = audit_outbox.process_pending()  # nothing left

    assert first == {"delivered": 2, "retried": 0, "failed": 0}
    assert second["delivered"] == 0  # idempotent: delivered rows not reprocessed
    assert len(sink.emitted) == 2
    assert models.AuditOutboxEntry.objects.filter(status=Status.DELIVERED).count() == 2


@override_settings(FEATURES_AUDIT_OUTBOX=True)
def test_process_pending_retries_then_dead_letters():
    audit.record("item.a", target=_item())
    sink = _FailingSink()

    with mock.patch(
        "core.services.audit_outbox.get_audit_event_sink", return_value=sink
    ):
        for _ in range(3):
            audit_outbox.process_pending(max_attempts=3)

    entry = models.AuditOutboxEntry.objects.get()
    assert entry.status == Status.FAILED  # dead-lettered after max attempts
    assert entry.attempts == 3
    assert "sink down" in entry.last_error


@override_settings(FEATURES_AUDIT_OUTBOX=True)
def test_process_pending_marks_delivered_with_timestamp():
    audit.record("item.a", target=_item())
    sink = _CollectingSink()

    with mock.patch(
        "core.services.audit_outbox.get_audit_event_sink", return_value=sink
    ):
        audit_outbox.process_pending()

    entry = models.AuditOutboxEntry.objects.get()
    assert entry.delivered_at is not None
