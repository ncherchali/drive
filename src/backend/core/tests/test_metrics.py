"""Tests for the Prometheus metrics endpoint (H1.9)."""

from django.test import override_settings

import pytest
from rest_framework.test import APIClient

from core import factories

pytestmark = pytest.mark.django_db

URL = "/api/v1.0/metrics/"


def test_metrics_disabled_without_token():
    """Without a configured token the endpoint is hidden (404)."""
    assert APIClient().get(URL).status_code == 404


@override_settings(OBSERVABILITY_METRICS_TOKEN="secret")
def test_metrics_requires_bearer_token():
    """A correct bearer token is required (denied otherwise)."""
    assert APIClient().get(URL).status_code == 403
    assert (
        APIClient().get(URL, HTTP_AUTHORIZATION="Bearer wrong").status_code == 403
    )


@override_settings(OBSERVABILITY_METRICS_TOKEN="secret")
def test_metrics_returns_prometheus_text():
    """With the token, gauges are rendered in the Prometheus text format."""
    factories.ItemFactory()
    response = APIClient().get(URL, HTTP_AUTHORIZATION="Bearer secret")

    assert response.status_code == 200
    assert response["Content-Type"].startswith("text/plain")
    body = response.content.decode()
    assert "# TYPE drive_items_total gauge" in body
    assert "drive_items_total " in body
    assert "drive_audit_events_total " in body
    assert "drive_legal_holds_active_total " in body


SUMMARY_URL = "/api/v1.0/metrics/summary/"


def test_metrics_summary_forbidden_for_non_staff():
    """The JSON summary is staff-only."""
    user = factories.UserFactory()
    client = APIClient()
    client.force_login(user)
    assert client.get(SUMMARY_URL).status_code == 403


def test_metrics_summary_for_staff_returns_json():
    """A staff member gets the metrics as JSON."""
    staff = factories.UserFactory(is_staff=True)
    factories.ItemFactory()
    client = APIClient()
    client.force_login(staff)

    response = client.get(SUMMARY_URL)
    assert response.status_code == 200
    body = response.json()
    assert "items_total" in body
    assert "audit_events_total" in body
    assert "data_rooms_total" in body
