# 08 — Supervision / monitoring

## Santé (health checks) — Dockerflow
Middleware **Dockerflow** exposant :
- `/__heartbeat__` — vérifie la base et les dépendances (sonde *readiness*).
- `/__lbheartbeat__` — *liveness* (load balancer).
- `/__version__` — version déployée.

→ à brancher sur les sondes Kubernetes (`readinessProbe` / `livenessProbe`).

## Erreurs — Sentry
SDK **Sentry** côté backend, activé via `SENTRY_DSN`. Capture automatique des
exceptions Python ; instrumentation manuelle pour les cas custom (requêtes externes,
erreurs Celery) via `capture_exception()`.

## Analytics produit — PostHog
**PostHog** (`POSTHOG_KEY` / `POSTHOG_HOST`, proxifié via ingress dédié). Événements
produit côté frontend (ex. `file_preview_opened`).

## Métriques d'usage — API
Route `GET /external_api/v1.0/metrics/usage/` (en-tête `Authorization: Api-Key <key>`,
paramètre `account_type=user|organization`). Expose `storage_used`. À activer via
`METRICS_ENABLED`. Clé créée dans l'admin Django (*Api keys*). Cf. [`../metrics.md`](../metrics.md).

## Logs
Logs applicatifs par niveau (DEBUG/INFO/WARN/ERROR) ; exceptions remontées à Sentry.

## Écarts (à compléter)
- Pas d'export **Prometheus** natif des métriques techniques (latence, débit, taux
  d'erreur, profondeur des files Celery).
- Pas de **dashboards** (Grafana) ni d'**alerting** fournis.
→ priorisé dans la [feuille de route](./11-roadmap.md).
