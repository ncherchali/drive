# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**La Suite Drive** (`suitenumerique/drive`) — a collaborative file-storage / sharing application from the French DINUM "La Suite" stack. Self-hostable, OIDC-authenticated, with S3-compatible object storage and an embeddable file-picker SDK.

Within the larger Tara+ monorepo this lives at `FILE&SYNC/drive` and is integrated mainly through that picker SDK and as a generic Drive backend; the code itself is upstream open-source (MIT) and follows La Suite conventions, **not** the Tara+/Go conventions described in the root `D:\DEV\CLAUDE.md`.

- **Backend:** Django 5.2 + Django REST Framework, Python 3.13, `django-configurations`, Celery + Redis, PostgreSQL, S3 (boto3 / django-storages), OIDC via `django-lasuite`. Lives in `src/backend`.
- **Frontend:** Next.js 15 (Pages Router) + React 19, TanStack Query/Table, i18next, Cunningham design system. Yarn 1 workspaces in `src/frontend`.

## Working with this codebase (Docker-first)

Everything runs through Docker Compose; the `Makefile` is **development-only** (it injects your host UID/GID). Do not use it for CI/prod. Run `make help` to list all targets.

```bash
make bootstrap      # one-time (and after each pull): build images, migrate, compile i18n, build mails, run
make run            # start backend + frontend-dev containers
make run-backend    # backend stack only (celery, nginx, wopi config) — use when running frontend locally
make stop / make down / make logs / make status
make superuser      # create admin@example.com / admin
```

App: <http://localhost:3000> (default login `drive` / `drive`). Django admin: <http://localhost:8071/admin>. Swagger served at `/api/{API_VERSION}/swagger/` when `DEBUG`/`USE_SWAGGER`.

**Frontend developers** usually run the frontend natively instead of in the container (faster HMR):
```bash
make frontend-development-install     # yarn install in src/frontend/apps/drive
make run-backend                      # backend in Docker
make run-frontend-development         # next dev natively (stops the frontend-dev container first)
```

## Common commands

**Backend (run inside the `app-dev` container via Make wrappers):**
```bash
make test                 # full suite, parallel (bin/pytest -n auto, DJANGO_CONFIGURATION=Test)
make test-back            # pytest, not parallel — pass args: make test-back core/tests/test_x.py::test_name
make lint                 # ruff format + ruff check --fix + pylint (pylint runs only on diff vs origin/main)
make makemigrations / make migrate
make shell                # Django shell        make dbshell   # psql
make backend-exec-command <args>   # arbitrary manage.py command in the running container
```
Single test: `make test-back path/to/test_file.py::TestClass::test_method`. The `bin/pytest` and `bin/pylint` scripts wrap `docker compose run`; running `pytest` outside the container won't have the DB/settings.

**Frontend (Yarn 1 workspaces, root = `src/frontend`):**
```bash
make frontend-lint                                   # yarn lint across the workspace
cd src/frontend/apps/drive && yarn test              # jest; yarn test:watch for watch mode
cd src/frontend/apps/drive && yarn build-theme       # regenerate Cunningham design tokens into src/styles
```

**End-to-end (Playwright, isolated backend with a throwaway DB):**
```bash
make bootstrap-e2e                                   # build + run backend wired for e2e
make run-tests-e2e -- --project chromium --headed    # spins up e2e backend, runs src/frontend/apps/e2e
make clear-db-e2e                                     # reset e2e DB between runs
```

**i18n:** sources go to Crowdin. `make i18n-generate` extracts; `make i18n-download-and-compile` pulls translations and compiles both back (`compilemessages`) and front. Mail templates are MJML — edit under `src/mail` and rebuild with `make mails-build`.

## Architecture

```
User → Next.js SPA (src/frontend) → REST API → Django (src/backend)
                                        │  OIDC → Keycloak / ProConnect
                                        ├─ PostgreSQL
                                        ├─ Celery (Redis broker) → async tasks
                                        └─ S3-compatible object storage (MinIO in dev)
```

