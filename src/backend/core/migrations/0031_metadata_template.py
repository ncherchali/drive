# E2.1: governed metadata templates (MetadataTemplate). Hand-written to keep the
# migration focused (avoids bundling the pre-existing numchild drift).

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

import core.models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0030_signature_request"),
    ]

    operations = [
        migrations.CreateModel(
            name="MetadataTemplate",
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
                (
                    "fields",
                    models.JSONField(
                        default=list,
                        validators=[core.models.validate_template_fields],
                    ),
                ),
                (
                    "creator",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="metadata_templates_created",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "Metadata template",
                "verbose_name_plural": "Metadata templates",
                "db_table": "drive_metadata_template",
                "ordering": ("name",),
            },
        ),
    ]
