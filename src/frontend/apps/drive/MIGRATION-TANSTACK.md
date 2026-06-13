# Migration Next.js → TanStack — plan détaillé (Sahla / Drive)

> **Statut : PLAN pour validation. Aucune ligne de code écrite.**
> Cible demandée : **TanStack Start**. App actuelle : **Next.js 15.5 (Pages Router, `output: "export"`)** — un **SPA statique** qui parle à un backend Django séparé.

---

## 0. Cadre & avertissements

- **Irréversible côté upstream.** Drive est un fork de La Suite Drive (Next.js). Quitter Next coupe définitivement le suivi amont : chaque mise à jour DINUM deviendra un portage manuel. Décision actée par l'utilisateur.
- **Multi-sessions.** Chantier de plusieurs jours/semaines. À faire sur branche dédiée `feat/tanstack-start-migration`, l'app Next restant fonctionnelle jusqu'à la bascule finale.
- **Prérequis sécurité.** Commiter l'état Étape 0.5 (teal + Tailwind + migrations SCSS, vérifié) avant de commencer.

### Décision technique à acter : Start vs Router

L'app est un **SPA en export statique** (`output: "export"`), 100 % client, sans SSR (les données viennent de Django via react-query). Conséquence :

- **TanStack Router + Vite (mode SPA)** = le mapping exact de l'existant. Le plus simple, le plus proche.
- **TanStack Start** = framework full-stack (SSR + server functions). Ses atouts (SSR, server functions) **ne seraient pas utilisés** ici. Start sait tourner en **mode SPA / prerender**, donc c'est faisable, mais on embarque une couche serveur inutile.

**Recommandation :** viser **TanStack Router + Vite en SPA** (= le cœur de Start sans la couche serveur). Si tu veux explicitement Start (pour garder la porte ouverte au SSR plus tard), on l'installe en **mode SPA**. Le reste du plan vaut pour les deux (même routeur, même Vite).

---

## 1. Inventaire impacté (mesuré)

**13 routes** (Pages Router) :

| Next (`src/pages`) | TanStack (`src/routes`) | Notes |
|---|---|---|
| `index.tsx` | `index.tsx` (`/`) | accueil/login |
| `401.tsx`, `403.tsx` | `401.tsx`, `403.tsx` | pages d'erreur |
| `explorer/items/my-files.tsx` | `explorer/items/my-files.tsx` | + favorites, recent, shared-with-me (idem) |
| `explorer/items/[id].tsx` | `explorer/items/$id.tsx` | param `[id]`→`$id` |
| `explorer/items/files/[id].tsx` | `explorer/items/files/$id.tsx` | |
| `explorer/trash/index.tsx` | `explorer/trash/index.tsx` | |
| `sdk/index.tsx`, `sdk/explorer/index.tsx` | `sdk/index.tsx`, `sdk/explorer/index.tsx` | SDK embarqué |
| `wopi/[id].tsx` | `wopi/$id.tsx` | iframe éditeur |
| `_app.tsx` | `__root.tsx` | providers + `<Outlet/>` |
| `_document.tsx` | `index.html` + root | `<html lang/dir>`, `<head>` |

