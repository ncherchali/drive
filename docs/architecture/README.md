# Dossier d'architecture — La Suite Drive

Documentation d'architecture détaillée de Drive (plateforme open-source de stockage
et partage de fichiers collaboratif, souveraine et auto-hébergeable).

> Basée sur l'état réel du dépôt. Les diagrammes sont en **Mermaid** (rendus par
> GitHub, VS Code + extension Mermaid, ou <https://mermaid.live>).

## Sommaire

| # | Fichier | Contenu |
|---|---|---|
| 01 | [overview](./01-overview.md) | Résumé exécutif & périmètre fonctionnel |
| 02 | [technical-architecture](./02-technical-architecture.md) | Composants, pile, **flux (auth, média, WOPI)** |
| 03 | [data-model](./03-data-model.md) | Modèle de données + **ERD Mermaid** |
| 04 | [infrastructure](./04-infrastructure.md) | Conteneurs, **déploiement Kubernetes/Helm** |
| 05 | [installation](./05-installation.md) | Dev local & production |
| 06 | [deployment-cicd](./06-deployment-cicd.md) | CI/CD, images, Helm |
| 07 | [operations](./07-operations.md) | Exploitation, sauvegardes, scalabilité |
| 08 | [monitoring](./08-monitoring.md) | Supervision, santé, erreurs, métriques |
| 09 | [security](./09-security.md) | Sécurité & conformité |
| 10 | [competitive-analysis](./10-competitive-analysis.md) | Comparaison **sourcée** Box / ShareFile / Oodrive / Tresorit |
| 11 | [roadmap](./11-roadmap.md) | Feuille de route priorisée |

Voir aussi (docs pré-existantes) : [`../architecture.md`](../architecture.md) (schéma global),
[`explorer-selection-store.md`](./explorer-selection-store.md), [`../env.md`](../env.md),
[`../metrics.md`](../metrics.md), [`../ds_proxy.md`](../ds_proxy.md),
[`../installation/kubernetes.md`](../installation/kubernetes.md).
