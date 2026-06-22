# KMS souverain via HashiCorp Vault (E4.1)

Le chiffrement de Sahla (secrets d'item, BYOK) passe par un **port `KMSProvider`**
pluggable. Deux adaptateurs sont fournis :

| Adaptateur | Quand | Crypto-shred |
|------------|-------|--------------|
| `LocalKMSProvider` (défaut) | dev / petit self-host ; clés dérivées d'un secret local | logique (désactivation de la clé) |
| `VaultTransitKMSProvider` | prod souveraine ; la clé ne quitte jamais le KMS | **réel** (suppression de la clé transit) |

Le **matériel de clé n'est jamais en base** : seule une référence `key_ref` est
stockée (le modèle `EncryptionKey` + le champ `sealed_value` des secrets).

## Pourquoi Vault Transit

HashiCorp Vault est **open-source et auto-hébergeable** (DZ / Europe), donc une
alternative **souveraine** aux KMS SaaS US. Son moteur `transit` chiffre/déchiffre
sans jamais exposer la clé (comportement HSM), et **supprimer la clé transit
détruit réellement** les données scellées (vrai crypto-shred).

## Activation

```bash
KMS_PROVIDER=core.kms.vault_provider.VaultTransitKMSProvider
KMS_VAULT_ADDR=https://vault.interne.dz:8200
KMS_VAULT_TOKEN=<token avec accès au mount transit>
KMS_VAULT_TRANSIT_MOUNT=transit          # défaut
KMS_TIMEOUT=5                            # secondes (port sortant)
KMS_BREAKER_FAILURE_THRESHOLD=5          # ouvre le circuit après N échecs consécutifs
KMS_BREAKER_RESET_TIMEOUT=30             # secondes avant un essai semi-ouvert
```

Côté Vault, activer le moteur et créer une clé par `key_ref` :

```bash
vault secrets enable transit
vault write -f transit/keys/default      # key_ref "default"
```

## Garanties du port

- **Fail-closed** : toute défaillance (HTTP, timeout, circuit ouvert, réponse
  inattendue) lève `KMSError` — jamais de clair en cas d'échec d'`encrypt`,
  jamais de valeur erronée sur `decrypt`.
- **Timeout** sur chaque appel (`KMS_TIMEOUT`).
- **Circuit-breaker** en mémoire (par worker) : après `KMS_BREAKER_FAILURE_THRESHOLD`
  échecs consécutifs, les appels échouent vite (`KMSError`) pendant
  `KMS_BREAKER_RESET_TIMEOUT` s, puis un essai semi-ouvert. Un breaker
  cluster-wide (Redis) relèverait de la couche infra.

## Crypto-shred

- **Local** : `crypto_shred(key)` désactive l'`EncryptionKey` → le service refuse
  d'`unseal` (destruction *logique* ; la clé dérivée existe toujours
  mathématiquement tant que le master n'est pas tourné).
- **Vault** : en plus, supprimer la clé transit (`vault delete transit/keys/<ref>`)
  rend les ciphertexts **mathématiquement irrécupérables** (destruction réelle).