**APIs Next à remplacer :**
- `next/router` — **19 fichiers** (cœur de l'effort) : navigation, params, query.
- `next/head` — 3 fichiers (`ConfigProvider`, `pages/index`, `pages/_app`).
- `next/script` — 1 (`ConfigProvider`, charge `FRONTEND_JS_URL`).
- `NEXT_PUBLIC_*` — 2 (`features/analytics/AnalyticsProvider`, `features/api/utils.ts` = `NEXT_PUBLIC_API_ORIGIN`).
- `next.config.ts` : `output: "export"`, `transpilePackages: ["pdfjs-dist"]`, `reactStrictMode:false`, `swcMinify`/`debug` (clés obsolètes).
- Pas de `next/link`, `next/image`, `next/dynamic` (0 usage) — bonne nouvelle.

---

## 2. Mapping des APIs Next → TanStack Router

| Next | TanStack Router |
|---|---|
| `useRouter().push("/x")` | `useNavigate()({ to: "/x" })` |
| `useRouter().replace(x)` | `navigate({ to: x, replace: true })` |
| `router.query.id` | `useParams({ from: "/explorer/items/$id" })` |
| `router.query` (search) | `useSearch({ from })` + schéma de validation |
| `router.pathname` / `asPath` | `useLocation()` / `useRouterState({ select: s => s.location })` |
| `router.back()` | `useRouter().history.back()` |
| `router.isReady` | inutile (params dispo synchrones) |
| `getLayout` par page | **routes de layout** TanStack (`route.tsx` parent ou layout pathless) |
| `next/head` | `head`/`meta` dans les options de route (Start) **ou** lib head ; pour SPA : root `<head>` + `index.html` |
| `next/script` (FRONTEND_JS_URL) | injection `<script>` simple dans un composant/effet |
| `NEXT_PUBLIC_API_ORIGIN` | `import.meta.env.VITE_API_ORIGIN` |

Le `getLayout` global de l'explorateur (`getGlobalExplorerLayout`) devient une **route de layout** `routes/explorer/route.tsx` (ou pathless `routes/_explorer.tsx`) avec `<Outlet/>`.

---

## 3. Phases

### Phase 1 — Échafaudage (branche, build)
- Brancher `feat/tanstack-start-migration` (après commit Étape 0.5).
- Ajouter Vite + `@tanstack/react-router` (+ plugin Vite de génération de routes) [+ `@tanstack/react-start` si mode Start].
- `vite.config.ts` : alias `@/`→`src`, SCSS (sass déjà présent), **PostCSS/Tailwind** (réutilise `postcss.config.js` + `tailwind.config.js` existants), `transpilePackages` pdfjs → `optimizeDeps`/`ssr.noExternal` selon besoin.
- `index.html` (remplace `_document`) : `lang`, `dir` (RTL arabe — porter la logique `initI18n`), preconnect + lien police Cairo.
- Entrée client (`src/main.tsx` / router) + `__root.tsx` minimal qui rend `<Outlet/>`.
- **Jalon :** `vite dev` démarre, une route « hello » s'affiche avec le thème Cunningham+Tailwind chargé.

### Phase 2 — Socle transverse (providers)
Porter `_app.tsx` dans `__root.tsx` : `CunninghamProvider` (thème teal), `QueryClientProvider` (react-query), `ConfigProvider`, `AnalyticsProvider`, `ContextMenuProvider`, `Toaster`, `ResponsiveDivs`, init i18n, `<head>` (favicon par token, police Cairo). Remplacer `next/head`→gestion head, `next/script`→injection JS.
- **Jalon :** providers actifs, config chargée (réutilise le contrat `/api/v1.0/config/`), thème appliqué.

### Phase 3 — Routes par lots
Migrer dans cet ordre (du plus simple/visible au plus complexe), en remplaçant `next/router` au fil de l'eau :
1. `/` (accueil/login), `/401`, `/403`.
2. Layout explorateur (`getGlobalExplorerLayout`→route de layout) + `/explorer/items/my-files`.
3. `favorites`, `recent`, `shared-with-me`, `trash`.
4. Dynamiques : `/explorer/items/$id`, `/explorer/items/files/$id`, `/wopi/$id` (params + iframe WOPI).
5. SDK : `/sdk`, `/sdk/explorer` (embarqué/iframe — vérifier le postMessage relay).
- **Jalon par lot :** route rendue + navigation OK (capture).

### Phase 4 — Plateforme
- **Env** : `NEXT_PUBLIC_API_ORIGIN`→`VITE_API_ORIGIN` dans `api/utils.ts` + `AnalyticsProvider` ; maj `.env*`, l'arg Docker `API_ORIGIN`, le `Dockerfile` frontend (build Vite au lieu de Next).
- **SDK** (`packages/sdk`) : vérifier qu'il n'importe pas `next` ; sinon adapter. Son build (tsup/rollup) est indépendant a priori.
- **Export statique** : `vite build` produit un SPA ; **fallback history** côté nginx (servir `index.html` sur toutes les routes) — adapter la conf nginx/Dockerfile (Next export générait du HTML par route).
- **e2e** (`apps/e2e` Playwright) : maj `baseURL`/commandes de build/serve.
- **Scripts npm** : `dev`/`build`/`start`/`lint` → Vite ; `build-theme` (cunningham CLI) inchangé.

### Phase 5 — Bascule & nettoyage
- Retirer `next`, `next.config.ts`, `src/pages/`, dépendances Next.
- Vérifier tout le parcours (login → explorer → navigation → partage → WOPI → SDK) avec le backend réel.
- Mettre à jour `CLAUDE.md` du projet (stack Next→Vite/TanStack) et la doc.

---

## 4. Pièges identifiés

- **SSR inutile** : ne pas activer le rendu serveur (l'app est client-only). Mode SPA/prerender.
- **`dir="rtl"` arabe** : la logique actuelle (`initI18n` pose `<html dir>`) doit migrer dans le root/`index.html` ; vérifier le RTL après bascule.
- **WOPI** (`wopi/$id`) : iframe vers l'éditeur Office — vérifier que l'URL/route et le token marchent en SPA.
- **SDK embarqué** : le picker communique par `sdk-relay/events` + postMessage ; tester l'embed dans `sdk-consumer` après migration.
- **pdfjs-dist** : géré par `transpilePackages` chez Next ; sous Vite, config `optimizeDeps`/worker. (Previewers retirés en grande partie — surface réduite.)
- **Export statique → nginx** : passer d'un multi-HTML (Next export) à un SPA single-`index.html` avec fallback — **modif conf de déploiement obligatoire**.
- **Env build-time** : `import.meta.env.VITE_*` est figé au build (comme `NEXT_PUBLIC_`), mais le nom et le préfixe changent partout où c'est lu.
- **Cunningham + Tailwind sous Vite** : SCSS via `sass` (présent) ; Tailwind via le `postcss.config.js` déjà en place — Vite le lit nativement. À revalider.
- **Tokens générés** : `cunningham build-theme` reste identique (indépendant du framework).

---

## 5. Effort & risques

- **Effort** : élevé. ~19 fichiers de navigation + 13 routes + build/env/SDK/e2e/déploiement. Plusieurs sessions.
- **Risque** : élevé tant que la bascule n'est pas finie ; **mitigé** par la branche dédiée (Next reste fonctionnel) et la migration par lots vérifiés.
- **Bénéfice utilisateur** : nul à court terme (l'app marche déjà). Bénéfices techniques éventuels : DX routeur typé, build Vite plus rapide, cohérence avec l'app Google TV (déjà Vite). **Coût** : perte du suivi upstream.

---

## 6. Recommandation

1. **Acter Router+Vite (SPA)** plutôt que Start full-SSR (sauf besoin futur de SSR explicite).
2. Commiter l'Étape 0.5, brancher, puis exécuter Phase 1→5 par lots vérifiés.
3. Geler tout autre chantier UI pendant la migration (éviter les conflits).
4. Réévaluer après Phase 1+2 : si l'échafaudage + providers passent proprement, le reste est mécanique ; sinon, réversibilité encore possible (la branche Next d'origine reste intacte).
