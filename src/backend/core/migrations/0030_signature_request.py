# H1.8: e-signature requests (SignatureRequest). Hand-written to keep the
# migration focused (avoids bundling the pre-existing numchild drift).

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0029_item_embedding"),
    ]

    operations = [
        migrations.CreateModel(
            name="SignatureRequest",
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
                ("signer_email", models.EmailField(max_length=254)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "Pending"),
                            ("signed", "Signed"),
                            ("refused", "Refused"),
                            ("cancelled", "Cancelled"),
                        ],
                        default="pending",
                        max_length=20,
                    ),
                ),
                ("external_id", models.CharField(blank=True, default="", max_length=255)),
                ("signed_at", models.DateTimeField(blank=True, null=True)),
                (
                    "creator",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="signature_requests_created",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "item",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="signature_requests",
                        to="core.item",
                    ),
                ),
            ],
            options={
                "verbose_name": "Signature request",
                "verbose_name_plural": "Signature requests",
                "db_table": "drive_signature_request",
                "ordering": ("-created_at",),
            },
        ),
        migrations.AddIndex(
            model_name="signaturerequest",
            index=models.Index(
                fields=["item", "status"], name="drive_signature_item_idx"
            ),
        ),
    ]
