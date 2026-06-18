"""Tests for data rooms (H1.7 / Sahla Rooms)."""

import pytest
from rest_framework.test import APIClient

from core import factories, models

pytestmark = pytest.mark.django_db

MEDIA_AUTH_URL = "/api/v1.0/items/media-auth/"


def _client(user):
    client = APIClient()
    client.force_login(user)
    return client


def _room_with_child(owner, *extra_users, allow_download=False):
    folder = factories.ItemFactory(
        type=models.ItemTypeChoices.FOLDER,
        users=[(owner, models.RoleChoices.OWNER), *extra_users],
    )
    factories.DataRoomFactory(item=folder, allow_download=allow_download)
    child = factories.ItemFactory(
        parent=folder,
        type=models.ItemTypeChoices.FILE,
        filename="doc.pdf",
        update_upload_state=models.ItemUploadStateChoices.READY,
    )
    return folder, child


# --- room settings API -----------------------------------------------------


def test_api_data_room_create_on_folder_records_audit():
    owner = factories.UserFactory()
    folder = factories.ItemFactory(
        type=models.ItemTypeChoices.FOLDER,
        users=[(owner, models.RoleChoices.OWNER)],
    )
    response = _client(owner).post(
        f"/api/v1.0/items/{folder.id!s}/data-room/",
        {"allow_download": False},
        format="json",
    )
    assert response.status_code == 201
    assert models.DataRoom.objects.filter(item=folder).exists()
    assert models.AuditEvent.objects.filter(
        action="room.create", target_uuid=folder.id
    ).exists()


def test_api_data_room_create_on_file_is_rejected():
    owner = factories.UserFactory()
    file_item = factories.ItemFactory(
        type=models.ItemTypeChoices.FILE,
        users=[(owner, models.RoleChoices.OWNER)],
    )
    response = _client(owner).post(
        f"/api/v1.0/items/{file_item.id!s}/data-room/", {}, format="json"
    )
    assert response.status_code == 400


def test_api_data_room_forbidden_for_reader():
    owner = factories.UserFactory()
    reader = factories.UserFactory()
    folder = factories.ItemFactory(
        type=models.ItemTypeChoices.FOLDER,
        users=[(owner, models.RoleChoices.OWNER), (reader, models.RoleChoices.READER)],
    )
    response = _client(reader).post(
        f"/api/v1.0/items/{folder.id!s}/data-room/", {}, format="json"
    )
    assert response.status_code == 403


def test_api_data_room_get_and_delete():
    owner = factories.UserFactory()
    folder = factories.ItemFactory(
        type=models.ItemTypeChoices.FOLDER,
        users=[(owner, models.RoleChoices.OWNER)],
    )
    factories.DataRoomFactory(item=folder, allow_download=False)
    client = _client(owner)

    read = client.get(f"/api/v1.0/items/{folder.id!s}/data-room/")
    assert read.status_code == 200
    assert read.json()["allow_download"] is False

    deleted = client.delete(f"/api/v1.0/items/{folder.id!s}/data-room/")
    assert deleted.status_code == 204
    assert not models.DataRoom.objects.filter(item=folder).exists()
    assert models.AuditEvent.objects.filter(action="room.delete").exists()


# --- no-download enforcement at media-auth ---------------------------------


def test_media_auth_blocks_download_for_guest_in_view_only_room():
    owner = factories.UserFactory()
    reader = factories.UserFactory()
    _, child = _room_with_child(owner, (reader, models.RoleChoices.READER))

    url = f"http://localhost/media/{child.file_key:s}"
    response = _client(reader).get(MEDIA_AUTH_URL, HTTP_X_ORIGINAL_URL=url)
    assert response.status_code == 403


def test_media_auth_allows_download_for_manager_in_view_only_room():
    owner = factories.UserFactory()
    _, child = _room_with_child(owner)

    url = f"http://localhost/media/{child.file_key:s}"
    response = _client(owner).get(MEDIA_AUTH_URL, HTTP_X_ORIGINAL_URL=url)
    assert response.status_code == 200


def test_media_auth_allows_download_when_room_allows_it():
    owner = factories.UserFactory()
    reader = factories.UserFactory()
    _, child = _room_with_child(
        owner, (reader, models.RoleChoices.READER), allow_download=True
    )

    url = f"http://localhost/media/{child.file_key:s}"
    response = _client(reader).get(MEDIA_AUTH_URL, HTTP_X_ORIGINAL_URL=url)
    assert response.status_code == 200


def test_media_auth_allows_download_outside_any_room():
    owner = factories.UserFactory()
    reader = factories.UserFactory()
    item = factories.ItemFactory(
        type=models.ItemTypeChoices.FILE,
        users=[(owner, models.RoleChoices.OWNER), (reader, models.RoleChoices.READER)],
        update_upload_state=models.ItemUploadStateChoices.READY,
    )

    url = f"http://localhost/media/{item.file_key:s}"
    response = _client(reader).get(MEDIA_AUTH_URL, HTTP_X_ORIGINAL_URL=url)
    assert response.status_code == 200
