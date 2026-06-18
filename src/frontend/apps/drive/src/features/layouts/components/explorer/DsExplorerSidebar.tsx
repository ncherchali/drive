// Sidebar de l'explorateur portée sur le composant shadcn (Sidebar/Radix).
// Remplace le conteneur + la nav historiques quand le flag DS_APP_SHELL est actif.
//
// Périmètre : nav PLATE (routes par défaut + « Espaces » + Corbeille) en
// `SidebarMenu`. L'arbre de dossiers (vide en mode DS) a été retiré : les espaces
// passent par le lien « Espaces » (vue centrale /explorer/spaces) et les tuiles.
// Mode `offcanvas`. Largeur RÉGLABLE par une poignée de redimensionnement.
//
// Pied : profil utilisateur (avatar + menu) avec Paramètres + Déconnexion.
import * as React from "react";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import { Plus, Settings, Shield, Trash2 } from "lucide-react";
import { useDropdownMenu } from "@/components/ds-menu";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Icon as DsIcon } from "@/components/ui/icon";
import { MenuDropdown } from "@/components/ds-menu";
import { UserMenu } from "@/components/layout/user-menu";
import { cn } from "@/utils/cn";
import { ExplorerCreateWorkspaceModal } from "@/features/explorer/components/modals/ExplorerCreateWorkspaceModal";
import { DsSettingsDialog } from "./DsSettingsDialog";
import {
  DS_ROUTE_ICONS,
  ORDERED_DEFAULT_ROUTES,
  TRASH_ROUTE_DATA,
} from "@/utils/defaultRoutes";
import { useFirstLevelItems } from "@/features/explorer/hooks/useQueries";
import { useCreateMenuItems } from "@/features/explorer/hooks/useCreateMenuItems";
import { itemIsWorkspace } from "@/features/drivers/utils";
import { ItemIcon } from "@/features/explorer/components/icons/ItemIcon";
import { IconSize } from "@/features/ui/components/icon/Icon";
import { useGlobalExplorer } from "@/features/explorer/components/GlobalExplorerContext";
import { useAuth, logout } from "@/features/auth/Auth";

const MIN_W = 220;
const MAX_W = 460;
const SPACES_ROUTE = "/explorer/spaces";

