"""Tests for the tamper-evident audit hash chain (A2-7)."""

from django.test import override_settings

import pytest
from freezegun import freeze_time

from core import factories, models
from core.services import audit

pytestmark = pytest.mark.django_db


def _chain_three(user):
    """Record three chained events at strictly increasing timestamps."""
    with freeze_time("2026-06-17 10:00:00"):
        first = audit.record("item.create", actor=user)
    with freeze_time("2026-06-17 10:00:01"):
        second = audit.record("item.update", actor=user)
    with freeze_time("2026-06-17 10:00:02"):
        third = audit.record("item.trash", actor=user)
    return first, second, third


def test_audit_chain_disabled_by_default():
    """With the flag off, events carry no hash."""
    event = audit.record("item.create", actor=factories.UserFactory())
    assert event.entry_hash is None
    assert event.prev_hash is None


@override_settings(FEATURES_AUDIT_TAMPER_EVIDENT=True)
def test_audit_chain_links_events_and_verifies():
    """With the flag on, events are hash-linked and the chain verifies."""
    user = factories.UserFactory()
    first, second, third = _chain_three(user)

    assert first.prev_hash == ""  # genesis
    assert first.entry_hash
    assert second.prev_hash == first.entry_hash
    assert third.prev_hash == second.entry_hash

    is_valid, problems = audit.verify_chain()
    assert is_valid, problems


@override_settings(FEATURES_AUDIT_TAMPER_EVIDENT=True)
def test_audit_chain_detects_alteration():
    """Altering a recorded event's content is detected by verification."""
    user = factories.UserFactory()
    _, second, _ = _chain_three(user)

    # Bypass the append-only guard to simulate tampering at the DB level.
    models.AuditEvent.objects.filter(pk=second.pk).update(action="tampered")

    is_valid, problems = audit.verify_chain()
    assert not is_valid
    assert any("hash mismatch" in p for p in problems)


@override_settings(FEATURES_AUDIT_TAMPER_EVIDENT=True)
def test_audit_chain_detects_deletion():
    """Removing a chained event breaks the chain and is detected."""
    user = factories.UserFactory()
    _, second, _ = _chain_three(user)

    models.AuditEvent.objects.filter(pk=second.pk).delete()

    is_valid, problems = audit.verify_chain()
    assert not is_valid
    assert any("missing/removed link" in p for p in problems)
