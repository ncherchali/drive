# H1.3: advanced share links (ShareLink). Hand-written to keep the migration
# focused (avoids bundling the pre-existing numchild rename drift).

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

from lasuite.drf.models.choices import LinkRoleChoices


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0024_auditevent_hash_chain"),
    ]

    operations = [
        migrations.CreateModel(
            name="ShareLink",
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
                ("token", models.CharField(editable=False, max_length=64, unique=True)),
                (
                    "role",
                    models.CharField(
                        choices=LinkRoleChoices.choices,
                        default=LinkRoleChoices.READER,
                        max_length=20,
                    ),
                ),
                (
                    "password_hash",
                    models.CharField(blank=True, max_length=128, null=True),
                ),
                ("expires_at", models.DateTimeField(blank=True, null=True)),
                ("max_downloads", models.PositiveIntegerField(blank=True, null=True)),
                ("download_count", models.PositiveIntegerField(default=0)),
                (
                    "creator",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="share_links_created",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "item",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="share_links",
                        to="core.item",
                    ),
                ),
            ],
            options={
                "verbose_name": "Share link",
                "verbose_name_plural": "Share links",
                "db_table": "drive_share_link",
                "ordering": ("-created_at",),
            },
        ),
    ]
