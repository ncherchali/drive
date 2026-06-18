# B1-2: canonical status (truth_state) on items. Hand-written to keep the
# migration focused (avoids bundling the pre-existing numchild rename drift).

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0025_sharelink"),
    ]

    operations = [
        migrations.AddField(
            model_name="item",
            name="truth_state",
            field=models.CharField(
                choices=[("draft", "Draft"), ("canonical", "Canonical")],
                default="draft",
                max_length=20,
                verbose_name="truth state",
            ),
        ),
        migrations.AddIndex(
            model_name="item",
            index=models.Index(
                fields=["truth_state"], name="drive_item_truth_state_idx"
            ),
        ),
    ]
