# E2.2 (ADR-0001 phase 4): RECORD structural type (byte-less content object)
# + a built-in fiche_client record type. Hand-written to keep the migration
# focused (avoids the pre-existing numchild drift). The `type` AlterField is
# state-only (a CharField choices change carries no DB schema change).

from django.db import migrations, models


def seed_fiche_client(apps, schema_editor):
    """Register a structured customer record type (ADR-0001 §4, Ex.3)."""
    metadata_template_model = apps.get_model("core", "MetadataTemplate")
    content_object_type_model = apps.get_model("core", "ContentObjectType")

    template, _ = metadata_template_model.objects.get_or_create(
        key="fiche_client",
        defaults={
            "name": "Fiche client",
            "fields": [
                {"key": "raison_sociale", "type": "string", "required": True},
                {"key": "siren", "type": "string"},
                {
                    "key": "segment",
                    "type": "enum",
                    "options": ["pme", "eti", "grand_compte"],
                },
                {"key": "encours", "type": "number"},
            ],
        },
    )
    content_object_type_model.objects.get_or_create(
        key="fiche_client",
        defaults={
            "label": "Fiche client",
            "base": "record",
            "metadata_template": template,
            "behavior_proxy": "",
            "allowed_child_types": [],
            "required_roles": [],
            "is_active": True,
            "description": "A structured, byte-less customer record (ADR-0001 §4).",
        },
    )


def unseed_fiche_client(apps, schema_editor):
    """Reverse the fiche_client seed."""
    apps.get_model("core", "ContentObjectType").objects.filter(
        key="fiche_client"
    ).delete()
    apps.get_model("core", "MetadataTemplate").objects.filter(
        key="fiche_client"
    ).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0034_metadata_proposal"),
    ]

    operations = [
        migrations.AlterField(
            model_name="item",
            name="type",
            field=models.CharField(
                choices=[
                    ("folder", "Folder"),
                    ("file", "File"),
                    ("record", "Record"),
                ],
                default="folder",
                max_length=30,
            ),
        ),
        migrations.RunPython(seed_fiche_client, unseed_fiche_client),
    ]
