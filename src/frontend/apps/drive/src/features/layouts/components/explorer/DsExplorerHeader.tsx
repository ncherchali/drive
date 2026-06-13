// En-tête Design System de l'explorateur (remplace HeaderIcon + HeaderRight
// quand le flag DS_APP_SHELL est actif). Marque Sahla, recherche, menu
// utilisateur DS — SANS la « gaufre » DINUM.
//
// Le `.sahla-ds` est scopé aux SEULES pièces DS (marque, menu utilisateur) ;
// le bouton de recherche reste Cunningham (ouvre la modale search composite) et
// n'est donc pas enveloppé, pour ne pas casser son style.
import { useMemo } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { UserMenu } from "@/components/layout/user-menu";
import { useAuth, logout } from "@/features/auth/Auth";
import { ExplorerSearchButton } from "@/features/explorer/components/app-view/ExplorerSearchButton";
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
    <AppHeader>
      {/* Marque Sahla (DS) */}
      <div className="sahla-ds flex items-center gap-2">
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
          <ExplorerSearchButton defaultFilters={defaultFilters} />
        )}
        {user && (
          <span className="sahla-ds inline-flex items-center">
            <UserMenu name={user.email} onLogout={logout} />
          </span>
        )}
      </div>
    </AppHeader>
  );
}
