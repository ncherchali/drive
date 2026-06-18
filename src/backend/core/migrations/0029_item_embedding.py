# H1.11 / B1-3: AI-ready embeddings table (empty foundation). Hand-written to
# keep the migration focused (avoids bundling the pre-existing numchild drift).
# Stored as a native float[] for now; the pgvector VectorField + HNSW index
# migration lands in H2.2 once the environment ships pgvector.

import uuid

import django.contrib.postgres.fields
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0028_data_room"),
    ]

    operations = [
        migrations.CreateModel(
            name="ItemEmbedding",
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
                ("model_name", models.CharField(max_length=100)),
                ("dimension", models.PositiveIntegerField()),
                (
                    "embedding",
                    django.contrib.postgres.fields.ArrayField(
                        base_field=models.FloatField(),
                        help_text="Embedding vector (pgvector VectorField + HNSW in H2.2).",
                        size=None,
                    ),
                ),
                (
                    "item",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="embeddings",
                        to="core.item",
                    ),
                ),
            ],
            options={
                "verbose_name": "Item embedding",
                "verbose_name_plural": "Item embeddings",
                "db_table": "drive_item_embedding",
            },
        ),
        migrations.AddIndex(
            model_name="itemembedding",
            index=models.Index(
                fields=["item"], name="drive_item_embedding_item_idx"
            ),
        ),
    ]
