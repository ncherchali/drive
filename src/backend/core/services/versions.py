"""S3 object-version operations for an item's file (H1.4).

The media bucket has S3 versioning enabled, so each re-upload to an item's
`file_key` creates a new object version. This thin service exposes those
versions (list, presigned download, delete, restore) over the boto3 client.
"""

import logging

from django.core.files.storage import default_storage

logger = logging.getLogger(__name__)


def _client():
    return default_storage.connection.meta.client


def list_versions(item):
    """Return the S3 versions of an item's file, newest first."""
    response = _client().list_object_versions(
        Bucket=default_storage.bucket_name, Prefix=item.file_key
    )
    versions = [
        {
            "version_id": entry["VersionId"],
            "last_modified": entry["LastModified"],
            "size": entry["Size"],
            "is_latest": entry["IsLatest"],
            "etag": entry["ETag"].strip('"'),
        }
        for entry in response.get("Versions", [])
        if entry["Key"] == item.file_key
    ]
    versions.sort(key=lambda version: version["last_modified"], reverse=True)
    return versions


def presigned_version_url(item, version_id, expires_in=3600):
    """Return a presigned GET URL for a specific version of an item's file."""
    return _client().generate_presigned_url(
        "get_object",
        Params={
            "Bucket": default_storage.bucket_name,
            "Key": item.file_key,
            "VersionId": version_id,
        },
        ExpiresIn=expires_in,
    )


def delete_version(item, version_id):
    """Permanently delete a specific version of an item's file."""
    _client().delete_object(
        Bucket=default_storage.bucket_name,
        Key=item.file_key,
        VersionId=version_id,
    )


def restore_version(item, version_id):
    """Restore a previous version by copying it onto the key as the new latest."""
    bucket = default_storage.bucket_name
    _client().copy_object(
        Bucket=bucket,
        Key=item.file_key,
        CopySource={"Bucket": bucket, "Key": item.file_key, "VersionId": version_id},
        MetadataDirective="COPY",
    )


def snapshot_current(item, metadata=None):
    """Create a new S3 version from the current content (e.g. after signing).

    Copies the key onto itself with replaced metadata (S3 requires a change to
    copy onto the same key), producing a new object version.
    """
    bucket = default_storage.bucket_name
    _client().copy_object(
        Bucket=bucket,
        Key=item.file_key,
        CopySource={"Bucket": bucket, "Key": item.file_key},
        Metadata=metadata or {"snapshot": "1"},
        MetadataDirective="REPLACE",
    )
