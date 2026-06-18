"""Prometheus metrics endpoint (H1.9 / observability).

Exposes key application metrics in the Prometheus text exposition format,
protected by a bearer token. Rendered by hand to avoid an extra dependency;
Prometheus scrapes this endpoint and Grafana/Alertmanager build on it
(see `monitoring/`).
"""

import logging

from django.conf import settings
from django.http import HttpResponse

import redis
from rest_framework import exceptions, permissions
from rest_framework.views import APIView

from core import models

logger = logging.getLogger(__name__)

CONTENT_TYPE = "text/plain; version=0.0.4; charset=utf-8"


def _gauge(lines, name, help_text, value, labels=""):
    """Append a single-series gauge metric to the exposition lines."""
    lines.append(f"# HELP {name} {help_text}")
    lines.append(f"# TYPE {name} gauge")
    lines.append(f"{name}{labels} {value}")


def _celery_queue_length():
    """Return the number of pending tasks in the default Celery queue, or None."""
    try:
        client = redis.from_url(settings.CELERY_BROKER_URL)
        return client.llen("celery")
    except (redis.RedisError, OSError):
        logger.warning("Could not read the Celery queue length for metrics")
        return None


class PrometheusMetricsView(APIView):
    """Expose application metrics for Prometheus, behind a bearer token."""

    # No DRF auth: the bearer token is checked manually below, so the default
    # authenticators do not try (and fail) to validate it as a session/OIDC token.
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        """Render the metrics, after checking the bearer token."""
        token = settings.OBSERVABILITY_METRICS_TOKEN
        if not token:
            # Endpoint disabled when no token is configured.
            raise exceptions.NotFound()
        if request.headers.get("Authorization") != f"Bearer {token}":
            raise exceptions.AuthenticationFailed()

        lines = []
        _gauge(
            lines,
            "drive_items_total",
            "Total active items",
            models.Item.objects.filter(hard_deleted_at__isnull=True).count(),
        )
        _gauge(
            lines,
            "drive_users_total",
            "Total active users",
            models.User.objects.filter(is_active=True).count(),
        )
        _gauge(
            lines,
            "drive_audit_events_total",
            "Total recorded audit events",
            models.AuditEvent.objects.count(),
        )
        _gauge(
            lines,
            "drive_legal_holds_active_total",
            "Active legal holds",
            models.LegalHold.objects.filter(is_active=True).count(),
        )
        _gauge(
            lines,
            "drive_data_rooms_total",
            "Total data rooms",
            models.DataRoom.objects.count(),
        )

        queue_length = _celery_queue_length()
        if queue_length is not None:
            _gauge(
                lines,
                "drive_celery_queue_length",
                "Pending tasks in the default Celery queue",
                queue_length,
                '{queue="celery"}',
            )

        return HttpResponse("\n".join(lines) + "\n", content_type=CONTENT_TYPE)
