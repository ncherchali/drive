# Conformité ANPDP / ISO 27001 (H1.10)

Socle de conformité du pilote : droits des personnes (implémentés) + résidence
des données et dossier ISO (organisationnel / déploiement).

## A10-1 — Droits des personnes (implémenté)

Endpoints self-service, authentifiés (l'utilisateur agit sur ses propres
données) :

- **Droit d'accès / portabilité** — `GET /api/{API_VERSION}/users/me/data-export/`
  renvoie en JSON : profil, éléments créés, accès, événements d'audit où
  l'utilisateur est l'acteur. Tracé par un audit `user.data_export`.
- **Droit à l'effacement** — `POST /api/{API_VERSION}/users/me/data-deletion/`
  anonymise les données personnelles (email, noms) et désactive le compte. La
  ligne utilisateur est **conservée** pour préserver l'intégrité référentielle
  du journal d'audit immuable et de la propriété des contenus. Tracé par un
  audit `user.data_deletion` (le `sub` est capté avant l'anonymisation).

> Effacement = anonymisation des PII + désactivation. Une purge physique des
> contenus possédés relève d'un workflow d'offboarding (Console, hors H1).

## A10-2 — Résidence des données & ISO 27001 (organisationnel)

### Cartographie des données personnelles

| Donnée | Stockage | Localisation cible |
|---|---|---|
| Identité (`sub`, email, noms) | PostgreSQL (`drive_user`) | DZ / Europe souveraine |
| Contenus (fichiers) | Objet S3 (MinIO/R2) — chiffrés at-rest (ds-proxy) | DZ / Europe souveraine |
| Métadonnées / accès / arbre | PostgreSQL | DZ / Europe souveraine |
| Journal d'audit | PostgreSQL partitionné (`drive_audit_event`) | DZ / Europe souveraine |
| File de tâches / cache | Redis | DZ / Europe souveraine |

### Localisation de l'hébergement

- **Aucune donnée hors territoire** : PostgreSQL, S3 et Redis sont déployés dans
  la région souveraine ciblée (cf. `src/helm`). L'identité est déléguée à
  Keycloak (réalm `ott-dz`), également hébergé localement.
- **Exception documentée** : la signature (H1.8) utilise un bac à sable
  prestataire étranger avec des **documents factices uniquement** (loi 25-11),
  en attendant un prestataire DZ avec API publique.

### Dossier ISO 27001 (à constituer)

- Politique de sécurité, gestion des accès (RBAC `ItemAccess`, MFA Keycloak
  H1.1), chiffrement at-rest (ds-proxy / KeySafe H1.5/E4.1).
- Journalisation et traçabilité : **journal d'audit tamper-evident** (H1.2 /
  A2-7), rétention et legal holds (H1.6).
- Continuité : sauvegardes PostgreSQL + S3, supervision (H1.9 — `/metrics`,
  alertes Celery).
- Gestion des incidents : Sentry + Dockerflow (existants).

> Ce dossier est un travail organisationnel continu ; ce document en est le
> point d'entrée technique.
