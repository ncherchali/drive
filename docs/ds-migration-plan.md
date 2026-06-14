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

## Phase 6 — Câblage des menus déroulants 🟢 `[DS_APP_SHELL]`

Adaptateur **pont data-driven** `MenuDropdown` (`src/components/ds-menu.tsx`) :
expose l'API ui-kit (`options={MenuItem[]}`, `isOpen`, `onOpenChange`) mais rend
les primitives DS `dropdown-menu` derrière le flag, sinon délègue au ui-kit. Les
hooks métier (`useItemActionMenuItems`, `useCreateMenuItems`…) restent INCHANGÉS ;
seul l'import des call sites bascule. Version DS non contrôlée côté Radix (évite
le double toggle face au `onClick` d'ouverture résiduel des boutons).

- `✨(frontend) DS phase 6 : adaptateur de menu déroulant DS (pont data-driven)`
- **Fichiers** : `ds-menu.tsx` + 5 call sites (`ItemActionDropdown`,
  `ImportDropdown`, `ExplorerTreeActions`, `CustomizableColumnHeader`,
  `ExplorerGridTrashActionsCell`).
- **Validation** : typecheck + lint OK ; **validation runtime requise** (flag on)
  pour l'ouverture/fermeture, la sélection, les états danger/disabled/checked.

> **Rescoping** : le **menu contextuel** (clic droit) est sorti de la phase 6.
> Sa forme « par ligne » (`useContextMenuContext`/`EmbeddedExplorerGrid`) repose
> sur le `ContextMenuProvider` global position-based monté dans `_app.tsx` — un
> remplacement architectural intimement lié à la grille. Il est donc traité en
> **phase 11** (grille), avec son provider.

---

## Phase 7 — En-tête 100 % DS : déclencheur de recherche DS 🟢 `[DS_APP_SHELL]`

Le dernier îlot Cunningham du header était le **bouton** de recherche. Il devient
un déclencheur DS (`ExplorerSearchButtonDs`) ; tout l'en-tête porte désormais
`.sahla-ds`. La **modale** ouverte (`ExplorerSearchModal`, Cunningham) reste
inchangée et pleinement fonctionnelle (filtres inclus) : portalée hors de
l'en-tête, elle n'est pas affectée par le reset scopé.

- `✨(frontend) DS phase 7 : déclencheur de recherche DS (en-tête 100 % DS)`
- **Fichiers** : `ExplorerSearchButtonDs.tsx` (nouveau), `DsExplorerHeader.tsx`.
- **Validation** : ouverture de la recherche depuis le header, recherche/filtres
  intacts. **Jalon : en-tête entièrement DS.**

> **Resequencing** : la réécriture de la recherche en **palette `command`** est
> déplacée en **phase 8**. Raison : les primitives DS dépendent du reset
> `.sahla-ds` pour le style de bordure (`border-solid`), or les 3 filtres de
> recherche sont Cunningham et seraient cassés par ce reset. La palette `command`
> est donc construite APRÈS la migration DS des filtres (phase 8), pour
> envelopper une palette 100 % DS sans casser les filtres.

---

## Phase 8 — Filtres, barre d'outils & palette de recherche 🟡 `[DS_EXPLORER_GRID]` / `[DS_APP_SHELL]`

Remplace le repeint SCSS par de vrais composants (`popover` + `dropdown-menu` +
`button`), puis construit la palette de recherche `command` (resequencée depuis
la phase 7) sur des filtres désormais DS.

- `✨(frontend) DS phase 8a : barre de filtres et de tri de l'explorateur en DS`
  - **Fichiers** : `ExplorerFilters.tsx` (+ suppression de `ExplorerFilters.scss`).
  - **Validation** : filtres, tri, sélecteur de colonnes ; parité avec `Filter` / `FilterOption`.
- `✨(frontend) DS phase 8b : palette de recherche command DS`
  - **Fichiers** : `ExplorerSearchModalDs.tsx` (palette `CommandDialog`, réutilise
    `driver.searchItems`/debounce/navigation/preview/wopi), `ExplorerSearchButtonDs`
    routé dessus.
  - **Validation** : saisie, résultats serveur (`shouldFilter={false}`), filtres DS,
    navigation clavier, ⌘K, ouverture WOPI/preview/dossier.

---

## Phase 9 — Modales de formulaire en DS 🟡 `[DS_APP_SHELL]`

