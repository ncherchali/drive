# E2.2 (ADR-0001 phase 2): content composition/reference graph (ContentRelation)
# + `required_roles` on the type registry + a built-in composite_doc type.
# Hand-written to keep the migration focused (avoids the pre-existing numchild
# drift).

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def seed_composite_doc(apps, schema_editor):
    """Register a generic composite document type (ADR-0001 §5)."""
    content_object_type_model = apps.get_model("core", "ContentObjectType")
    content_object_type_model.objects.get_or_create(
        key="composite_doc",
        defaults={
            "label": "Composite document",
            "base": "folder",
            "behavior_proxy": "",
            "allowed_child_types": [],
            "required_roles": [],
            "is_active": True,
            "description": (
                "A document assembled from parts by reference (manifest); "
                "ADR-0001 §5."
            ),
        },
    )


def unseed_composite_doc(apps, schema_editor):
    """Reverse the composite_doc seed."""
    apps.get_model("core", "ContentObjectType").objects.filter(
        key="composite_doc"
    ).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0032_content_object_type"),
    ]

    operations = [
        migrations.AddField(
            model_name="contentobjecttype",
            name="required_roles",
            field=models.JSONField(
                blank=True,
                default=list,
                help_text=(
                    "Manifest roles a composite of this type must carry to be "
                    "complete (ADR-0001 §5.3)."
                ),
            ),
        ),
        migrations.CreateModel(
            name="ContentRelation",
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
                (
                    "relation_type",
                    models.CharField(
                        choices=[
                            ("part_of", "Part of"),
                            ("references", "References"),
                            ("derived_from", "Derived from"),
                            ("version_of", "Version of"),
                            ("renders_to", "Renders to"),
                        ],
                        max_length=20,
                    ),
                ),
                ("role", models.CharField(blank=True, default="", max_length=100)),
                ("order", models.PositiveIntegerField(default=0)),
                (
                    "pinned_version",
                    models.CharField(
                        blank=True,
                        default="",
                        help_text=(
                            "S3 version id of the pinned part; empty = follow "
                            "latest."
                        ),
                        max_length=255,
                    ),
                ),
                (
                    "creator",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="content_relations_created",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "from_item",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="relations_from",
                        to="core.item",
                    ),
                ),
                (
                    "to_item",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="relations_to",
                        to="core.item",
                    ),
                ),
            ],
            options={
                "verbose_name": "Content relation",
                "verbose_name_plural": "Content relations",
                "db_table": "drive_content_relation",
                "ordering": ("from_item", "order"),
            },
        ),
        migrations.AddIndex(
            model_name="contentrelation",
            index=models.Index(
                fields=["from_item", "relation_type"],
                name="drive_relation_from_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="contentrelation",
            index=models.Index(
                fields=["to_item", "relation_type"], name="drive_relation_to_idx"
            ),
        ),
        migrations.AddConstraint(
            model_name="contentrelation",
            constraint=models.UniqueConstraint(
                fields=("from_item", "to_item", "relation_type", "role"),
                name="drive_content_relation_unique_edge",
            ),
        ),
        migrations.AddConstraint(
            model_name="contentrelation",
            constraint=models.CheckConstraint(
                condition=~models.Q(from_item=models.F("to_item")),
                name="drive_content_relation_no_self_loop",
            ),
        ),
        migrations.RunPython(seed_composite_doc, unseed_composite_doc),
    ]
