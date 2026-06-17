# A2-4: convert drive_audit_event to a monthly RANGE-partitioned table.
#
# The table was added empty in 0022, so the physical conversion is safe and
# loss-free. We only touch the DATABASE (SeparateDatabaseAndState with empty
# state operations): the Django model is unchanged and still treats `id` as its
# primary key. At the DB level the partition key (created_at) must belong to the
# primary key, so the physical PK becomes the composite (id, created_at).
#
# A DEFAULT partition guarantees every insert lands somewhere (incl. tests using
# frozen dates and any date outside the pre-created monthly partitions). Monthly
# partitions are created ahead of time by the `manage_audit_partitions` task,
# which also drops partitions older than AUDIT_RETENTION_DAYS.

from datetime import date

from django.db import migrations

FORWARD_SQL = """
-- The table is new and empty (added in 0022): drop it (clears its indexes,
-- FKs and PK by the same names) and recreate it as a partitioned table.
DROP TABLE drive_audit_event;

CREATE TABLE drive_audit_event (
    id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    actor_type varchar(20) NOT NULL,
    action varchar(100) NOT NULL,
    target_uuid uuid,
    target_type varchar(50) NOT NULL,
    path_snapshot text NOT NULL,
    metadata jsonb NOT NULL,
    actor_id uuid,
    target_id uuid,
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE INDEX drive_audit_event_created_at_06c5d573 ON drive_audit_event (created_at);
CREATE INDEX drive_audit_event_actor_id_3f4002c6 ON drive_audit_event (actor_id);
CREATE INDEX drive_audit_event_target_id_387d526e ON drive_audit_event (target_id);
CREATE INDEX drive_audit_target_idx ON drive_audit_event (target_uuid);
CREATE INDEX drive_audit_actor_idx ON drive_audit_event (actor_id, created_at DESC);
CREATE INDEX drive_audit_action_idx ON drive_audit_event (action, created_at DESC);

ALTER TABLE drive_audit_event
    ADD CONSTRAINT drive_audit_event_actor_id_3f4002c6_fk_drive_user_id
    FOREIGN KEY (actor_id) REFERENCES drive_user(id) DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE drive_audit_event
    ADD CONSTRAINT drive_audit_event_target_id_387d526e_fk_drive_item_id
    FOREIGN KEY (target_id) REFERENCES drive_item(id) DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE drive_audit_event_default PARTITION OF drive_audit_event DEFAULT;
"""

# Reverse: rebuild a plain (non-partitioned) table. Best-effort for dev rollback;
# audit rows are not preserved.
REVERSE_SQL = """
DROP TABLE drive_audit_event;

CREATE TABLE drive_audit_event (
    id uuid NOT NULL PRIMARY KEY,
    created_at timestamp with time zone NOT NULL,
    actor_type varchar(20) NOT NULL,
    action varchar(100) NOT NULL,
    target_uuid uuid,
    target_type varchar(50) NOT NULL,
    path_snapshot text NOT NULL,
    metadata jsonb NOT NULL,
    actor_id uuid,
    target_id uuid
);

CREATE INDEX drive_audit_event_created_at_06c5d573 ON drive_audit_event (created_at);
CREATE INDEX drive_audit_event_actor_id_3f4002c6 ON drive_audit_event (actor_id);
CREATE INDEX drive_audit_event_target_id_387d526e ON drive_audit_event (target_id);
CREATE INDEX drive_audit_target_idx ON drive_audit_event (target_uuid);
CREATE INDEX drive_audit_actor_idx ON drive_audit_event (actor_id, created_at DESC);
CREATE INDEX drive_audit_action_idx ON drive_audit_event (action, created_at DESC);

ALTER TABLE drive_audit_event
    ADD CONSTRAINT drive_audit_event_actor_id_3f4002c6_fk_drive_user_id
    FOREIGN KEY (actor_id) REFERENCES drive_user(id) DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE drive_audit_event
    ADD CONSTRAINT drive_audit_event_target_id_387d526e_fk_drive_item_id
    FOREIGN KEY (target_id) REFERENCES drive_item(id) DEFERRABLE INITIALLY DEFERRED;
"""


def _next_month(year, month):
    return (year + 1, 1) if month == 12 else (year, month + 1)


def create_initial_partitions(apps, schema_editor):
    """Create the current month and the next two monthly partitions."""
    if schema_editor.connection.vendor != "postgresql":
        return
    today = date.today()  # migration runs at deploy time; deterministic enough
    year, month = today.year, today.month
    with schema_editor.connection.cursor() as cursor:
        for _ in range(3):
            start = date(year, month, 1)
            ny, nm = _next_month(year, month)
            end = date(ny, nm, 1)
            name = f"drive_audit_event_y{year}m{month:02d}"
            cursor.execute(
                f'CREATE TABLE IF NOT EXISTS "{name}" '
                f"PARTITION OF drive_audit_event "
                f"FOR VALUES FROM ('{start.isoformat()}') TO ('{end.isoformat()}');"
            )
            year, month = ny, nm


def drop_initial_partitions(apps, schema_editor):
    """No-op: the reverse SQL drops the whole table anyway."""


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0022_item_metadata_and_auditevent"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[migrations.RunSQL(FORWARD_SQL, REVERSE_SQL)],
            state_operations=[],
        ),
        migrations.RunPython(create_initial_partitions, drop_initial_partitions),
    ]
