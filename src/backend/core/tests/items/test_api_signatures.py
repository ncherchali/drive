"""Tests for e-signatures (H1.8 / Sahla Sign)."""

from unittest import mock

import pytest
from rest_framework.test import APIClient

from core import factories, models
from core.signature import get_signature_provider

pytestmark = pytest.mark.django_db

S3_CLIENT = "core.services.versions._client"


def _client(user):
    client = APIClient()
    client.force_login(user)
    return client


def _file(owner, *extra_users):
    return factories.ItemFactory(
        type=models.ItemTypeChoices.FILE,
        users=[(owner, models.RoleChoices.OWNER), *extra_users],
    )


# --- provider port ---------------------------------------------------------


def test_mock_signature_provider_returns_external_id():
    external_id = get_signature_provider().create_request(
        document_key="k", signer_email="a@b.co", reference="r"
    )
    assert external_id.startswith("mock-")


# --- request ---------------------------------------------------------------


def test_api_signature_request_on_file_records_audit():
    owner = factories.UserFactory()
    item = _file(owner)
    response = _client(owner).post(
        f"/api/v1.0/items/{item.id!s}/signatures/",
        {"signer_email": "signer@example.com"},
        format="json",
    )
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "pending"
    assert body["external_id"].startswith("mock-")
    assert models.AuditEvent.objects.filter(
        action="signature.request", target_uuid=item.id
    ).exists()


def test_api_signature_on_folder_is_rejected():
    owner = factories.UserFactory()
    folder = factories.ItemFactory(
        type=models.ItemTypeChoices.FOLDER,
        users=[(owner, models.RoleChoices.OWNER)],
    )
    response = _client(owner).post(
        f"/api/v1.0/items/{folder.id!s}/signatures/",
        {"signer_email": "x@y.co"},
        format="json",
    )
    assert response.status_code == 400


def test_api_signature_forbidden_for_reader():
    owner = factories.UserFactory()
    reader = factories.UserFactory()
    item = _file(owner, (reader, models.RoleChoices.READER))
    response = _client(reader).post(
        f"/api/v1.0/items/{item.id!s}/signatures/",
        {"signer_email": "x@y.co"},
        format="json",
    )
    assert response.status_code == 403


# --- complete (sign) -------------------------------------------------------


def test_api_signature_complete_signs_and_snapshots_a_version():
    owner = factories.UserFactory()
    item = _file(owner)
    signature = factories.SignatureRequestFactory(item=item)
    s3 = mock.MagicMock()

    with mock.patch(S3_CLIENT, return_value=s3):
        response = _client(owner).post(
            f"/api/v1.0/items/{item.id!s}/signatures/{signature.id!s}/complete/"
        )

    assert response.status_code == 200
    assert response.json()["status"] == "signed"
    signature.refresh_from_db()
    assert signature.status == models.SignatureStatusChoices.SIGNED
    assert signature.signed_at is not None
    assert s3.copy_object.called  # signed document stored as a new version
    assert models.AuditEvent.objects.filter(action="signature.signed").exists()


def test_api_signature_complete_already_signed_is_rejected():
    owner = factories.UserFactory()
    item = _file(owner)
    signature = factories.SignatureRequestFactory(
        item=item, status=models.SignatureStatusChoices.SIGNED
    )
    response = _client(owner).post(
        f"/api/v1.0/items/{item.id!s}/signatures/{signature.id!s}/complete/"
    )
    assert response.status_code == 400


# --- cancel ----------------------------------------------------------------


def test_api_signature_cancel():
    owner = factories.UserFactory()
    item = _file(owner)
    signature = factories.SignatureRequestFactory(item=item)

    response = _client(owner).delete(
        f"/api/v1.0/items/{item.id!s}/signatures/{signature.id!s}/"
    )

    assert response.status_code == 204
    signature.refresh_from_db()
    assert signature.status == models.SignatureStatusChoices.CANCELLED
    assert models.AuditEvent.objects.filter(action="signature.cancel").exists()
