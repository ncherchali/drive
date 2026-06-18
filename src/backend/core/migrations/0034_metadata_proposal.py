# E2.2 (ADR-0001 phase 3): metadata provenance / promotion (MetadataProposal).
# Hand-written to keep the migration focused (avoids the pre-existing numchild
# drift).

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0033_content_relation"),
    ]

    operations = [
        migrations.CreateModel(
            name="MetadataProposal",
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
                ("values", models.JSONField(blank=True, default=dict)),
                (
                    "source",
                    models.CharField(
                        choices=[
                            ("human", "Human"),
                            ("system", "System"),
                            ("agent", "Agent"),
                            ("extraction_job", "Extraction job"),
                        ],
                        default="human",
                        max_length=20,
                    ),
                ),
                (
                    "source_ref",
                    models.CharField(
                        blank=True,
                        default="",
                        help_text=(
                            "Opaque ref to the producing agent/job (e.g. its id)."
                        ),
                        max_length=255,
                    ),
                ),
                (
                    "model",
                    models.CharField(
                        blank=True,
                        default="",
                        help_text="LLM/model that produced the proposal (if any).",
                        max_length=255,
                    ),
                ),
                (
                    "confidence",
                    models.FloatField(
                        blank=True,
                        help_text="Producer confidence in [0, 1].",
                        null=True,
                    ),
                ),
                ("prompt", models.TextField(blank=True, default="")),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("proposed", "Proposed"),
                            ("accepted", "Accepted"),
                            ("rejected", "Rejected"),
                        ],
                        default="proposed",
                        max_length=20,
                    ),
                ),
                (
                    "creator",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="metadata_proposals_created",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "item",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="metadata_proposals",
                        to="core.item",
                    ),
                ),
                (
                    "template",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="proposals",
                        to="core.metadatatemplate",
                    ),
                ),
                (
                    "validated_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="metadata_proposals_validated",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                ("validated_at", models.DateTimeField(blank=True, null=True)),
            ],
            options={
                "verbose_name": "Metadata proposal",
                "verbose_name_plural": "Metadata proposals",
                "db_table": "drive_metadata_proposal",
                "ordering": ("-created_at",),
            },
        ),
        migrations.AddIndex(
            model_name="metadataproposal",
            index=models.Index(
                fields=["item", "status"], name="drive_metadata_proposal_idx"
            ),
        ),
    ]
