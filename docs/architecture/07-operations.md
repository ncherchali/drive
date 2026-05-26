# 07 — Exploitation

## Migrations & jobs
- **Migrations** : Job Helm `migrate` (ou `make migrate` / `manage.py migrate`).
  > ⚠️ En local, utiliser `docker compose exec app-dev …` pour **ne pas** redémarrer
  > PostgreSQL (dépendance `depends_on … restart: true`).
- **Jobs ponctuels** : `createsuperuser`, `configure-wopi`.

## Tâches planifiées (Celery)
- `celery worker` (traitement) + `celery beat` (planification).
- CronJobs Helm : purge corbeille (selon `TRASHBIN_CUTOFF_DAYS`), réindexation
  recherche, miroir S3, purge des items « hard-deleted ».

## Configuration & secrets
- Variables d'environnement via classes `django-configurations`
  (`Development`/`Production`/…), sélectionnées par `DJANGO_CONFIGURATION`.
- Secrets via `SecretFileValue` (montés en **fichiers**, pas en clair dans le code).
- Référence : [`../env.md`](../env.md).

## Sauvegardes (à opérer côté infra)
- **PostgreSQL** : dumps réguliers (métadonnées, arbre `ltree`, accès).
- **S3** : réplication / snapshots du bucket (le **versioning** activé aide à la
  récupération de fichiers).
- **Keycloak** : export du realm `drive`.
- Définir **RPO/RTO** selon ces sauvegardes.

## Scalabilité & résilience
- Backend & frontend *stateless* → scale horizontal (HPA possible).
- Celery : scale par nombre de workers / files.
- PostgreSQL, Redis, S3 dimensionnés et redondés hors cluster.