Étend le pattern doublon `*Ds` + flag (amorcé en phase 3) aux modales de
formulaire mono-champ via un composant réutilisable `DsPromptDialog`
(`src/components/ds-prompt-dialog.tsx`, Dialog DS + Input + footer, portail
`.sahla-ds` + RTL, valeur réinitialisée à l'ouverture par remontage).

- `✨(frontend) DS phase 9 : modales de formulaire en DS (DsPromptDialog)`
- **Fichiers** : `DsPromptDialog` + `*Ds` pour création dossier, création
  workspace, renommage ; les 3 fichiers d'origine deviennent des ponts à flag.
- **Flag** : `DS_APP_SHELL` (et non `DS_CONFIRM_MODALS`) — ce sont des
  formulaires, pas des confirmations ; cohérent avec « shell DS ⇒ formulaires DS »
  et évite d'ajouter un flag backend.
- **Validation** : ouverture, focus (+ sélection au renommage), validation
  non-vide, submit/mutation, RTL.

> **Hors scope** : la modale de **déplacement** (`ExplorerMoveFolderModal`, 303 l.,
> `useTreeContext`) est un tree-picker couplé à l'arbre → traitée avec l'arbre
> (phase 12), pas ici.

---

## Phase 10 — Panneau de droite (méta / infos) 🔴 `[DS_APP_SHELL]`

Réécriture de la coquille du panneau en DS (Tailwind + Button + ScrollArea),
SANS wrapper `.sahla-ds` (composants auto-suffisants), pour laisser `ItemInfo`
(InfoRow/UserRow Cunningham) et la modale de partage intacts.

- `✨(frontend) DS phase 10a : panneau de droite (infos) en DS`
  - **Fichiers** : `ExplorerRightPanelContentDs.tsx` (nouveau) + pont à flag dans
    `ExplorerRightPanelContent.tsx`. Couvre les états vide / sélection multiple /
    item (en-tête, avertissement, ligne de partage).
- `✨(frontend) DS phase 10a+ : métadonnées (ItemInfo) en DS` → `ItemInfoDs.tsx`.
  Le panneau de droite est alors **100 % DS**.

### Phase 10b — Modale de partage : repeinture DS (option A)

Constat : `ItemShareModal` enrobe le composite **`<ShareModal>` de ui-kit** (membres,
rôles, invitations, recherche, réglages de lien, RBAC). Une réécriture DS = refaire
toute l'UX → trop gros/risqué à l'aveugle (décision : **repeinture CSS**, comme la grille).

- `🎨(frontend) DS phase 10b : repeinture DS de la modale de partage ui-kit`
- **Fichiers** : `ItemShareModal.scss` — override des classes `c__share-modal*` /
  `c__share-member-item` avec les tokens DS. **Globale** (modale portalée, pas de
  `className` sur ShareModal). Conservateur : couleurs / bordures / rayons / espacements.
- **Validation** : **à l'œil** (ouvrir le partage sur un item avec accès) — la repeinture
  d'un composite ui-kit est fragile (dépend des classes internes). Une réécriture DS
  complète reste possible plus tard (option B), avec validation runtime.

---

## Phase 11 — Menu contextuel de zone (tranche sûre) 🟡 `[DS_APP_SHELL]`

Arbitrage de risque (décision utilisateur) : la grille est le **moteur** de l'app
(sélection / DnD / clavier) et son apparence DS est **déjà couverte par la
repeinture CSS** `ds-explorer-grid.css` (WIP, approche sans risque moteur). On ne
réécrit donc PAS le markup de la grille. Seul le morceau **data-driven sûr** est
livré.

- `✨(frontend) DS phase 11 : menu contextuel de zone en DS (pont data-driven)`
- **Fichiers** : `MenuContext` ajouté à `ds-menu.tsx` (pont DS/ui-kit pour
  `<ContextMenu options>`), câblé dans `AppExplorerInner`. Trigger en
  `display:contents` (layout inchangé). Coexistence sûre avec le menu par ligne
  (qui fait `stopPropagation`).
- **Validation** : clic droit zone vide → menu créer/importer DS ; clic droit sur
  une ligne → menu d'actions (toujours ui-kit) ; pas de double menu.

> **Reporté (à faire AVEC validation runtime, app sous les yeux)** :
> - **Markup de la grille** en primitive `table` DS — risqué (sélection / DnD /
>   clavier), faible valeur ajoutée vs la repeinture CSS existante (`D1 = b`,
>   reconstruction de la ligne en `file-row`, encore moins recommandé).
> - **Menu contextuel par ligne** : `useContextMenuContext` +
>   `ContextMenuProvider` global position-based (`_app.tsx`) → migration
>   architecturale (provider DS impératif positionné).

---

## Phase 12 — Arbre latéral : repeinture DS (D2 = garder + repeindre) `[DS_APP_SHELL]` + `[DS_EXPLORER_GRID]`

Décision **D2 = garder** le `TreeView` ui-kit (`useTreeContext` = contexte propre,
coût disproportionné à réécrire), **mais le repeindre en DS** — comme la grille et
le partage. Le contenu de nœud est notre markup (`ExplorerTreeItem` →
`.explorer__tree__item*`) ; la structure (chevrons, DnD) reste ui-kit.

- `🎨(frontend) DS phase 12 : repeinture DS de l'arbre (remap tokens → sidebar DS)`
- **Fichiers** : `ExplorerTree.scss`. Astuce : on **remappe les tokens contextuels
  Cunningham** que l'arbre consomme (texte / fond hover-sélection / droppable) vers
  les tokens **sidebar** du DS (`--sidebar*`). Les custom properties héritent → tout
  l'arbre adopte le DS sans cibler de sélecteur ui-kit (robuste). Scopé
  `.sahla-ds-grid` (mode full-DS).
- **Validation** : à l'œil (sidebar avec arbre, deux flags actifs) — texte, survol,
  nœud sélectionné, droppable, expand/collapse, DnD inchangés (token-only).

> Une réécriture en composant Tree DS natif (récursion + scroll-area + DnD) reste
> possible plus tard si besoin, mais non prioritaire vu le coût/risque.

### Phase 12b — Icônes lucide + identité enterprise `[DS_EXPLORER_GRID]`

Extension de la repeinture token-only : icônes en **lucide-react** (adaptateur
`components/ui/icon.tsx`), accent de marque **unifié sur le violet `#7C3AED`** et
**typographie de tableau enterprise**. Tout gated `DS_EXPLORER_GRID`.

- **Icônes (`ItemIcon.tsx`, composant central)** : espaces partagés/publics →
  **tuile carrée teintée** (`WorkspaceTile` : carré arrondi, couleur dérivée du
  nom via hash → 7 teintes, glyphe `Building2`) ; espace principal → `House` ;
  dossier imbriqué → `Folder` ; suspect → `ShieldAlert`. **Type MIME des
  fichiers** : conservé sur le set ui-kit (hors périmètre).
- **Arbre** : favoris → `Star`, dossier imbriqué → `Folder` (`ExplorerTreeItem`) ;
  routes par défaut → `DS_ROUTE_ICONS` (`House`/`History`/`Share2`/`Star`/`Trash2`).
- **Accent violet** : `ds.css` → `--primary`/`--ring`/`--sidebar-primary`/
  `--brand-primary` en violet (hue 296, ~#7C3AED) ; IA décalée en fuchsia (hue 330)
  pour rester distincte. **Remap Cunningham** dans `ds-explorer-grid.css` sous
  `.sahla-ds-grid` : la rampe `--c--globals--colors--brand-*` ET surtout les tokens
  contextuels `--c--contextuals--{background,content,border}--semantic--brand--*`
  (que le thème DSFR APLATIT en littéraux → le remap de la rampe seule ne suffit
  pas) → boutons « Nouveau »/« Importer »/recherche en violet.
- **Typographie** : en-têtes de colonnes en petites capitales + tracking + 11px
  (y compris le libellé porté par un `c__button--neutral` dans les colonnes info,
  qui réinitialise `text-transform`) ; nom de fichier `font-weight:500` ; méta en
  `muted-foreground`.
- **Bug corrigé** : `EmbeddedExplorer.scss` `.explorer__grid__item__name{color:red}`
  (placeholder) faisait sortir les icônes lucide en rouge → token neutre.
- **Validé en live** (next dev natif + backend Docker, flags actifs).

### Phase 12c — Sidebar portée sur le composant shadcn `[DS_APP_SHELL]`

Remplacement du conteneur + nav historiques par le **composant `sidebar` shadcn**
(Radix) : `SidebarProvider`/`Sidebar`/`SidebarInset`, collapsible `offcanvas`
(rail + ⌘B + sheet mobile). Ajout manuel des primitives (pas via le CLI shadcn,
qui reconfigurerait le projet) : `components/ui/sidebar.tsx`, `ui/skeleton.tsx`,
`hooks/use-mobile.ts`.

- **Composition** (`DsExplorerSidebar.tsx`) : SidebarHeader = marque Sahla + trigger
  (retirée du `DsExplorerHeader`, qui garde recherche + menu utilisateur + un
  trigger) ; nav plate (routes par défaut, espaces, corbeille) reconstruite en
  `SidebarMenu`/`SidebarMenuButton` (icônes lucide + tuiles d'espaces) ; l'**arbre
  de dossiers dépliable est CONSERVÉ** via `ExplorerFolderTree` (extrait de
  `ExplorerTree`, TreeView ui-kit + DnD intacts — décision D2).
- **Intégration** : `DsExplorerShell` = `SidebarProvider` + `DsExplorerSidebar` +
  `SidebarInset`(header + main + MetaPanel). `ExplorerTree` (chemin non-DS) délègue
  désormais aussi à `ExplorerFolderTree` (source unique).
- **Cohabitation** : la sidebar héberge du Cunningham (bouton « Nouveau », TreeView)
  → PAS enveloppée dans `.sahla-ds`. Le preflight global étant off, on ajoute dans
  `ds-explorer-grid.css` un reset CIBLÉ `.sahla-ds-grid [data-slot^="sidebar"]`
  (`border: 0 solid var(--sidebar-border)` + `box-sizing` + `list-style:none` sur
  les `<ul>` de menu) — sinon bordures noires UA + puces de liste.
- **Validé en live** (sidebar shadcn, 11 items de menu, arbre + tuiles OK).

### Phase 12d — Polish enterprise (rayons, typo, placement, sidebar réglable) `[DS_APP_SHELL]`

Passe de finition guidée par le skill `ui-ux-pro-max` (échelle typo, rayons/
élévation cohérents, une seule CTA primaire, recherche en barre haute).

- **Rayons** : `--radius` 0.625→**0.75rem** (échelle sm 8 / md 10 / lg 12 / xl 16).
  Harmonisation des surfaces Cunningham sous `.sahla-ds-grid` : carte
  `.explorer__content` = radius-xl ; filtres/tri/boutons = radius-md ; menus = radius-lg.
- **Placement** : « + Nouveau » devient une **CTA primaire pleine largeur** en tête
  de sidebar (`DsCreateButton`, lucide `Plus` + menu de création) ; la **recherche
  n'est plus dupliquée** dans la sidebar — elle est **toujours visible dans le header**
  (lucide `Search`, ⌘K). `ExplorerTreeActions` (material-icons `add`/`search`) n'est
  plus utilisé par le shell DS (conservé pour le chemin non-DS).
- **Sidebar réglable** : poignée de drag au bord droit (`SidebarResizeHandle`) →
  `--sidebar-width` (clamp 220–460px), **persistée** (`localStorage` `sahla_sidebar_w`)
  via l'état dans `DsExplorerShell` (passé à `SidebarProvider style`). `SidebarRail` retiré.
- **Typo** : en-têtes de colonnes en petites capitales (déjà fait), noms 500, méta muted.
- **Reste (passe dédiée)** : les icônes INTERNES à la grille (tri, « … » par ligne,
  breadcrumb) sont encore en `material-icons` (19 fichiers) — sweep lucide à part.

### Phase 12e — Data table shadcn (rebuild fidèle du moteur) `[DS_EXPLORER_GRID]`

La grille de fichiers devient une **vraie data table shadcn** (TanStack + `ui/table`)
DERRIÈRE le flag, l'ancienne grille en repli. Le moteur est RÉUTILISÉ : la grille
était déjà du `useReactTable` ; seul le markup change.

- **Branche DS dans `EmbeddedExplorerGrid`** (`if (useDs) return <shadcn>`) : même
  state/handlers (sélection multi, DnD, menu contextuel, clavier, tri serveur,
  navigation, scroll infini conservé via `EmbeddedExplorer`/`InfiniteScroll`).
- **Nouveaux** : `DsExplorerGridRow` (TableRow/TableCell shadcn + `Droppable` DnD +
  `flexRender` + case à cocher par ligne + `DsSelectAllCheckbox`),
  `headers/DsGridSortHeader` (en-tête triable shadcn : libellé + flèche/chevrons).
  `ui/table.tsx` : forward `ref` (React 19) pour la nav clavier.
- **Correctifs preflight off** (`ds-explorer-grid.css`, `@layer base`) : bordures /
  fonds boutons / case rendus visibles ; `.c__datagrid` (`align-items:flex-end`)
  forcé `stretch` (table pleine largeur) ; 1re colonne (case) ré-affichée car
  `EmbeddedExplorer.scss` masque `th/td:nth-child(1)` (colonne mobile) sur desktop.
- **Restes** : tri col1/col2 = encore `SortColumnButton` ui-kit ; responsive mobile
  de la data table à retravailler.
- **Validé en live** (table shadcn pleine largeur, cases select-all + par ligne, tri NOM).

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
