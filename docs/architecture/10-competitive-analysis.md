# 10 — Analyse concurrentielle (sourcée)

Comparaison de Drive avec **Box**, **Citrix ShareFile**, **Oodrive** et **Tresorit**.
Les capacités des concurrents sont **sourcées** (voir liens en bas) ; recherche
réalisée en mai 2026. Légende : ✅ présent · 🟡 partiel/via add-on · ❌ absent.

## Positionnement de chaque concurrent (sourcé)

- **Box** — Plateforme entreprise de *content cloud*. **Box Sign** (e-signatures
  illimitées incluses sur Business+), **Box Governance** (rétention, **Activity-Based
  Legal Holds**), **journal d'audit** capturant chaque action, **Box Drive** (sync
  desktop). Conformité HIPAA, FedRAMP, 21 CFR Part 11.
- **Citrix ShareFile** — Partage sécurisé + **VDR** (data room : pistes d'audit,
  contrôle d'accès investisseurs, due diligence). **E-signature native** via
  **RightSignature** intégré. Chiffrement **AES-256** au repos + TLS, 2FA/SSO.
- **Oodrive** — Acteur **souverain français**. **Oodrive Sign** (eIDAS, 3 niveaux de
  signature, alternative à DocuSign/Yousign), co-édition/partage/stockage/chat/visio,
  AES-256, hébergement France / **SecNumCloud (ANSSI)**, certifications **ISO 27001,
  ISO 27701, HDS** ; **Oodrive Save** (rétention, reprise ransomware, *legal discovery*).
- **Tresorit** — **Chiffrement de bout en bout & zero-knowledge** (chiffrement sur
  l'appareil, serveurs sans accès aux clés). Partage chiffré avec **liens protégés par
  mot de passe, dates d'expiration, limites de téléchargement** ; **sync desktop** ;
  **versioning** (10/50/100/illimité selon plan) ; **Tresorit eSign** (QES eIDAS via
  Evrotrust, chiffré de bout en bout).

## Matrice de capacités

| Capacité | **Drive** | Box | ShareFile | Oodrive | Tresorit |
|---|:--:|:--:|:--:|:--:|:--:|
| Stockage / partage / dossiers | ✅ | ✅ | ✅ | ✅ | ✅ |
| Édition Office en ligne | ✅ | ✅ | 🟡 | ✅ | 🟡 |
| RBAC fin + liens | ✅ | ✅ | ✅ | ✅ | ✅ |
| Liens : mot de passe / expiration / limite DL | 🟡 | ✅ | ✅ | ✅ | ✅ |
| Versioning + historique (UI) | 🟡 | ✅ | ✅ | ✅ | ✅ |
| Recherche plein-texte | ✅* | ✅ | ✅ | ✅ | 🟡 |
| Antivirus | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Signature électronique** | ❌ | ✅ (Box Sign) | ✅ (RightSignature) | ✅ (Oodrive Sign, eIDAS) | ✅ (eSign QES) |
| **Workflows / automatisation** | ❌ | ✅ (Relay) | ✅ | 🟡 | ❌ |
| **Journal d'audit / activité** | 🟡 | ✅ | ✅ (VDR) | ✅ | ✅ |
| **Gouvernance / rétention / legal hold / DLP** | 🟡 | ✅ (Governance) | 🟡 | ✅ (Save) | 🟡 |
| **Client sync desktop** | ❌ | ✅ (Box Drive) | ✅ | ✅ | ✅ |
| **Chiffrement E2EE zero-knowledge** | ❌ | ❌ | ❌ | ❌ | ✅ (cœur) |
| Chiffrement at-rest | 🟡 (ds-proxy) | ✅ | ✅ (AES-256) | ✅ (AES-256) | ✅ |
| Data room / partage externe sécurisé | 🟡 | ✅ | ✅ (VDR) | ✅ | ✅ |
| API + intégrations | ✅ | ✅ | ✅ | ✅ | 🟡 |
| **Souveraineté / auto-héberg. / open-source** | ✅ | ❌ | ❌ | 🟡 (FR, propriétaire) | 🟡 (CH, propriétaire) |
| Conformité (SecNumCloud / ISO / HDS / SOC2…) | à opérer | ✅ | ✅ | ✅ (SecNumCloud, ISO, HDS) | ✅ (ISO, zero-knowledge) |

\* via service externe **Find** (optionnel).

## Lecture
- Drive est **très compétitif sur le socle** (stockage, RBAC hérité, édition Office,
  API/SDK) et **unique sur l'auto-hébergement souverain open-source** — là où Box et
  ShareFile sont des SaaS US propriétaires, Oodrive un SaaS souverain FR propriétaire,
  Tresorit un SaaS suisse propriétaire.
- Les **écarts** se concentrent sur l'**entreprise/gouvernance** : signature
  électronique (tous les 4 l'ont), audit complet, rétention/legal hold/DLP, sync
  desktop, et **E2EE zero-knowledge** (différenciateur exclusif de Tresorit).
- **Oodrive** est le concurrent le plus proche en intention (souveraineté + conformité
  HDS/SecNumCloud) — cible de référence pour le positionnement secteur public/régulé.

## Sources
- Box Sign : <https://www.box.com/esignature>
- Box Governance / Legal Holds : <https://support.box.com/hc/en-us/articles/40323231996563-Introducing-Box-Governance-Activity-Based-Legal-Holds> · <https://blog.box.com/en/legal-holds-now-available-box-governance-customers> · <https://www.box.com/security/governance-and-compliance/automation>
- Citrix ShareFile (VDR, RightSignature, AES-256) : <https://datarooms.org.uk/citrix-sharefile/> · <https://en.wikipedia.org/wiki/ShareFile> · <https://www.cloudwards.net/citrix-sharefile-review/>
- Oodrive Sign / sécurité / certifications : <https://www.oodrive.com/products/oodrive-sign/> · <https://www.oodrive.com/products/oodrive-work/secure-file-sharing/> · <https://www.oodrive.com/group-news/oodrive-renews-iso-27001-iso-27701-hds-2-0-certifications/> · <https://www.oodrive.com/department/information-security/>
- Tresorit (zero-knowledge, partage, versioning, eSign) : <https://tresorit.com/features/zero-knowledge-encryption> · <https://tresorit.com/security> · <https://tresorit.com/new-features> · <https://www.cloudwards.net/sync-com-vs-tresorit/>
