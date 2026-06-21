# E4.1 (KMS / BYOK): encryption key registry (references only — key material
# lives in the KMS). Hand-written to keep the migration focused (avoids the
# pre-existing numchild drift).

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0038_retention_policy"),
    ]

    operations = [
        migrations.CreateModel(
            name="EncryptionKey",
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
                ("key_ref", models.SlugField(max_length=100, unique=True)),
                ("label", models.CharField(max_length=255)),
                (
                    "provider",
                    models.CharField(
                        blank=True,
                        default="",
                        help_text=(
                            "KMS holding the key (empty = the configured default)."
                        ),
                        max_length=255,
                    ),
                ),
                ("is_active", models.BooleanField(default=True)),
                (
                    "creator",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="encryption_keys_created",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "Encryption key",
                "verbose_name_plural": "Encryption keys",
                "db_table": "drive_encryption_key",
                "ordering": ("label",),
            },
        ),
    ]
