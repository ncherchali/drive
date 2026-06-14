// En-tête Design System de l'explorateur (remplace HeaderIcon + HeaderRight
// quand le flag DS_APP_SHELL est actif). Marque Sahla, recherche, menu
// utilisateur DS — SANS la « gaufre » DINUM.
//
// Depuis la phase 7, le déclencheur de recherche est lui aussi DS
// (ExplorerSearchButtonDs) : tout l'en-tête peut donc porter `.sahla-ds`. La
// modale de recherche ouverte par ce bouton reste Cunningham, mais elle est
// portalée hors de l'en-tête, donc non affectée par le reset scopé.
import { useMemo } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { UserMenu } from "@/components/layout/user-menu";
import { useAuth, logout } from "@/features/auth/Auth";
import { ExplorerSearchButtonDs } from "@/features/explorer/components/app-view/ExplorerSearchButtonDs";
import { Item } from "@/features/drivers/types";
import { ItemFilters } from "@/features/drivers/Driver";
import { useIsMinimalLayout } from "@/utils/useLayout";

export function DsExplorerHeader({
  displaySearch,
  currentItem,
}: {
  displaySearch?: boolean;
  currentItem?: Item;
}) {
  const { user } = useAuth();
  const isMinimalLayout = useIsMinimalLayout();

  const defaultFilters: ItemFilters = useMemo(() => {
    const workspaceId = currentItem?.parents?.[0]?.id ?? currentItem?.id;
    if (isMinimalLayout) {
      return { workspace: workspaceId };
    }
    return {};
  }, [currentItem, isMinimalLayout]);

  return (
    <AppHeader className="sahla-ds">
      {/* Marque Sahla (DS) */}
      <div className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
          S
        </div>
        <span className="hidden text-sm font-semibold text-foreground sm:inline">
          Sahla
        </span>
      </div>

      {/* Actions à droite */}
      <div className="ms-auto flex items-center gap-2">
        {user && displaySearch && (
          <ExplorerSearchButtonDs defaultFilters={defaultFilters} />
        )}
        {user && <UserMenu name={user.email} onLogout={logout} />}
      </div>
    </AppHeader>
  );
}
