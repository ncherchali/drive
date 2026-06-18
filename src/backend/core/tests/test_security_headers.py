"""Tests for the security hardening response headers (H1.5)."""

from django.test import override_settings

import pytest
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db

URL = "/api/v1.0/config/"


def test_native_security_headers_present():
    """Headers handled by Django's SecurityMiddleware are set."""
    response = APIClient().get(URL)
    assert response["X-Content-Type-Options"] == "nosniff"
    assert response["Referrer-Policy"] == "same-origin"
    assert response["Cross-Origin-Opener-Policy"] == "same-origin"


def test_permissions_policy_header_present():
    """The custom middleware adds a restrictive Permissions-Policy."""
    response = APIClient().get(URL)
    assert "Permissions-Policy" in response
    assert "camera=()" in response["Permissions-Policy"]


def test_csp_disabled_by_default():
    """CSP is opt-in: no header unless configured."""
    response = APIClient().get(URL)
    assert "Content-Security-Policy" not in response


@override_settings(SECURITY_CONTENT_SECURITY_POLICY="default-src 'self'")
def test_csp_set_when_configured():
    """A configured CSP is emitted."""
    response = APIClient().get(URL)
    assert response["Content-Security-Policy"] == "default-src 'self'"
