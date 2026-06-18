"""Tests for item file versions (H1.4). The S3 client is mocked."""

from datetime import timedelta
from unittest import mock

from django.utils import timezone

import pytest
from rest_framework.test import APIClient

from core import factories, models
from core.services import versions as versions_service

pytestmark = pytest.mark.django_db

CLIENT_PATH = "core.services.versions._client"


def _client(user):
    client = APIClient()
    client.force_login(user)
    return client


def _file(owner, *extra_users):
    return factories.ItemFactory(
        type=models.ItemTypeChoices.FILE,
        users=[(owner, models.RoleChoices.OWNER), *extra_users],
    )


def _mock_s3_with_versions(item):
    client = mock.MagicMock()
    now = timezone.now()
    client.list_object_versions.return_value = {
        "Versions": [
            {
                "Key": item.file_key,
                "VersionId": "v2",
                "LastModified": now,
                "Size": 20,
                "IsLatest": True,
                "ETag": '"aaa"',
            },
            {
                "Key": item.file_key,
                "VersionId": "v1",
                "LastModified": now - timedelta(hours=1),
                "Size": 10,
                "IsLatest": False,
                "ETag": '"bbb"',
            },
            {
                "Key": "item/other/x.txt",
                "VersionId": "vx",
                "LastModified": now,
                "Size": 5,
                "IsLatest": True,
                "ETag": '"ccc"',
            },
        ]
    }
    client.generate_presigned_url.return_value = "https://example/presigned"
    return client


# --- service ---------------------------------------------------------------


def test_service_list_versions_filters_by_key_and_sorts_newest_first():
    item = factories.ItemFactory(type=models.ItemTypeChoices.FILE)
    s3 = _mock_s3_with_versions(item)
    with mock.patch(CLIENT_PATH, return_value=s3):
        result = versions_service.list_versions(item)
    assert [v["version_id"] for v in result] == ["v2", "v1"]
    assert {v["etag"] for v in result} == {"aaa", "bbb"}  # quotes stripped, key filtered


# --- list ------------------------------------------------------------------


def test_api_item_versions_list_as_reader():
    owner = factories.UserFactory()
    reader = factories.UserFactory()
    item = _file(owner, (reader, models.RoleChoices.READER))
    s3 = _mock_s3_with_versions(item)
    with mock.patch(CLIENT_PATH, return_value=s3):
        response = _client(reader).get(f"/api/v1.0/items/{item.id!s}/versions/")
    assert response.status_code == 200
    body = response.json()
    assert [v["version_id"] for v in body] == ["v2", "v1"]
    assert body[0]["is_latest"] is True


def test_api_item_versions_folder_is_forbidden():
    owner = factories.UserFactory()
    item = factories.ItemFactory(
        type=models.ItemTypeChoices.FOLDER,
        users=[(owner, models.RoleChoices.OWNER)],
    )
    response = _client(owner).get(f"/api/v1.0/items/{item.id!s}/versions/")
    assert response.status_code == 403


# --- download a specific version -------------------------------------------


def test_api_item_versions_download_url():
    owner = factories.UserFactory()
    item = _file(owner)
    s3 = _mock_s3_with_versions(item)
    with mock.patch(CLIENT_PATH, return_value=s3):
        response = _client(owner).get(f"/api/v1.0/items/{item.id!s}/versions/v1/")
    assert response.status_code == 200
    assert response.json()["url"] == "https://example/presigned"


# --- restore ---------------------------------------------------------------


def test_api_item_versions_restore_as_editor_records_audit():
    owner = factories.UserFactory()
    editor = factories.UserFactory()
    item = _file(owner, (editor, models.RoleChoices.EDITOR))
    s3 = mock.MagicMock()
    with mock.patch(CLIENT_PATH, return_value=s3):
        response = _client(editor).post(
            f"/api/v1.0/items/{item.id!s}/versions/v1/restore/"
        )
    assert response.status_code == 200
    assert s3.copy_object.called
    assert models.AuditEvent.objects.filter(
        action="version.restore", target_uuid=item.id
    ).exists()


def test_api_item_versions_restore_forbidden_for_reader():
    owner = factories.UserFactory()
    reader = factories.UserFactory()
    item = _file(owner, (reader, models.RoleChoices.READER))
    response = _client(reader).post(
        f"/api/v1.0/items/{item.id!s}/versions/v1/restore/"
    )
    assert response.status_code == 403


# --- delete a version ------------------------------------------------------


def test_api_item_versions_delete_as_owner_records_audit():
    owner = factories.UserFactory()
    item = _file(owner)
    s3 = mock.MagicMock()
    with mock.patch(CLIENT_PATH, return_value=s3):
        response = _client(owner).delete(f"/api/v1.0/items/{item.id!s}/versions/v1/")
    assert response.status_code == 204
    assert s3.delete_object.called
    assert models.AuditEvent.objects.filter(
        action="version.delete", target_uuid=item.id
    ).exists()


def test_api_item_versions_delete_forbidden_for_reader():
    owner = factories.UserFactory()
    reader = factories.UserFactory()
    item = _file(owner, (reader, models.RoleChoices.READER))
    response = _client(reader).delete(f"/api/v1.0/items/{item.id!s}/versions/v1/")
    assert response.status_code == 403
