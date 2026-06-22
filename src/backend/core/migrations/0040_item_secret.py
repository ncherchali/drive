# E4.1 (KMS wiring): sealed secrets attached to items. Hand-written to keep the
# migration focused (avoids the pre-existing numchild drift).

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0039_encryption_key"),
    ]

    operations = [
        migrations.CreateModel(
            name="ItemSecret",
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
                ("name", models.CharField(max_length=255)),
                ("sealed_value", models.TextField()),
                ("key_ref", models.SlugField(max_length=100)),
                (
                    "creator",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="item_secrets_created",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "item",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="secrets",
                        to="core.item",
                    ),
                ),
            ],
            options={
                "verbose_name": "Item secret",
                "verbose_name_plural": "Item secrets",
                "db_table": "drive_item_secret",
                "ordering": ("name",),
            },
        ),
        migrations.AddConstraint(
            model_name="itemsecret",
            constraint=models.UniqueConstraint(
                fields=("item", "name"), name="drive_item_secret_unique_name"
            ),
        ),
    ]
