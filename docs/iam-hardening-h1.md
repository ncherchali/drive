# Durcissement IAM — MFA & politiques (H1.1)

Socle transverse : durcissement du realm Keycloak (MFA, anti-brute-force,
politique de mot de passe, sessions). Source de vérité des réglages ; à
appliquer au realm `drive` (dev) et au realm souverain `ott-dz` (cible).

> Le realm de dev (`docker/auth/realm.json`) porte des valeurs **locales**
> (mots de passe, webOrigins, redirect URIs) qui ne doivent pas être commitées.
> Les réglages de sécurité ci-dessous y sont appliqués en working tree ; ce
> document reste la référence committée.

## 1. Anti-brute-force (A1)

| Réglage | Valeur durcie | Défaut |
|---|---|---|
| `bruteForceProtected` | `true` | false |
| `failureFactor` (échecs avant blocage) | `5` | 30 |
| `permanentLockout` | `false` (blocage temporaire) | false |
| `maxFailureWaitSeconds` | `900` | 900 |
| `waitIncrementSeconds` | `60` | 60 |

## 2. Politique de mot de passe (A1)

```
length(12) and upperCase(1) and lowerCase(1) and digits(1)
and specialChars(1) and notUsername(undefined) and passwordHistory(3)
```

12 caractères min, majuscule/minuscule/chiffre/spécial, ≠ identifiant, 3
derniers mots de passe interdits.

## 3. MFA / OTP (A1)

- `CONFIGURE_TOTP` : action requise **par défaut** (`defaultAction: true`) →
  enrôlement OTP imposé à la première connexion.
- OTP : TOTP, SHA1, 6 chiffres, période 30 s (déjà configuré).
- Cible E-niveau : ajouter WebAuthn (clés FIDO2) et un sous-flux « Conditional
  OTP » au navigateur pour exiger le 2ᵉ facteur à chaque connexion.

## 4. Sessions (A1)

| Réglage | Valeur | Note |
|---|---|---|
| `accessTokenLifespan` | 300 s | court (rotation par refresh) |
| `ssoSessionIdleTimeout` | 1800 s (30 min) | déconnexion sur inactivité |
| `ssoSessionMaxLifespan` | 36000 s (10 h) | durée max de session |

Pour un contexte bancaire strict, réduire l'idle à 900 s (15 min) via
`ssoSessionIdleTimeout`.

## 5. Application

### Realm de dev
Réglages appliqués dans `docker/auth/realm.json` (re-import au `make bootstrap` /
recréation du conteneur Keycloak).

### Realm `ott-dz` (cible) — via kcadm

```bash
kcadm.sh update realms/ott-dz \
  -s bruteForceProtected=true -s failureFactor=5 \
  -s 'passwordPolicy=length(12) and upperCase(1) and lowerCase(1) and digits(1) and specialChars(1) and notUsername(undefined) and passwordHistory(3)' \
  -s ssoSessionIdleTimeout=1800

# OTP obligatoire à l'enrôlement
kcadm.sh update authentication/required-actions/CONFIGURE_TOTP \
  -r ott-dz -s defaultAction=true
```

> Vérifier le réalm authoritatif `ott-dz` dans `IAM/keycloak-iam` ; y répliquer
> ces réglages (les frontends valident les JWT/JWKS de ce realm).
