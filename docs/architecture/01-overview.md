# 01 — Vue d'ensemble

## Résumé exécutif

Drive est une **plateforme open-source de stockage et de partage de fichiers
collaboratif**, souveraine et auto-hébergeable (licence MIT, écosystème *La Suite
numérique* / DINUM).

**Pile** : Django REST (backend) · Next.js/React (frontend) · PostgreSQL · stockage
objet S3 (MinIO/R2) · Keycloak (OIDC) · édition documentaire WOPI (Collabora /
OnlyOffice) · Celery/Redis (asynchrone) · Docker / Kubernetes (Helm).

**Forces différenciantes** : souveraineté & auto-hébergement, OIDC standard, RBAC fin
hérité par arborescence, édition Office en ligne, API + **SDK picker embarquable**,
analyse antivirus, chiffrement S3 optionnel (ds-proxy), multilingue (fr/en/nl/de +
**arabe RTL**).

**Écarts vs offres entreprise** : signature électronique, gouvernance/DLP/rétention
avancée, chiffrement « zero-knowledge », client de synchronisation desktop, journal
d'audit complet, automatisation/workflows (cf. [10](./10-competitive-analysis.md) &
[11](./11-roadmap.md)).

## Périmètre fonctionnel actuel

Légende : ✅ présent · 🟡 partiel · ❌ absent.

| Domaine | État | Détail |
|---|:--:|---|
| Arborescence fichiers/dossiers/espaces | ✅ | Modèle `Item` unique en arbre `ltree` |
| Espaces (workspaces) | ✅ | Item racine ; espace perso + espaces partageables |
| Upload / download | ✅ | Vers S3, URLs signées, proxy nginx `media-auth` |
| Édition documents en ligne | ✅ | WOPI : Collabora + OnlyOffice |
| Partage & permissions | ✅ | RBAC (owner/admin/editor/reader), liens (restricted/authenticated/public) |
| Invitations | ✅ | Par e-mail, avec expiration |
| Favoris, corbeille (soft-delete + rétention) | ✅ | `ItemFavorite`, `deleted_at`/rétention |
| Recherche plein-texte | ✅* | Via service externe **Find** (proxy `/api/v1.0/item/search/`) |
| Antivirus / malware | ✅ | `MalwareDetection`, machine à états d'upload |
| Quotas / droits (entitlements) | ✅ | Framework `entitlements` pluggable |
| Multilingue + RTL | ✅ | fr/en/nl/de + **ar (RTL, police Cairo)** |
| API publique + SDK | ✅ | REST versionnée + SDK picker (`sdk-relay`) |
| Métriques d'usage | ✅* | `/external_api/v1.0/metrics/usage/` (Api-Key) |
| Versioning de fichiers (UI) | 🟡 | Versioning bucket S3 ; pas d'historique applicatif |
| Journal d'audit | 🟡 | `LinkTrace` (accès via lien) ; pas d'audit trail complet |

\* fonctionnalité optionnelle (service/route à activer).
