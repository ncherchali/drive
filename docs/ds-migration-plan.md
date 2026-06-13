# Plan de migration — explorateur « full DS » (Cunningham → Design System Sahla)

Ce document décrit le chemin restant pour amener l'explorateur de fichiers à un
état **100 % Design System Sahla** (shadcn/Radix + Tailwind v4), en déposant
progressivement Cunningham / `@gouvfr-lasuite/ui-kit`.

Il prolonge les phases 1 à 4 déjà livrées sur la branche `feat/design-system-shadcn`
(fondation, primitives, RTL, ThemeProvider, audit WCAG AA, primitives de layout,
pilote modales derrière flag). La numérotation reprend donc à la **phase 5**.

## Principes

- **Cohabitation maîtrisée** : le DS coexiste avec Cunningham jusqu'à la dépose
  finale ; preflight Tailwind désactivé globalement, reset scopé sous `.sahla-ds`,
  dark mode ponté via `.dark` (cf. `src/styles/ds.css`, `features/theme/ThemeProvider.tsx`).
- **Bascule par flags** : chaque surface est activable / rollback-able
  indépendamment. Flags front (`features/flags/useFeatureFlag.ts`) adossés à des
  settings backend `FEATURES_<NAME>` (`core/api/viewsets.py`, `drive/settings.py`),
  donc activables en prod **sans rebuild front**.
  - `DS_APP_SHELL` — coquille + en-tête
  - `DS_EXPLORER_GRID` — grille de fichiers
  - `DS_CONFIRM_MODALS` — modales de confirmation
- **Convention de commits** : `✨(frontend) DS phase N : …` (emoji-prefixed, cf. `.gitlint`).
- **Garde-fous transversaux à chaque phase** : RTL (arabe), dark mode, contrastes
  WCAG AA, non-régression du moteur de grille (sélection / tri / DnD / clavier).

## État initial (point de départ)

- **55 fichiers sur 72** dans `features/explorer` importent encore
  `@gouvfr-lasuite/ui-kit` ou `cunningham-react`.
- **Chrome déjà DS** : coquille (`AppShell`/`Sidebar`/`AppHeader`), en-tête
  (marque + `UserMenu`), Toaster, 3 modales de confirmation, page `/ds-preview`.
- **Contenu encore Cunningham** (repeint en SCSS ou brut) : grille, arbre,
  filtres, panneau de droite, partage, modales restantes.
- **8 primitives DS manquantes** : `popover`, `command`, `sheet`, `table`,
  `tabs`, `scroll-area`, `badge`, `progress`.
- **Deux systèmes d'icônes** : lucide-react (DS) vs `Icon`/`IconSize` (ui-kit).

Légende risque : 🟢 bas · 🟡 moyen · 🔴 élevé. `[flag]` = livré derrière un flag.

---

## Phase 5 — Compléter le kit DS 🟢 (pré-requis, aucun flag)

Additif, vérifiable isolément dans `/ds-preview`.

| Commit | Contenu | Fichiers |
|--------|---------|----------|
| `✨(frontend) DS phase 5a : primitives popover, command, sheet` | cmdk + Radix Popover / Dialog-drawer | `components/ui/{popover,command,sheet}.tsx` |
| `✨(frontend) DS phase 5b : primitives table, tabs, scroll-area, badge, progress` | styles sur TanStack + Radix | `components/ui/{table,tabs,scroll-area,badge,progress}.tsx` |
| `✨(frontend) DS phase 5c : adaptateur d'icônes lucide (mapping IconSize)` | wrapper `<Icon>` mappant `IconSize` ui-kit → tailles lucide | `components/ui/icon.tsx` |

**Validation** : primitives ajoutées à `/ds-preview`, build + lint OK, contrôle RTL + dark.
**Dépendances** : aucune. Bloque toutes les phases suivantes.

---

## Phase 6 — Câblage des menus & actions 🟢 `[DS_APP_SHELL]`

Remplacement 1-pour-1 de `useDropdownMenu` / `MenuItem` / `ContextMenu` ui-kit par
les primitives `dropdown-menu` / `context-menu` DS (déjà présentes).

- `✨(frontend) DS phase 6 : menus et menu contextuel de l'explorateur en DS`
- **Fichiers** : `useCreateMenuItems.tsx`, cellules d'actions de ligne, menu contextuel de grille (~10 fichiers).
- **Validation** : menu « créer », actions de ligne, clic droit grille — parité fonctionnelle. Retire ~10 fichiers de la dette.

---

## Phase 7 — En-tête 100 % DS : recherche 🟡 `[DS_APP_SHELL]`

Dernier îlot Cunningham du header → primitive `command`.

- `✨(frontend) DS phase 7 : recherche explorateur sur primitive command (header full DS)`
- **Fichiers** : `ExplorerSearchButton`, `DsExplorerHeader` (envelopper tout le header dans `.sahla-ds`).
- **Validation** : recherche, filtres de recherche, navigation résultats. **Jalon : en-tête entièrement DS.**

---

## Phase 8 — Filtres & barre d'outils 🟡 `[DS_EXPLORER_GRID]`

Remplace le repeint SCSS par de vrais composants (`popover` + `dropdown-menu` + `button`).

- `✨(frontend) DS phase 8 : barre de filtres et de tri de l'explorateur en DS`
- **Fichiers** : `ExplorerFilters.tsx` (+ suppression de `ExplorerFilters.scss`).
- **Validation** : filtres, tri, sélecteur de colonnes ; parité avec `Filter` / `FilterOption`.

---

## Phase 9 — Compléter le set de modales 🟡 `[DS_CONFIRM_MODALS]`

Étend le pattern doublon `*Ds` + flag (amorcé en phase 3) au reste des modales.

