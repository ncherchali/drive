"""Tests for advanced share links (H1.3)."""

from datetime import timedelta

from django.utils import timezone

import pytest
from rest_framework.test import APIClient

from core import factories, models

pytestmark = pytest.mark.django_db

RESOLVE_URL = "/api/v1.0/share-links/resolve/"


def _client(user):
    client = APIClient()
    client.force_login(user)
    return client


# --- model -----------------------------------------------------------------


def test_share_link_register_download_enforces_cap_atomically():
    """The atomic counter stops exactly at the cap."""
    link = factories.ShareLinkFactory(max_downloads=2)

    assert link.register_download() is True
    assert link.register_download() is True
    assert link.register_download() is False

    link.refresh_from_db()
    assert link.download_count == 2


def test_share_link_token_is_generated():
    """A URL-safe token is generated on save."""
    link = factories.ShareLinkFactory()
    assert link.token
    assert len(link.token) >= 32


# --- management API --------------------------------------------------------


def test_api_share_link_create_as_owner_records_audit():
    """An owner creates a link; the token is returned and the act is audited."""
    user = factories.UserFactory()
    item = factories.ItemFactory(
        type=models.ItemTypeChoices.FOLDER, users=[(user, models.RoleChoices.OWNER)]
    )

    response = _client(user).post(
        f"/api/v1.0/items/{item.id!s}/share-links/",
        {"role": "reader", "max_downloads": 5},
        format="json",
    )

    assert response.status_code == 201
    body = response.json()
    assert body["token"]
    assert body["download_count"] == 0
    assert models.ShareLink.objects.filter(item=item).count() == 1
    assert models.AuditEvent.objects.filter(
        action="share_link.create", target_uuid=item.id
    ).exists()


def test_api_share_link_create_forbidden_for_reader():
    """A reader cannot create a share link."""
    owner = factories.UserFactory()
    reader = factories.UserFactory()
    item = factories.ItemFactory(
        type=models.ItemTypeChoices.FOLDER,
        users=[(owner, models.RoleChoices.OWNER), (reader, models.RoleChoices.READER)],
    )

    response = _client(reader).post(
        f"/api/v1.0/items/{item.id!s}/share-links/", {}, format="json"
    )
    assert response.status_code == 403


def test_api_share_link_list_is_gated_to_managers():
    """Only managers see the links of an item."""
    owner = factories.UserFactory()
    reader = factories.UserFactory()
    item = factories.ItemFactory(
        type=models.ItemTypeChoices.FOLDER,
        users=[(owner, models.RoleChoices.OWNER), (reader, models.RoleChoices.READER)],
    )
    factories.ShareLinkFactory(item=item)

    assert len(_client(owner).get(f"/api/v1.0/items/{item.id!s}/share-links/").json()) == 1
    assert _client(reader).get(f"/api/v1.0/items/{item.id!s}/share-links/").json() == []


def test_api_share_link_delete_as_owner_records_audit():
    """An owner revokes a link; the act is audited."""
    owner = factories.UserFactory()
    item = factories.ItemFactory(
        type=models.ItemTypeChoices.FOLDER, users=[(owner, models.RoleChoices.OWNER)]
    )
    link = factories.ShareLinkFactory(item=item)

    response = _client(owner).delete(
        f"/api/v1.0/items/{item.id!s}/share-links/{link.id!s}/"
    )

    assert response.status_code == 204
    assert not models.ShareLink.objects.filter(pk=link.id).exists()
    assert models.AuditEvent.objects.filter(
        action="share_link.delete", target_uuid=item.id
    ).exists()


# --- public resolution -----------------------------------------------------


def test_api_share_link_resolve_valid_counts_and_returns_item():
    """A valid link resolves to the item, returns a download URL and counts."""
    item = factories.ItemFactory(type=models.ItemTypeChoices.FILE)
    link = factories.ShareLinkFactory(item=item, max_downloads=5)

    response = APIClient().post(RESOLVE_URL, {"token": link.token}, format="json")

    assert response.status_code == 200
    body = response.json()
    assert body["item"]["id"] == str(item.id)
    assert "download_url" in body
    link.refresh_from_db()
    assert link.download_count == 1
    assert models.AuditEvent.objects.filter(action="share_link.download").exists()


def test_api_share_link_resolve_unknown_token_404():
    """An unknown token resolves to 404."""
    response = APIClient().post(RESOLVE_URL, {"token": "nope"}, format="json")
    assert response.status_code == 404


def test_api_share_link_resolve_password_protected():
    """A password-protected link requires the right password."""
    owner = factories.UserFactory()
    item = factories.ItemFactory(
        type=models.ItemTypeChoices.FILE, users=[(owner, models.RoleChoices.OWNER)]
    )
    token = (
        _client(owner)
        .post(
            f"/api/v1.0/items/{item.id!s}/share-links/",
            {"password": "s3cret"},
            format="json",
        )
        .json()["token"]
    )

    wrong = APIClient().post(
        RESOLVE_URL, {"token": token, "password": "nope"}, format="json"
    )
    assert wrong.status_code == 403

    ok = APIClient().post(
        RESOLVE_URL, {"token": token, "password": "s3cret"}, format="json"
    )
    assert ok.status_code == 200


def test_api_share_link_resolve_expired_is_denied():
    """An expired link is denied."""
    link = factories.ShareLinkFactory(
        expires_at=timezone.now() - timedelta(days=1)
    )
    response = APIClient().post(RESOLVE_URL, {"token": link.token}, format="json")
    assert response.status_code == 403


def test_api_share_link_resolve_exhausted_is_denied():
    """A link that reached its download cap is denied."""
    link = factories.ShareLinkFactory(max_downloads=1, download_count=1)
    response = APIClient().post(RESOLVE_URL, {"token": link.token}, format="json")
    assert response.status_code == 403
