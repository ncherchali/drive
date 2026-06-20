# E3.1 (RetentionService): retention policy registry. Hand-written to keep the
# migration focused (avoids the pre-existing numchild drift).

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0037_audit_outbox"),
    ]

    operations = [
        migrations.CreateModel(
            name="RetentionPolicy",
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
                ("key", models.SlugField(max_length=100, unique=True)),
                ("name", models.CharField(max_length=255)),
                ("duration_days", models.PositiveIntegerField()),
                (
                    "basis",
                    models.CharField(
                        choices=[
                            ("creation", "Creation date"),
                            ("metadata_date", "Metadata date field"),
                        ],
                        default="creation",
                        max_length=20,
                    ),
                ),
                (
                    "metadata_field",
                    models.CharField(
                        blank=True,
                        default="",
                        help_text=(
                            "Date field key within the template (when "
                            "basis=metadata_date)."
                        ),
                        max_length=100,
                    ),
                ),
                ("is_active", models.BooleanField(default=True)),
                ("description", models.TextField(blank=True, default="")),
                (
                    "creator",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="retention_policies_created",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "metadata_template",
                    models.ForeignKey(
                        blank=True,
                        help_text=(
                            "Template holding the date field (when "
                            "basis=metadata_date)."
                        ),
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="retention_policies",
                        to="core.metadatatemplate",
                    ),
                ),
            ],
            options={
                "verbose_name": "Retention policy",
                "verbose_name_plural": "Retention policies",
                "db_table": "drive_retention_policy",
                "ordering": ("name",),
            },
        ),
    ]
