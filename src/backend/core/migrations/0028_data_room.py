# H1.7: data rooms (DataRoom). Hand-written to keep the migration focused
# (avoids bundling the pre-existing numchild rename drift).

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0027_retention_legal_hold"),
    ]

    operations = [
        migrations.CreateModel(
            name="DataRoom",
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
                ("allow_download", models.BooleanField(default=False)),
                ("watermark_enabled", models.BooleanField(default=False)),
                (
                    "creator",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="data_rooms_created",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "item",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="data_room",
                        to="core.item",
                    ),
                ),
            ],
            options={
                "verbose_name": "Data room",
                "verbose_name_plural": "Data rooms",
                "db_table": "drive_data_room",
            },
        ),
    ]
