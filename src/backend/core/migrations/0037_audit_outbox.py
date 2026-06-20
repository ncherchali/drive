# Passe 3 (AuditEventSink / outbox): transactional outbox for async audit
# shipping. Hand-written to keep the migration focused (avoids the pre-existing
# numchild drift).

import uuid

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0036_item_classification"),
    ]

    operations = [
        migrations.CreateModel(
            name="AuditOutboxEntry",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        help_text="primary key for the record as UUID",
                        primary_key=True,
                        serialize=False,
                        verbose_name="id",
                    ),
                ),
                (
                    "created_at",
                    models.DateTimeField(
                        auto_now_add=True,
                        help_text="date and time at which a record was created",
                        verbose_name="created on",
                    ),
                ),
                (
                    "updated_at",
                    models.DateTimeField(
                        auto_now=True,
                        help_text="date and time at which a record was last updated",
                        verbose_name="updated on",
                    ),
                ),
                ("audit_event_id", models.UUIDField(db_index=True)),
                ("payload", models.JSONField(default=dict)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "Pending"),
                            ("delivered", "Delivered"),
                            ("failed", "Failed"),
                        ],
                        default="pending",
                        max_length=20,
                    ),
                ),
                ("attempts", models.PositiveIntegerField(default=0)),
                ("last_error", models.TextField(blank=True, default="")),
                ("delivered_at", models.DateTimeField(blank=True, null=True)),
            ],
            options={
                "verbose_name": "Audit outbox entry",
                "verbose_name_plural": "Audit outbox entries",
                "db_table": "drive_audit_outbox",
                "ordering": ("created_at",),
            },
        ),
        migrations.AddIndex(
            model_name="auditoutboxentry",
            index=models.Index(
                fields=["status", "created_at"], name="drive_audit_outbox_idx"
            ),
        ),
    ]
