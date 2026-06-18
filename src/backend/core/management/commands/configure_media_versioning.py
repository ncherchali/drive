"""Configure S3 versioning and the non-current version lifecycle (H1.4).

Ensures bucket versioning is enabled and installs a lifecycle rule that expires
non-current object versions after `MEDIA_VERSION_RETENTION_DAYS` days, so old
file versions do not accumulate forever.
"""

from django.conf import settings
from django.core.files.storage import default_storage
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    """Enable versioning and set the non-current version expiration lifecycle."""

    help = "Enable bucket versioning and expire non-current versions per the settings"

    def handle(self, *args, **options):
        """Handle the command."""
        s3_client = default_storage.connection.meta.client
        bucket = default_storage.bucket_name

        s3_client.put_bucket_versioning(
            Bucket=bucket,
            VersioningConfiguration={"Status": "Enabled"},
        )

        retention_days = int(settings.MEDIA_VERSION_RETENTION_DAYS)
        s3_client.put_bucket_lifecycle_configuration(
            Bucket=bucket,
            LifecycleConfiguration={
                "Rules": [
                    {
                        "ID": "expire-noncurrent-versions",
                        "Filter": {"Prefix": ""},
                        "Status": "Enabled",
                        "NoncurrentVersionExpiration": {
                            "NoncurrentDays": retention_days
                        },
                    }
                ]
            },
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"Versioning enabled; non-current versions expire after "
                f"{retention_days} days."
            )
        )
