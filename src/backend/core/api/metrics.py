"""Application metrics (H1.9 / observability).

Two consumers of the same values (`collect_metrics`):
- `PrometheusMetricsView` — Prometheus text format, bearer-token protected, for
  scraping (Grafana/Alertmanager build on it, see `monitoring/`).
- `MetricsSummaryView` — JSON, staff-only, for the in-app supervision page.

Rendered by hand to avoid an extra dependency.
"""

import logging

from django.conf import settings
from django.http import HttpResponse

import redis
from rest_framework import exceptions, permissions, response
from rest_framework.views import APIView

from core import models

logger = logging.getLogger(__name__)

CONTENT_TYPE = "text/plain; version=0.0.4; charset=utf-8"

# (summary key, Prometheus metric name, help text, Prometheus label suffix)
METRIC_DEFS = [
    ("items_total", "drive_items_total", "Total active items", ""),
    ("users_total", "drive_users_total", "Total active users", ""),
    ("audit_events_total", "drive_audit_events_total", "Total recorded audit events", ""),
    (
        "legal_holds_active_total",
        "drive_legal_holds_active_total",
        "Active legal holds",
        "",
    ),
    ("data_rooms_total", "drive_data_rooms_total", "Total data rooms", ""),
    (
        "celery_queue_length",
        "drive_celery_queue_length",
        "Pending tasks in the default Celery queue",
        '{queue="celery"}',
    ),
]


def _celery_queue_length():
    """Return the number of pending tasks in the default Celery queue, or None."""
    try:
        client = redis.from_url(settings.CELERY_BROKER_URL)
        return client.llen("celery")
    except (redis.RedisError, OSError):
        logger.warning("Could not read the Celery queue length for metrics")
        return None


def collect_metrics():
    """Return the current metric values keyed by summary name."""
    metrics = {
        "items_total": models.Item.objects.filter(hard_deleted_at__isnull=True).count(),
        "users_total": models.User.objects.filter(is_active=True).count(),
        "audit_events_total": models.AuditEvent.objects.count(),
        "legal_holds_active_total": models.LegalHold.objects.filter(
            is_active=True
        ).count(),
        "data_rooms_total": models.DataRoom.objects.count(),
    }
    queue_length = _celery_queue_length()
    if queue_length is not None:
        metrics["celery_queue_length"] = queue_length
    return metrics


class PrometheusMetricsView(APIView):
    """Expose application metrics for Prometheus, behind a bearer token."""

    # No DRF auth: the bearer token is checked manually below, so the default
    # authenticators do not try (and fail) to validate it as a session/OIDC token.
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        """Render the metrics in Prometheus text format, after the token check."""
        token = settings.OBSERVABILITY_METRICS_TOKEN
        if not token:
            raise exceptions.NotFound()
        if request.headers.get("Authorization") != f"Bearer {token}":
            raise exceptions.AuthenticationFailed()

        metrics = collect_metrics()
        lines = []
        for key, name, help_text, labels in METRIC_DEFS:
            if key not in metrics:
                continue
            lines.append(f"# HELP {name} {help_text}")
            lines.append(f"# TYPE {name} gauge")
            lines.append(f"{name}{labels} {metrics[key]}")

        return HttpResponse("\n".join(lines) + "\n", content_type=CONTENT_TYPE)


class MetricsSummaryView(APIView):
    """Return the metric values as JSON for the in-app supervision page (staff)."""

    permission_classes = [permissions.IsAdminUser]

    def get(self, request, *args, **kwargs):
        """Return the current metrics as a JSON object."""
        return response.Response(collect_metrics())
