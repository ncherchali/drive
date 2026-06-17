# A2-7: tamper-evident hash chain fields on AuditEvent.
# Plain AddField operations; PostgreSQL propagates ADD COLUMN to every partition
# of the (now partitioned) drive_audit_event table automatically.

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0023_partition_audit_event"),
    ]

    operations = [
        migrations.AddField(
            model_name="auditevent",
            name="prev_hash",
            field=models.CharField(
                blank=True, editable=False, max_length=64, null=True
            ),
        ),
        migrations.AddField(
            model_name="auditevent",
            name="entry_hash",
            field=models.CharField(
                blank=True, editable=False, max_length=64, null=True
            ),
        ),
    ]
