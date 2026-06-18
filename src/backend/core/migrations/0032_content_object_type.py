# E2.2 (ADR-0001 phase 1): content object type registry + WORKSPACE proxy.
# Hand-written to keep the migration focused (avoids bundling the pre-existing
# numchild drift). Seeds the built-in WORKSPACE type and its metadata template.

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def seed_workspace(apps, schema_editor):
    """Register the built-in WORKSPACE type and its default metadata template."""
    metadata_template_model = apps.get_model("core", "MetadataTemplate")
    content_object_type_model = apps.get_model("core", "ContentObjectType")

    template, _ = metadata_template_model.objects.get_or_create(
        key="workspace",
        defaults={
            "name": "Workspace",
            "fields": [
                {"key": "description", "type": "string"},
                {"key": "branding", "type": "string"},
                {"key": "quota_bytes", "type": "number"},
                {
                    "key": "member_policy",
                    "type": "enum",
                    "options": ["open", "invite_only"],
                },
                {"key": "default_classification", "type": "string"},
            ],
        },
    )
    content_object_type_model.objects.get_or_create(
        key="workspace",
        defaults={
            "label": "Workspace",
            "base": "folder",
            "metadata_template": template,
            "behavior_proxy": "core.models.Workspace",
            "allowed_child_types": [],
            "is_active": True,
            "description": (
                "A folder elevated to a first-class workspace (ADR-0001)."
            ),
        },
    )


def unseed_workspace(apps, schema_editor):
    """Reverse the WORKSPACE seed."""
    apps.get_model("core", "ContentObjectType").objects.filter(
        key="workspace"
    ).delete()
    apps.get_model("core", "MetadataTemplate").objects.filter(
        key="workspace"
    ).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0031_metadata_template"),
    ]

    operations = [
        migrations.CreateModel(
            name="ContentObjectType",
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
                ("label", models.CharField(max_length=255)),
                (
                    "base",
                    models.CharField(
                        choices=[("folder", "Folder"), ("file", "File")],
                        default="folder",
                        help_text=(
                            "Structural type this content type inherits from "
                            "(ADR-0001)."
                        ),
                        max_length=30,
                        verbose_name="structural base",
                    ),
                ),
                (
                    "behavior_proxy",
                    models.CharField(
                        blank=True,
                        default="",
                        help_text=(
                            "Dotted path to a Django proxy model implementing "
                            "behaviour."
                        ),
                        max_length=255,
                    ),
                ),
                (
                    "allowed_child_types",
                    models.JSONField(
                        blank=True,
                        default=list,
                        help_text=(
                            "Content-type keys allowed as children; empty = "
                            "unrestricted."
                        ),
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
                        related_name="content_object_types_created",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "metadata_template",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="content_object_types",
                        to="core.metadatatemplate",
                    ),
                ),
            ],
            options={
                "verbose_name": "Content object type",
                "verbose_name_plural": "Content object types",
                "db_table": "drive_content_object_type",
                "ordering": ("label",),
            },
        ),
        migrations.CreateModel(
            name="Workspace",
            fields=[],
            options={
                "verbose_name": "Workspace",
                "verbose_name_plural": "Workspaces",
                "proxy": True,
                "indexes": [],
                "constraints": [],
            },
            bases=("core.item",),
        ),
        migrations.RunPython(seed_workspace, unseed_workspace),
    ]
