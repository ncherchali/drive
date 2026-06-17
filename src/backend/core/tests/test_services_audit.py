"""Unit tests for the sovereign audit trail service (A2-1)."""

from unittest import mock

from django.contrib.auth.models import AnonymousUser

import pytest

from core import factories, models
from core.services import audit

pytestmark = pytest.mark.django_db


def test_services_audit_record_creates_event():
    """`record` appends an audit event with the given action."""
    user = factories.UserFactory()
    event = audit.record("item.create", actor=user)
    assert event.pk is not None
    assert event.action == "item.create"
    assert models.AuditEvent.objects.count() == 1


def test_services_audit_record_infers_actor_type_user():
    """A User actor yields actor_type=USER and is linked."""
    user = factories.UserFactory()
    event = audit.record("item.update", actor=user)
    assert event.actor == user
    assert event.actor_type == models.AuditActorTypeChoices.USER


def test_services_audit_record_infers_actor_type_system():
    """No actor yields a SYSTEM event with no linked user."""
    event = audit.record("trashbin.purge")
    assert event.actor is None
    assert event.actor_type == models.AuditActorTypeChoices.SYSTEM


def test_services_audit_record_infers_actor_type_anonymous():
    """An AnonymousUser yields an ANONYMOUS event with no linked user."""
    event = audit.record("item.download", actor=AnonymousUser())
    assert event.actor is None
    assert event.actor_type == models.AuditActorTypeChoices.ANONYMOUS


def test_services_audit_record_denormalizes_item_target():
    """An Item target fills target/target_id/target_type/path_snapshot."""
    item = factories.ItemFactory()
    event = audit.record("item.create", target=item)
    assert event.target == item
    assert event.target_uuid == item.pk
    assert event.target_type == "item"
    assert event.path_snapshot == str(item.path)


def test_services_audit_record_non_item_target_keeps_soft_fk_empty():
    """A non-Item target only populates the denormalized fields."""
    user = factories.UserFactory()
    event = audit.record("user.deactivate", target=user)
    assert event.target is None
    assert event.target_uuid == user.pk
    assert event.target_type == "user"


def test_services_audit_record_explicit_actor_type_wins():
    """An explicit actor_type is not overridden by inference."""
    user = factories.UserFactory()
    event = audit.record("apikey.call", actor=user, actor_type=models.AuditActorTypeChoices.API)
    assert event.actor_type == models.AuditActorTypeChoices.API


def test_services_audit_record_fail_silently_swallows_errors():
    """With fail_silently, a write failure is logged and returns None."""
    with mock.patch.object(models.AuditEvent.objects, "create", side_effect=RuntimeError("boom")):
        assert audit.record("item.create", fail_silently=True) is None


def test_services_audit_record_raises_by_default():
    """By default (fail-closed) a write failure propagates."""
    with mock.patch.object(models.AuditEvent.objects, "create", side_effect=RuntimeError("boom")):
        with pytest.raises(RuntimeError):
            audit.record("item.create")


def test_models_audit_event_is_append_only_on_update():
    """An existing audit event cannot be modified."""
    event = factories.AuditEventFactory()
    event.action = "tampered"
    with pytest.raises(RuntimeError, match="append-only"):
        event.save()


def test_models_audit_event_is_append_only_on_delete():
    """An audit event cannot be deleted through the model."""
    event = factories.AuditEventFactory()
    with pytest.raises(RuntimeError, match="append-only"):
        event.delete()
