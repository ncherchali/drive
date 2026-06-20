# Passe 6 (ADR-0001 §5.4): data classification level on Item. Hand-written to
# keep the migration focused (avoids the pre-existing numchild drift).

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0035_item_record_type"),
    ]

    operations = [
        migrations.AddField(
            model_name="item",
            name="classification",
            field=models.CharField(
                blank=True,
                choices=[
                    ("public", "Public"),
                    ("internal", "Internal"),
                    ("confidential", "Confidential"),
                    ("secret", "Secret"),
                ],
                max_length=20,
                null=True,
                verbose_name="classification",
            ),
        ),
        migrations.AddIndex(
            model_name="item",
            index=models.Index(
                fields=["classification"], name="drive_item_classification_idx"
            ),
        ),
    ]