### Backend (`src/backend`)
- **`core/`** is the heart. The central model is **`Item`** (`core/models.py`), a single self-referential tree representing both folders and files, stored as a **materialized path using `django-ltree`** (`TreeModel`). One table holds the whole hierarchy; navigation/queries use the `path` ltree column. `ItemTypeChoices` distinguishes FOLDER vs FILE; `ItemUploadStateChoices` tracks the upload/analysis lifecycle (pending → analyzing → suspicious/ready, etc.).
- **RBAC / sharing** comes from `django-lasuite` (`lasuite.drf.models.choices`): `RoleChoices`, `LinkReachChoices`, `LinkRoleChoices` drive per-item accesses (`ItemAccess`), invitations, and public/authenticated link sharing. Permission logic lives in `core/api/permissions.py`.
- **API layer** (`core/api/`): DRF `viewsets.py` registered in `core/urls.py` via routers. Key resources: `items`, `users`, item-nested `accesses` and `invitations`, `sdk-relay/events`, and `entitlements`. A separate **`core/external_api/`** exposes API-key-authenticated endpoints (`djangorestframework-api-key`).
- **Storage** (`core/storage/`): pluggable compute backends decide where/how an item's bytes live (`storage_compute_backend.py`, `creator_storage_compute_backend.py`). See `docs/s3_mirroring.md`.
- **Async tasks** (`core/tasks/`): `item.py` (e.g. trashbin cleanup — soft delete with `TRASHBIN_CUTOFF_DAYS` retention) and `search.py` (external search indexing, `core/services/search_indexers.py`). **Malware scanning** is in `core/malware_detection.py` and gates the upload state machine.
- **Entitlements** (`core/entitlements/`): pluggable backends + `factory.py` decide feature/quota entitlements per user; surfaced via the `entitlements` API and frontend `entitlement-disclaimers`.
- **WOPI** (`wopi/` app): integration for collaborative document editing (Office/Collabora-style); configured at startup via `make configure-wopi` → `trigger_wopi_configuration`.
- **Auth** (`core/authentication/`): OIDC login + OIDC resource-server flows from `django-lasuite`, plus custom backends. Users mirror the OIDC `sub`.

### Settings — `django-configurations` (not plain Django settings)
`src/backend/drive/settings.py` defines class-based configurations selected by the `DJANGO_CONFIGURATION` env var: `Base` → `Development`, `Test`/`ContinuousIntegration`, `Production` → `Feature`/`Staging`/`PreProduction`. Tests force `DJANGO_CONFIGURATION=Test`. When adding a setting, add it to the right class, not the module top-level. Env files live in `env.d/development/`.

### Frontend (`src/frontend`)
- Yarn workspaces: `apps/drive` (the app, Next.js Pages Router under `src/pages`), `apps/e2e` (Playwright), `apps/sdk-consumer` (demo host for the SDK), and `packages/sdk` (the publishable embeddable picker/saver SDK).
- App code is organized by **feature** under `apps/drive/src/features/` (`explorer`, `items`, `auth`, `sdk`, `wopi`, `entitlement-disclaimers`, `drivers`, …). `drivers/` holds the typed API client + domain types; data fetching uses **TanStack Query** hooks (`features/explorer/hooks/useMutations.ts`, etc.).
- **SDK relay:** the embeddable picker (`features/sdk`) communicates selection events back to a host page via the backend `sdk-relay/events` endpoint and `SDKRelayManager` (postMessage-style relay), letting other La Suite apps embed Drive as a file picker/saver.
- **WOPI editing (`features/wopi`):** opening an editable document is handled by `openWopi.ts`, which routes to the `/wopi/[id]` page; that page renders `WopiEditorFrame.tsx`, an iframe hosting the external Office/Collabora-style editor backed by the Django `wopi/` app. This used to live under `features/ui/preview/viewers/wopi/` — it was lifted to a top-level feature, and the in-app file previewers were removed (only `features/ui/preview/CustomFilesPreview.tsx` remains).
- Styling/theme is generated from **Cunningham** tokens (`yarn build-theme`) into `src/styles`; don't hand-edit generated `cunningham-tokens*` files.

## Conventions
- Backend Python: PEP 8 with **100-char** lines; lint = ruff (format + check) then pylint. Follow `.cursor/rules/django-python.mdc` — DRF viewsets + serializers, keep business logic in models/services and views thin, prefer the ORM with `select_related`/`prefetch_related`, log via the standard levels and capture custom failures to Sentry, and **never log tokens/passwords/PII**.
- New significant backend functionality should ship with pytest unit tests (one use-case per test, minimal assertions); factories live in `core/factories.py` (`factory_boy`).
- Conventional, emoji-prefixed commit messages are used (see `git log` and `.gitlint`); `CHANGELOG.md` is kept up to date.

## Further docs
`docs/architecture.md`, `docs/installation/`, `docs/env.md` (env vars), `docs/s3_mirroring.md`, `docs/entitlements.md`, `docs/resource_server.md`, `docs/metrics.md`. Helm charts for k8s deployment are in `src/helm` (local k8s via `make build-k8s-cluster` / `make start-tilt`).
