# 05 — Installation

## Développement local (Docker)

```bash
make bootstrap     # build, migrate, i18n, mails, run  (Docker requis)
make run           # démarrer la pile
make superuser     # créer un admin Django
```

- App : http://localhost:3000 (login Keycloak `drive` / `drive`)
- Admin Django : http://localhost:8071/admin (`admin@example.com` / `admin`)
- Swagger : `/api/v1.0/swagger/` (si `DEBUG` ou `USE_SWAGGER`)

Frontend en natif (meilleur HMR) :
```bash
make frontend-development-install
make run-backend
make run-frontend-development
```

> **Windows** : `make` (Unix) nécessite Git Bash ; sinon piloter `docker compose`
> directement. Voir les adaptations de ports/volume/CRLF dans
> [04-infrastructure](./04-infrastructure.md).

## Production (Kubernetes)

Cf. [`../installation/kubernetes.md`](../installation/kubernetes.md). Principe :

1. **Provisionner** les dépendances : PostgreSQL, Redis, bucket S3, realm Keycloak,
   serveurs WOPI (Collabora/OnlyOffice).
2. **Configurer** `values.yaml` : tag d'image, ingress/hosts/TLS, secrets, variables
   d'environnement (cf. [`../env.md`](../env.md)).
3. **Déployer** : `helmfile apply` (ou `helm upgrade --install`) → les Jobs
   `migrate` / `configure-wopi` s'exécutent automatiquement.
