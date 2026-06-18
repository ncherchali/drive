# H1.6 (Coffre): item retention deadline + legal holds. Hand-written to keep the
# migration focused (avoids bundling the pre-existing numchild rename drift).

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0026_item_truth_state"),
    ]

    operations = [
        migrations.AddField(
            model_name="item",
            name="retention_until",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.CreateModel(
            name="LegalHold",
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
                ("name", models.CharField(blank=True, default="", max_length=255)),
                ("reason", models.TextField(blank=True, default="")),
                ("is_active", models.BooleanField(default=True)),
                (
                    "creator",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="legal_holds_created",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "item",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="legal_holds",
                        to="core.item",
                    ),
                ),
            ],
            options={
                "verbose_name": "Legal hold",
                "verbose_name_plural": "Legal holds",
                "db_table": "drive_legal_hold",
                "ordering": ("-created_at",),
            },
        ),
        migrations.AddIndex(
            model_name="legalhold",
            index=models.Index(
                fields=["item", "is_active"], name="drive_legal_hold_item_idx"
            ),
        ),
    ]
