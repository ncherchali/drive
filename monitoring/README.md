# Observability (H1.9)

The backend exposes Prometheus metrics at `GET /api/{API_VERSION}/metrics/`,
protected by a bearer token (`OBSERVABILITY_METRICS_TOKEN`; empty disables the
endpoint with a 404).

Exposed gauges: `drive_items_total`, `drive_users_total`,
`drive_audit_events_total`, `drive_legal_holds_active_total`,
`drive_data_rooms_total`, `drive_celery_queue_length{queue="celery"}`.

## Prometheus scrape

```yaml
scrape_configs:
  - job_name: drive
    metrics_path: /api/v1.0/metrics/
    authorization:
      type: Bearer
      credentials: "${OBSERVABILITY_METRICS_TOKEN}"
    static_configs:
      - targets: ["drive-backend:8000"]
```

## Files

- `prometheus-alerts.yml` — alerting rules (load via Prometheus `rule_files`,
  notify through Alertmanager). Reuses the existing Sentry/Dockerflow stack.
- `grafana-dashboard.json` — import into Grafana (Dashboards → Import).

Request latency/error histograms (per-endpoint) require `django-prometheus`,
deferred to avoid adding a dependency here; the gauges above cover the H1
pilot's saturation/health needs.
