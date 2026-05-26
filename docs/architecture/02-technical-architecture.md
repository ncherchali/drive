# 02 — Architecture technique

## Composants

```mermaid
flowchart TD
    subgraph FE["Frontends"]
      Web["Web Next.js / React"]
      SDK["SDK picker embarqué"]
    end
    Web -->|REST /api/v1.0 + Bearer JWT| API
    SDK -->|sdk-relay| API

    subgraph BE["Backend Django REST"]
      API["core : Item ltree, accès, invitations, favoris, entitlements"]
      WOPI["wopi : édition Collabora/OnlyOffice"]
      EXT["external_api : endpoints Api-Key (métriques)"]
      CELERY["Celery : corbeille, indexation, miroir S3, purge"]
    end

    API --> PG[("PostgreSQL")]
    CELERY --> REDIS[("Redis broker")]
    API --> S3[("S3 / MinIO / R2")]
    API -->|OIDC JWKS| KC["Keycloak (realm drive)"]
    WOPI --> OFFICE["Collabora / OnlyOffice"]
    API --> FIND["Find (recherche plein-texte, optionnel)"]
```

## Pile technique

- **Backend** : Python 3.13, Django 5.2 + DRF, `django-configurations`, `django-ltree`,
  `django-lasuite` (OIDC + RBAC), Celery, `boto3`/`django-storages[s3]`, `drf-spectacular`
  (OpenAPI/Swagger), `python-magic`.
- **Frontend** : Next.js 15 (Pages Router), React 19, TanStack Query/Table, react-i18next,
  Cunningham (design system) ; organisation **par feature** (`src/features/*`).
- **Auth** : OIDC (Keycloak realm `drive`), JWT/JWKS, sessions (12 h).
- **Édition** : protocole **WOPI** (`WOPI_*_DISCOVERY_URL`).

## Flux d'authentification (OIDC)

```mermaid
sequenceDiagram
    participant U as Navigateur
    participant F as Frontend (Next.js)
    participant N as nginx
    participant B as Backend Django
    participant K as Keycloak (realm drive)

    U->>F: Accès à l'app
    F->>B: Démarrage login OIDC
    B-->>U: Redirection vers Keycloak (authorization endpoint)
    U->>N: GET /realms/drive/...auth
    N->>K: proxy
    K-->>U: Page de login
    U->>K: Identifiants
    K-->>U: Redirection callback (code)
    U->>B: callback OIDC (code)
    B->>K: Échange code → tokens (token endpoint)
    B->>K: Validation JWT via JWKS
    B-->>U: Session établie (cookie) / accès API par Bearer
```

## Flux média (lecture sécurisée)

Deux voies coexistent : **URL pré-signée S3** (réécrite pour le navigateur via
`AWS_S3_DOMAIN_REPLACE`) et **proxy nginx avec autorisation par item**.

```mermaid
sequenceDiagram
    participant U as Navigateur
    participant N as nginx
    participant B as Backend (media-auth)
    participant S as S3 / MinIO

    U->>N: GET /media/<item>
    N->>B: auth_request → /media-auth (cookie session)
    B-->>N: 200 + en-têtes signés (Authorization, X-Amz-*)
    N->>S: proxy_pass MinIO avec en-têtes signés
    S-->>N: octets du fichier
    N-->>U: fichier (Content-Disposition)
    Note over U,S: Variante : le backend renvoie une URL pré-signée S3<br/>directement consommée par le navigateur (domaine réécrit).
```

## Flux d'édition WOPI

Frontend ouvre `/wopi/[id]` → iframe de l'éditeur (Collabora/OnlyOffice) qui dialogue
avec le backend WOPI (`WOPI_SRC_BASE_URL`) pour lire/écrire le fichier dans S3.

## Asynchrone

Les opérations lourdes (purge corbeille, indexation recherche, miroir S3, renommage de
fichier sur le stockage) sont déléguées à **Celery** (broker Redis), avec `celery beat`
pour les tâches planifiées.
