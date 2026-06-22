"""Tests for the Vault transit KMS adapter + circuit breaker (E4.1)."""

import base64
from unittest import mock

from django.test.utils import override_settings

import pytest
import requests

from core.kms.base import KMSError
from core.kms.circuit_breaker import CircuitBreaker, CircuitOpenError
from core.kms.vault_provider import VaultTransitKMSProvider

pytestmark = pytest.mark.django_db


# --- Circuit breaker ---------------------------------------------------------


def test_breaker_opens_after_threshold_and_fast_fails():
    breaker = CircuitBreaker(failure_threshold=2, reset_timeout=999)

    def boom():
        raise RuntimeError("down")

    for _ in range(2):
        with pytest.raises(RuntimeError):
            breaker.call(boom)
    # Now open → fast-fail without calling the function.
    with pytest.raises(CircuitOpenError):
        breaker.call(boom)


def test_breaker_resets_on_success():
    breaker = CircuitBreaker(failure_threshold=3)
    with pytest.raises(RuntimeError):
        breaker.call(lambda: (_ for _ in ()).throw(RuntimeError()))
    assert breaker.call(lambda: "ok") == "ok"
    assert breaker._failures == 0  # pylint: disable=protected-access


# --- Vault provider (HTTP mocked) --------------------------------------------


def _provider():
    return VaultTransitKMSProvider(address="http://vault:8200", token="t")


def _response(payload, status=200):
    resp = mock.Mock()
    resp.json.return_value = payload
    resp.raise_for_status.side_effect = (
        None
        if status < 400
        else requests.HTTPError(f"{status}")
    )
    return resp


def test_vault_requires_address_and_token():
    with override_settings(KMS_VAULT_ADDR="", KMS_VAULT_TOKEN=""):
        with pytest.raises(KMSError):
            VaultTransitKMSProvider()


def test_vault_encrypt_calls_transit_and_returns_ciphertext():
    provider = _provider()
    with mock.patch(
        "core.kms.vault_provider.requests.post",
        return_value=_response({"data": {"ciphertext": "vault:v1:abc"}}),
    ) as posted:
        assert provider.encrypt("k1", "secret") == "vault:v1:abc"
    url = posted.call_args.args[0]
    body = posted.call_args.kwargs["json"]
    assert url == "http://vault:8200/v1/transit/encrypt/k1"
    assert base64.b64decode(body["plaintext"]).decode() == "secret"


def test_vault_decrypt_returns_plaintext():
    provider = _provider()
    b64 = base64.b64encode(b"secret").decode()
    with mock.patch(
        "core.kms.vault_provider.requests.post",
        return_value=_response({"data": {"plaintext": b64}}),
    ):
        assert provider.decrypt("k1", "vault:v1:abc") == "secret"


def test_vault_http_error_is_fail_closed():
    provider = _provider()
    with mock.patch(
        "core.kms.vault_provider.requests.post",
        side_effect=requests.ConnectionError("vault down"),
    ):
        with pytest.raises(KMSError):
            provider.encrypt("k1", "secret")


def test_vault_breaker_opens_after_repeated_failures():
    with override_settings(KMS_BREAKER_FAILURE_THRESHOLD=2):
        provider = _provider()
        with mock.patch(
            "core.kms.vault_provider.requests.post",
            side_effect=requests.ConnectionError("down"),
        ) as posted:
            for _ in range(2):
                with pytest.raises(KMSError):
                    provider.encrypt("k1", "x")
            # Breaker now open → next call fails WITHOUT hitting requests.
            posted.reset_mock()
            with pytest.raises(KMSError):
                provider.encrypt("k1", "x")
            posted.assert_not_called()
