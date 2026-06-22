"""API tests for sealed item secrets (E4.1 — KMS wiring)."""

from django.test.utils import override_settings

import pytest
from rest_framework.test import APIClient

from core import factories, models
from core.services import encryption

pytestmark = pytest.mark.django_db

SECRETS_URL = "/api/v1.0/items/{id}/secrets/"
REVEAL_URL = "/api/v1.0/items/{id}/secrets/{sid}/reveal/"
DETAIL_URL = "/api/v1.0/items/{id}/secrets/{sid}/"
R = models.RoleChoices


def _client(user):
    client = APIClient()
    client.force_login(user)
    return client


def _key(key_ref="default"):
    return factories.EncryptionKeyFactory(key_ref=key_ref)


@override_settings(KMS_MASTER_KEY="test-master")
def test_set_secret_seals_value_not_stored_in_clear():
    encryption.get_kms_provider.cache_clear()
    _key()
    owner = factories.UserFactory()
    item = factories.ItemFactory(users=[(owner, R.OWNER)])

    response = _client(owner).post(
        SECRETS_URL.format(id=item.id),
        {"name": "smtp-password", "value": "hunter2"},
        format="json",
    )

    assert response.status_code == 201
    assert "value" not in response.json()  # never echoes the plaintext
    secret = models.ItemSecret.objects.get(item=item, name="smtp-password")
    assert secret.sealed_value != "hunter2"  # sealed at rest


@override_settings(KMS_MASTER_KEY="test-master")
def test_reveal_secret_roundtrip_and_audits():
    encryption.get_kms_provider.cache_clear()
    _key()
    owner = factories.UserFactory()
    item = factories.ItemFactory(users=[(owner, R.OWNER)])
    _client(owner).post(
        SECRETS_URL.format(id=item.id),
        {"name": "token", "value": "s3cr3t"},
        format="json",
    )
    secret = models.ItemSecret.objects.get(item=item, name="token")

    response = _client(owner).post(REVEAL_URL.format(id=item.id, sid=secret.id))

    assert response.status_code == 200
    assert response.json()["value"] == "s3cr3t"
    assert models.AuditEvent.objects.filter(
        action="item.secret_reveal", target_uuid=item.id
    ).exists()


@override_settings(KMS_MASTER_KEY="test-master")
def test_list_secrets_returns_names_not_values():
    encryption.get_kms_provider.cache_clear()
    _key()
    owner = factories.UserFactory()
    item = factories.ItemFactory(users=[(owner, R.OWNER)])
    _client(owner).post(
        SECRETS_URL.format(id=item.id),
        {"name": "token", "value": "s3cr3t"},
        format="json",
    )

    response = _client(owner).get(SECRETS_URL.format(id=item.id))

    assert response.status_code == 200
    body = response.json()
    assert body[0]["name"] == "token"
    assert "value" not in body[0]
    assert "sealed_value" not in body[0]


@override_settings(KMS_MASTER_KEY="test-master")
def test_reveal_fails_closed_after_crypto_shred():
    encryption.get_kms_provider.cache_clear()
    key = _key()
    owner = factories.UserFactory()
    item = factories.ItemFactory(users=[(owner, R.OWNER)])
    _client(owner).post(
        SECRETS_URL.format(id=item.id),
        {"name": "token", "value": "s3cr3t"},
        format="json",
    )
    secret = models.ItemSecret.objects.get(item=item, name="token")

    encryption.crypto_shred(key)

    response = _client(owner).post(REVEAL_URL.format(id=item.id, sid=secret.id))
    assert response.status_code == 400  # fail-closed: key shredded


@override_settings(KMS_MASTER_KEY="test-master")
def test_set_secret_without_active_key_returns_400():
    encryption.get_kms_provider.cache_clear()
    owner = factories.UserFactory()  # no EncryptionKey created
    item = factories.ItemFactory(users=[(owner, R.OWNER)])

    response = _client(owner).post(
        SECRETS_URL.format(id=item.id),
        {"name": "x", "value": "y"},
        format="json",
    )
    assert response.status_code == 400


@override_settings(KMS_MASTER_KEY="test-master")
def test_set_secret_forbidden_for_reader():
    encryption.get_kms_provider.cache_clear()
    _key()
    owner = factories.UserFactory()
    reader = factories.UserFactory()
    item = factories.ItemFactory(
        users=[(owner, R.OWNER), (reader, R.READER)],
    )

    response = _client(reader).post(
        SECRETS_URL.format(id=item.id),
        {"name": "x", "value": "y"},
        format="json",
    )
    assert response.status_code == 403


@override_settings(KMS_MASTER_KEY="test-master")
def test_delete_secret():
    encryption.get_kms_provider.cache_clear()
    _key()
    owner = factories.UserFactory()
    item = factories.ItemFactory(users=[(owner, R.OWNER)])
    _client(owner).post(
        SECRETS_URL.format(id=item.id),
        {"name": "token", "value": "s3cr3t"},
        format="json",
    )
    secret = models.ItemSecret.objects.get(item=item, name="token")

    response = _client(owner).delete(DETAIL_URL.format(id=item.id, sid=secret.id))

    assert response.status_code == 204
    assert not models.ItemSecret.objects.filter(pk=secret.id).exists()