- `✨(frontend) DS phase 9 : modales création workspace/dossier, renommage, déplacement en DS`
- **Fichiers** : `ExplorerCreateWorkspaceModal` (encore `cunningham-react`), création de dossier, renommage, déplacement folder → doublons `*Ds`.
- **Validation** : chaque modale derrière le flag, parité formulaire (RHF + `input` / `button` DS). **Jalon : chantier modales clos.**

---

## Phase 10 — Panneau de droite (méta / infos / partage) 🔴 `[DS_APP_SHELL]`

Vraie réécriture (pas un override SCSS). Le partage porte la logique RBAC → tester finement.

| Commit | Contenu |
|--------|---------|
| `✨(frontend) DS phase 10a : panneau méta/infos en DS (tabs + scroll-area)` | `ExplorerRightPanelContent`, `InfoRow` |
| `✨(frontend) DS phase 10b : modale de partage en DS (rôles, liens)` | `ItemShareModal` (`avatar` / `select` / `badge` DS) |

**Validation** : onglets infos/activité, rôles & liens de partage (RBAC), responsive via `sheet` mobile.

---

## Phase 11 — Grille de fichiers 🟡 `[DS_EXPLORER_GRID]` — décision **D1**

**Recommandé (D1 = a)** : habiller le moteur TanStack avec la primitive `table` DS,
**sans toucher** sélection / tri / DnD / clavier ; supprimer la couche de
coexistence `ds-explorer-grid.css`.

- `✨(frontend) DS phase 11 : grille de fichiers sur primitive table DS (moteur TanStack inchangé)`
- **Fichiers** : `AppExplorer` (rendu), suppression de `ds-explorer-grid.css` + repeint `AppExplorer.scss`.
- **Validation** : sélection multiple, tri, drag-and-drop, navigation clavier, virtualisation — **non-régression du moteur** (priorité absolue).

> Alternative (D1 = b) : reconstruire la ligne en `file-row` DS (déjà écrit). Plus
> « pur » mais réimplémente sélection multiple / DnD / clavier → risque élevé pour
> un gain surtout cosmétique. Non recommandé.

---

## Phase 12 — Arbre latéral 🔴 `[DS_APP_SHELL]` — décision **D2**

Seul endroit au coût disproportionné (`useTreeContext` = contexte propre ui-kit,
pas de Tree shadcn standard).

- **D2 = construire** : `✨(frontend) DS phase 12 : composant arbre DS (récursion + scroll-area + DnD)` → `components/layout/tree/*`.
- **D2 = garder** (recommandé) : phase **sautée** — le Tree ui-kit reste, encapsulé
  dans la `Sidebar` DS et stylé via `ExplorerTree.scss` (exception assumée).

**Validation** (si construit) : expand/collapse, DnD inter-nœuds, sélection, scroll, RTL.

---

## Phase 13 — Dépose de Cunningham (endgame) 🔴

À démarrer **uniquement** quand les phases 6-12 sont validées **et** les flags
passés à `true` par défaut. Un commit par étape (bisect facile).

| Commit | Contenu |
|--------|---------|
| `♻️(frontend) DS phase 13a : ThemeProvider source unique, retrait du pont dark Cunningham` | retire `useSyncDarkClass`, `CunninghamProvider` de `_app.tsx` |
| `♻️(frontend) DS phase 13b : bascule @config → @theme, tokens DS canoniques` | `tailwind.css`, suppression `tailwind.config.js` + `cunningham-tokens*` + `build-theme` |
| `♻️(frontend) DS phase 13c : preflight global réactivé, .sahla-ds remonté à la racine` | retire les resets scopés et les précautions « ne pas envelopper » (DsExplorerShell / Header) |

**Validation** : passe complète clair/sombre, LTR/RTL, contrastes AA ; **0 import
`@gouvfr-lasuite/*` restant** dans `features/explorer` (cible : 0/72).

---

## Phase 14 — Nettoyage 🟢

- `🔥(frontend) DS phase 14 : suppression des doublons *ModalDs et des flags DS`
- **Fichiers** : fusion `*Modal` / `*ModalDs`, retrait des flags front (`useFeatureFlag`)
  **et** backend (`FEATURE_FLAGS`, `settings.py`), désinstallation de
  `@gouvfr-lasuite/ui-kit` + `cunningham-react` du `package.json`.
- **Validation** : build, lint, tests e2e Playwright verts ; CHANGELOG à jour.

---

## Séquencement & dépendances

```
Phase 5 (kit) ──┬─> 6 (menus) ──> 7 (recherche) ─┐
                ├─> 8 (filtres) ─────────────────┤
                ├─> 9 (modales) ─────────────────┼─> 13 (dépose) ─> 14 (nettoyage)
                ├─> 10 (panneau droit) ──────────┤
                ├─> 11 (grille) ─────────────────┤
                └─> 12 (arbre, optionnel) ───────┘
```

- **Phase 5 bloque tout le reste.** Une fois faite, **6 à 12 sont largement
  parallélisables** (surfaces indépendantes).
- **13 ne démarre que** lorsque 6-12 sont validées ET les flags passés à `true`
  par défaut.

## Décisions à figer avant les phases 11/12

| # | Décision | Recommandation |
|---|----------|----------------|
| **D1** | Grille : habiller le moteur TanStack vs reconstruire la ligne en `file-row` DS | **Habiller** (moteur inchangé, faible risque) |
| **D2** | Arbre : construire un Tree DS vs garder le Tree ui-kit repeint | **Garder** en exception permanente |
| **D3** | `FilePreview` ui-kit : migrer vs garder l'exception | **Garder** (adopté récemment) |
