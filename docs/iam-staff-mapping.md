# Mapping Keycloak → `is_staff` (zones d'administration)

Les consoles d'administration de Sahla (registre des **types de contenu** et des
**templates de métadonnées**, ADR-0001) sont réservées au flag Django
`is_staff` ; le backend exige `IsAdminUser` (= `is_staff`) pour toute écriture
du registre.

Plutôt que de cocher `is_staff` à la main pour chaque utilisateur, ce mapping
fait de **Keycloak la source de vérité** : un rôle (ou groupe) attribué dans
Keycloak accorde `is_staff` au login, et le retrait du rôle le révoque.

## Comment ça marche

À chaque connexion OIDC, `core/authentication/backends.py` :

1. rassemble les rôles/groupes présents dans l'`userinfo` (emplacements Keycloak
   habituels : `realm_access.roles`, `resource_access.<client>.roles`, `roles`,
   `groups` — les chemins de groupe `/x` sont normalisés en `x`) ;
2. si l'un d'eux figure dans le réglage **`OIDC_STAFF_ROLES`**, fixe
   `is_staff=True`, sinon `is_staff=False` ;
3. applique la valeur de façon **autoritaire** (accorde **et** révoque), **sans
   jamais rétrograder un superuser**.

> Tant que `OIDC_STAFF_ROLES` est **vide** (défaut), le mapping est **désactivé**
> et `is_staff` reste géré manuellement (Django admin / shell).

## Réglage Django

```bash
# Un ou plusieurs rôles/groupes Keycloak, séparés par des virgules.
OIDC_STAFF_ROLES=drive-admin
```

(`values.ListValue`, lu via la variable d'environnement `OIDC_STAFF_ROLES`.)

> ⚠️ **N'activez `OIDC_STAFF_ROLES` qu'après avoir configuré le mapper Keycloak
> ci-dessous.** Sinon, l'`userinfo` ne contenant aucun rôle, le sync mettrait
> `is_staff=False` à tous les comptes OIDC au prochain login (révocation des
> droits accordés manuellement). Les superusers restent protégés.

## Configuration Keycloak (realm de Drive)

1. **Créer le rôle** : *Realm roles* → *Create role* → `drive-admin`.
   (Alternative : un *Group* `admins`, si vous préférez piloter par groupe.)

2. **Exposer les rôles dans l'`userinfo`** — c'est l'étape clé, car le backend
   lit l'endpoint `userinfo` :
   - Client de Drive → *Client scopes* → le scope dédié `…-dedicated` →
     *Add mapper* → *By configuration* :
     - **User Realm Role** : *Token Claim Name* = `realm_access.roles`,
       *Multivalued* = ON, **Add to userinfo** = ON.
     - (ou **Group Membership** : *Token Claim Name* = `groups*,
       *Full group path* = ON/OFF selon le besoin, **Add to userinfo** = ON.)

3. **Attribuer le rôle** : *Users* → l'utilisateur → *Role mapping* → *Assign
   role* → `drive-admin` (ou ajouter l'utilisateur au groupe `admins`).

4. **Activer le réglage** Django : `OIDC_STAFF_ROLES=drive-admin`, puis
   redémarrer le backend. L'utilisateur obtient `is_staff` à sa prochaine
   connexion.

## Vérification

- `GET /api/v1.0/users/me/` renvoie `"is_staff": true` pour l'utilisateur
  porteur du rôle.
- Le lien *Administration* apparaît dans le menu utilisateur ; les pages
  `/admin/content-types` et `/admin/metadata-templates` sont accessibles.
- Retirer le rôle dans Keycloak → au login suivant, `is_staff` repasse à `false`
  (sauf superuser).

## Notes

- Le **superuser local** (créé par `make superuser`, hors OIDC) n'est jamais
  affecté par ce mapping.
- En **dev sans mapper Keycloak**, laissez `OIDC_STAFF_ROLES` vide et accordez
  `is_staff` ponctuellement via le Django admin (`/admin`) ou
  `manage.py shell`.
