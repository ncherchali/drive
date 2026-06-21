"""Tests for the retention & disposition service (E3.1)."""

from datetime import timedelta

from django.utils import timezone

import pytest

from core import factories, models
from core.services import retention

pytestmark = pytest.mark.django_db

Basis = models.RetentionBasisChoices


def test_compute_from_creation_basis():
    item = factories.ItemFactory()
    policy = factories.RetentionPolicyFactory(duration_days=30, basis=Basis.CREATION)

    until = retention.compute_retention_until(policy, item)

    assert until == item.created_at + timedelta(days=30)


def test_compute_from_metadata_date_basis():
    template = factories.MetadataTemplateFactory(key="contract")
    item = factories.ItemFactory(metadata={"contract": {"end_date": "2030-01-01"}})
    policy = factories.RetentionPolicyFactory(
        duration_days=365,
        basis=Basis.METADATA_DATE,
        metadata_template=template,
        metadata_field="end_date",
    )

    until = retention.compute_retention_until(policy, item)

    assert until.year == 2031 and until.month == 1 and until.day == 1


def test_compute_metadata_basis_missing_field_raises():
    template = factories.MetadataTemplateFactory(key="contract")
    item = factories.ItemFactory(metadata={})
    policy = factories.RetentionPolicyFactory(
        basis=Basis.METADATA_DATE,
        metadata_template=template,
        metadata_field="end_date",
    )

    with pytest.raises(retention.RetentionError):
        retention.compute_retention_until(policy, item)


def test_apply_policy_sets_retention_and_audits():
    item = factories.ItemFactory()
    policy = factories.RetentionPolicyFactory(duration_days=10, basis=Basis.CREATION)

    retention.apply_policy(item, policy)

    item.refresh_from_db()
    assert item.retention_until is not None
    assert item.is_under_retention
    assert models.AuditEvent.objects.filter(
        action="item.retention_policy_applied", target_uuid=item.id
    ).exists()


def test_set_retention_is_extend_only():
    item = factories.ItemFactory()
    far = timezone.now() + timedelta(days=100)
    retention.set_retention(item, far)

    with pytest.raises(retention.RetentionError):
        retention.set_retention(item, timezone.now() + timedelta(days=10))


def _expired(**kwargs):
    item = factories.ItemFactory(**kwargs)
    item.retention_until = timezone.now() - timedelta(days=1)
    item.save(update_fields=["retention_until"])
    return item


def test_dispose_soft_deletes_and_audits():
    item = _expired()

    retention.dispose(item)

    item.refresh_from_db()
    assert item.deleted_at is not None
    assert models.AuditEvent.objects.filter(
        action="item.retention_disposed", target_uuid=item.id
    ).exists()


def test_run_disposition_disposes_only_eligible():
    expired = _expired()
    held = _expired()
    factories.LegalHoldFactory(item=held, is_active=True)
    active = factories.ItemFactory()
    active.retention_until = timezone.now() + timedelta(days=10)
    active.save(update_fields=["retention_until"])

    result = retention.run_disposition()

    assert result["disposed"] == 1
    assert str(expired.id) in result["ids"]
    expired.refresh_from_db()
    held.refresh_from_db()
    active.refresh_from_db()
    assert expired.deleted_at is not None
    assert held.deleted_at is None  # legal hold protects it
    assert active.deleted_at is None  # still under retention


def test_run_disposition_is_idempotent():
    _expired()
    first = retention.run_disposition()
    second = retention.run_disposition()
    assert first["disposed"] == 1
    assert second["disposed"] == 0  # nothing left to dispose


def test_disposition_candidates_excludes_held_and_unexpired():
    now = timezone.now()
    # Expired, no hold → candidate.
    expired = factories.ItemFactory()
    expired.retention_until = now - timedelta(days=1)
    expired.save(update_fields=["retention_until"])
    # Expired but under legal hold → excluded.
    held = factories.ItemFactory()
    held.retention_until = now - timedelta(days=1)
    held.save(update_fields=["retention_until"])
    factories.LegalHoldFactory(item=held, is_active=True)
    # Still under retention → excluded.
    active = factories.ItemFactory()
    active.retention_until = now + timedelta(days=10)
    active.save(update_fields=["retention_until"])

    candidates = set(retention.disposition_candidates().values_list("id", flat=True))

    assert expired.id in candidates
    assert held.id not in candidates
    assert active.id not in candidates