export function DsExplorerSidebar({
  onResize,
}: {
  onResize?: (width: string) => void;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const { itemId } = useGlobalExplorer();
  const { user } = useAuth();
  const { data: firstLevelItems } = useFirstLevelItems();
  const [createSpaceOpen, setCreateSpaceOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const workspaces = useMemo(
    () => firstLevelItems?.filter(itemIsWorkspace) ?? [],
    [firstLevelItems],
  );

  const currentPath = router.asPath.split("?")[0];
  const navigate = (route: string) => {
    router.push(route);
    setOpenMobile(false);
  };

  // Toutes les routes par défaut, Favoris INCLUS : en mode DS, le nœud Favoris
  // n'est plus injecté dans l'arbre → il vit ici, aligné avec les autres entrées.
  const navRoutes = ORDERED_DEFAULT_ROUTES;

  return (
    <Sidebar collapsible="offcanvas" className="border-sidebar-border">
      <SidebarHeader>
        <div className="flex items-center justify-between gap-2 px-1 py-1">
          <div className="flex items-center gap-2">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
              S
            </div>
            <span className="text-sm font-semibold text-sidebar-foreground">
              Sahla
            </span>
          </div>
          <SidebarTrigger className="text-sidebar-foreground/70" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* CTA primaire : + Nouveau. */}
        <SidebarGroup className="pb-1">
          <DsCreateButton />
        </SidebarGroup>

        {/* Navigation principale (routes par défaut + Espaces + Corbeille). */}
        <SidebarGroup className="py-1">
          <SidebarMenu>
            {navRoutes.map((route) => (
              <SidebarMenuItem key={route.id}>
                <SidebarMenuButton
                  isActive={currentPath === route.route}
                  tooltip={t(route.label)}
                  onClick={() => navigate(route.route)}
                >
                  <DsIcon icon={DS_ROUTE_ICONS[route.id]} size="small" />
                  <span>{t(route.label)}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={currentPath === TRASH_ROUTE_DATA.route}
                tooltip={t("explorer.tree.trash")}
                onClick={() => navigate(TRASH_ROUTE_DATA.route)}
              >
                <DsIcon icon={Trash2} size="small" />
                <span>{t("explorer.tree.trash")}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Trait de séparation à marges (pas bord-à-bord) entre la nav et les
            espaces. */}
        <SidebarSeparator />

        {/* Espaces : titre = LIEN vers la vue centrale des espaces ; action « + »
            pour en créer ; tuiles teintées d'accès rapide. */}
        <SidebarGroup>
          <button
            type="button"
            onClick={() => navigate(SPACES_ROUTE)}
            className={cn(
              "flex h-7 w-full items-center rounded-md px-2 text-xs font-medium outline-none ring-sidebar-ring transition hover:text-sidebar-foreground focus-visible:ring-2",
              currentPath === SPACES_ROUTE
                ? "text-sidebar-foreground"
                : "text-sidebar-foreground/70",
            )}
          >
            {t("explorer.tree.workspaces.title")}
          </button>
          <SidebarGroupAction
            title={t(
              "explorer.actions.createWorkspace.modal.title",
              "Créer un espace",
            )}
            onClick={() => setCreateSpaceOpen(true)}
          >
            <Plus />
            <span className="sr-only">
              {t(
                "explorer.actions.createWorkspace.modal.title",
                "Créer un espace",
              )}
            </span>
          </SidebarGroupAction>
          {workspaces.length > 0 && (
            <SidebarGroupContent>
              <SidebarMenu>
                {workspaces.map((workspace) => (
                  <SidebarMenuItem key={workspace.id}>
                    <SidebarMenuButton
                      isActive={itemId === workspace.id}
                      tooltip={workspace.title}
                      onClick={() =>
                        navigate(`/explorer/items/${workspace.id}`)
                      }
                    >
                      <ItemIcon item={workspace} size={IconSize.SMALL} />
                      <span>{workspace.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          )}
        </SidebarGroup>
      </SidebarContent>

      {/* Pied : profil utilisateur (avatar + menu Paramètres / Déconnexion). */}
      <SidebarFooter>
        {user && (
          <div className="flex items-center gap-2 px-1 py-1">
            <UserMenu name={user.email} onLogout={logout}>
              {user.is_staff && (
                <DropdownMenuItem
                  onSelect={() => router.push("/admin/content-types")}
                >
                  <Shield />
                  {t("admin.content_types.menu", "Administration")}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onSelect={() => setSettingsOpen(true)}>
                <Settings />
                {t("settings.title", "Paramètres")}
              </DropdownMenuItem>
            </UserMenu>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-sidebar-foreground">
              {user.email}
            </span>
          </div>
        )}
      </SidebarFooter>

      {onResize && <SidebarResizeHandle onResize={onResize} />}

      <ExplorerCreateWorkspaceModal
        isOpen={createSpaceOpen}
        onClose={() => setCreateSpaceOpen(false)}
        redirectAfterCreate
      />
      <DsSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </Sidebar>
  );
}

/** Bouton « + Nouveau » : CTA primaire DS ouvrant le menu de création
 *  (dossier / espace / fichier / import) — pont data-driven ds-menu. */
function DsCreateButton() {
  const { t } = useTranslation();
  const { treeIsInitialized } = useGlobalExplorer();
  const createMenu = useDropdownMenu();
  const { menuItems, modals } = useCreateMenuItems();

  if (!treeIsInitialized) {
    return null;
  }

  return (
    <>
      <MenuDropdown
        options={menuItems}
        {...createMenu}
        onOpenChange={createMenu.setIsOpen}
      >
        <Button
          size="lg"
          className="w-fit gap-2 self-start px-4 shadow-sm"
          onClick={() => createMenu.setIsOpen(true)}
        >
          <Plus className="size-4" />
          {t("explorer.tree.create.label")}
        </Button>
      </MenuDropdown>
      {modals}
    </>
  );
}

/** Poignée de redimensionnement sur le bord droit de la sidebar (drag → largeur,
 *  clampée). Masquée quand la sidebar est repliée (offcanvas). */
function SidebarResizeHandle({
  onResize,
}: {
  onResize: (width: string) => void;
}) {
  const { state, isMobile } = useSidebar();
  if (state === "collapsed" || isMobile) {
    return null;
  }
  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const move = (ev: PointerEvent) => {
      const px = Math.min(MAX_W, Math.max(MIN_W, ev.clientX));
      onResize(`${px}px`);
    };
    const up = () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up);
  };
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Redimensionner la barre latérale"
      onPointerDown={onPointerDown}
      className="fixed inset-y-0 z-20 hidden w-1.5 -translate-x-1/2 cursor-col-resize transition-colors hover:bg-sidebar-border md:block"
      style={{ left: "var(--sidebar-width)" }}
    />
  );
}
