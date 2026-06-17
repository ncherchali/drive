"""Tests for audit partition management & retention (A2-4)."""

from django.db import connection
from django.test import override_settings

import pytest

from core import factories, models
from core.tasks.audit import manage_audit_partitions

pytestmark = pytest.mark.django_db


def _partition_names(cursor):
    cursor.execute(
        "SELECT c.relname FROM pg_inherits i "
        "JOIN pg_class c ON c.oid = i.inhrelid "
        "JOIN pg_class p ON p.oid = i.inhparent "
        "WHERE p.relname = 'drive_audit_event';"
    )
    return {row[0] for row in cursor.fetchall()}


def test_audit_table_is_range_partitioned_with_default():
    """The audit table is a RANGE-partitioned table with a DEFAULT partition."""
    with connection.cursor() as cursor:
        cursor.execute("SELECT relkind FROM pg_class WHERE relname = 'drive_audit_event';")
        assert cursor.fetchone()[0] == "p"  # 'p' = partitioned table
        assert "drive_audit_event_default" in _partition_names(cursor)


def test_audit_event_insert_still_works_on_partitioned_table():
    """Inserting through the ORM routes the row into the partitioned table."""
    event = factories.AuditEventFactory(action="item.create")
    assert models.AuditEvent.objects.filter(pk=event.pk).exists()
    assert models.AuditEvent.objects.filter(action="item.create").count() == 1


def test_manage_audit_partitions_ensures_future_partitions():
    """The task provisions upcoming monthly partitions (idempotently)."""
    result = manage_audit_partitions(months_ahead=4)
    assert len(result["created"]) == 4
    with connection.cursor() as cursor:
        names = _partition_names(cursor)
    for name in result["created"]:
        assert name in names


@override_settings(AUDIT_RETENTION_DAYS=1)
def test_manage_audit_partitions_drops_expired_partitions():
    """With a retention window, monthly partitions past the cutoff are dropped."""
    with connection.cursor() as cursor:
        cursor.execute(
            "CREATE TABLE IF NOT EXISTS drive_audit_event_y2020m01 "
            "PARTITION OF drive_audit_event "
            "FOR VALUES FROM ('2020-01-01') TO ('2020-02-01');"
        )
        assert "drive_audit_event_y2020m01" in _partition_names(cursor)

    result = manage_audit_partitions(months_ahead=1)

    assert "drive_audit_event_y2020m01" in result["dropped"]
    with connection.cursor() as cursor:
        names = _partition_names(cursor)
    assert "drive_audit_event_y2020m01" not in names
    # The default partition is never dropped.
    assert "drive_audit_event_default" in names
