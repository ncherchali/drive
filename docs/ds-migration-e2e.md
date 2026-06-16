# Dépose ui-kit/Cunningham — état e2e (lot 14.6)

La suite Playwright (`src/frontend/apps/e2e`, 29 specs) est **sémantique** (245
`getByRole`, 76 `getByText`, ~16 `data-testid`) — donc largement résiliente à la
refonte DS. Ce document liste ce qui a été restauré et ce qui reste à adapter.

## Lancer la suite
Backend e2e dédié (DB jetable) requis :
```bash
make bootstrap-e2e
make run-tests-e2e -- --project chromium
make clear-db-e2e   # reset entre runs
```

## `data-testid` restaurés dans le markup DS (commit 14.6)
Reconstruits à l'identique du contrat e2e :
- `file-preview`, `file-preview-nav` → `DsFilePreview` (overlay + carrousel, nav
  rendue seulement si > 1 fichier → invisible pour un fichier unique).
- `members-list`, `share-member-item`, `search-users-list`, `search-user-item`,
  `aria-label="Share modal"`, input `role="combobox"`/`aria-label="Quick search input"`
  → `DsShareModal`.

Déjà présents (vérifiés) : `explorer-breadcrumbs`, `breadcrumb-button`,
`default-route-button`, `trash-page-breadcrumbs`, `create-folder-button`,
`create-folder-input` (via `inputTestId` de `DsPromptDialog`), `right-panel`,
`search-item`, `share-button`.

## Specs à ADAPTER — divergences UX volontaires du DS
Ces écarts ne sont pas des régressions : le DS a remplacé des composites ui-kit
par des primitives Radix au comportement différent. Les specs/utilitaires e2e
doivent suivre.

1. **Sélecteurs de rôle (partage)** — `utils/share-utils.ts`
   - Le DS rend les rôles via **Radix `Select`** (`role="option"`,
     `data-disabled`), pas un `DropdownMenu` (`role="menuitem"`).
   - À mettre à jour : `expectAllowedRoles`, `selectRoleUser`,
     `clickOnMemberItemRole`, `selectLinkReach`, `expectAllowedLinkReach` →
     `getByRole("option")` au lieu de `"menuitem"`. Le déclencheur n'expose plus
     `access-role-dropdown-button` / `share-link-reach-dropdown-button` (utiliser
     le `combobox`/`SelectTrigger` via `aria-label`, ou rétablir ces testids si
     l'on préfère un `DropdownMenu`).

2. **Bouton d'invitation** — le DS affiche le libellé i18n
   `explorer.actions.share.modal.invite` (« Inviter »). La spec attend `name:
   "Share"` → aligner la traduction EN ou le sélecteur.

3. **Arbre de la sidebar** — `utils-tree.ts` (`tree_item_content`)
   - L'ancien arbre de dossiers extensible a été **supprimé** : la sidebar DS
     liste des espaces à plat (`SidebarMenuButton`) + un lien « Espaces » vers la
     vue centrale. Les specs de navigation par expansion d'arbre (`expandTree`,
     etc.) doivent être réécrites pour la nouvelle nav (clic sur l'espace →
     `/explorer/items/<id>`).

## Reco
Faire tourner `make run-tests-e2e` dans l'env Docker e2e, puis traiter les échecs
ci-dessus (mises à jour de specs, pas de composants) au fil de l'eau.
