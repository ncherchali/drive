# 09 — Sécurité & conformité

| Domaine | Mécanisme |
|---|---|
| Authentification | OIDC Keycloak (realm `drive`), JWT/JWKS, sessions 12 h |
| Autorisation | RBAC par `Item` (owner/admin/editor/reader) + `link_reach` ; **hérité par l'arbre** |
| API non-interactive | Clés API DRF (`djangorestframework-api-key`) |
| Anti-abus | Throttling DRF (`ScopedRateThrottle` : listes users, relais SDK) |
| CORS / CSRF | `CORS_ALLOWED_ORIGINS`, `SDK_CORS_ALLOWED_ORIGINS`, protection CSRF Django |
| Antivirus | `MALWARE_DETECTION` (backend pluggable) ; états `analyzing` / `suspicious` |
| Chiffrement | TLS (ingress) en transit ; **ds-proxy** chiffrement at-rest S3 (optionnel) |
| Secrets | `SecretFileValue` (fichiers montés), jamais en clair dans le code |
| Supply chain | **Scan Trivy** des images en CI |
| Validation fichiers | Détection MIME (`python-magic`), machine à états d'upload |
| Données / RGPD | Soft-delete + rétention corbeille, purge (`hard_deleted_at`) |
| Souveraineté | Auto-hébergement complet, pas de dépendance cloud US obligatoire |

## Limites actuelles
- Pas de **chiffrement de bout en bout « zero-knowledge »** : ds-proxy chiffre **côté
  serveur**, les clés restent côté infrastructure (≠ Tresorit).
- **Journal d'audit** non exhaustif (`LinkTrace` trace les accès via lien uniquement).
- Pas de **DLP** ni de classification de données.
- **MFA** délégué à Keycloak (à configurer/forcer côté realm).
- **Certifications** (SOC 2, ISO 27001, HDS, SecNumCloud) = travail organisationnel
  à mener (non couvert par le code).

## Recommandations immédiates
1. Forcer **MFA** et politiques de mot de passe / durée de session dans Keycloak.
2. Restreindre `CORS_ALLOWED_ORIGINS` / `ALLOWED_HOSTS` en production.
3. Activer **ds-proxy** pour le chiffrement at-rest si l'infra S3 ne le garantit pas.
4. Mettre en place la rotation des secrets et la revue des clés API.
