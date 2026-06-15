import { useAuth } from "@/features/auth/Auth";
import {
  GlobalExplorerProvider,
  NavigationEvent,
  useGlobalExplorer,
} from "@/features/explorer/components/GlobalExplorerContext";
import { ExplorerRightPanelContent } from "@/features/explorer/components/right-panel/ExplorerRightPanelContent";
import { GlobalLayout } from "../global/GlobalLayout";
import { useRouter } from "next/router";
import { useSyncUserLanguage } from "../../hooks/useSyncUserLanguage";
import { Item } from "@/features/drivers/types";
import { ReleaseNoteAuto } from "@/features/ui/components/release-note";
import { setManualNavigationItemId } from "@/features/explorer/utils/utils";
import { ColumnPreferencesProvider } from "@/features/explorer/hooks/useColumnPreferences";
import { EntitlementDisclaimers } from "@/features/entitlement-disclaimers/EntitlementDisclaimers";
import { DsExplorerShell } from "./DsExplorerShell";
import { DsExplorerHeader } from "./DsExplorerHeader";

export const getGlobalExplorerLayout = (page: React.ReactElement) => {
  return <GlobalExplorerLayout>{page}</GlobalExplorerLayout>;
};

export const GlobalExplorerLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <GlobalLayout>
      <ColumnPreferencesProvider>
        <ReleaseNoteAuto />
        <EntitlementDisclaimers />
        <ExplorerLayout>{children}</ExplorerLayout>
      </ColumnPreferencesProvider>
    </GlobalLayout>
  );
};

/**
 * This layout is used for the explorer page.
 * It is used to display the explorer tree and the header.
 */
export const ExplorerLayout = ({
  children,
}: {
  children: React.ReactNode;
  isMinimalLayout?: boolean;
}) => {
  const router = useRouter();

  const isMinimalLayout = router.query.minimal === "true";
  const itemId = router.query.id as string;
  const onNavigate = (e: NavigationEvent) => {
    // Only keep "minimal" in the query string so that when navigating, to keep the minimal layout on the next page
    // the minimal layout state is preserved; all other query params are dropped intentionally.
    const { minimal } = router.query;
    const item = e.item as Item;
    const query = minimal ? { minimal } : {};
    // If the itemId is a favorite item, we need to get the favorite items. cf onLoadChildren in GlobalExplorerProvider.tsx
    const id = item.originalId ?? item.id;
    setManualNavigationItemId(id);
    router.push({ pathname: `/explorer/items/${id}`, query });
  };

  useSyncUserLanguage();

  return (
    <GlobalExplorerProvider
      itemId={itemId}
      displayMode="app"
      onNavigate={onNavigate}
    >
      <ExplorerPanelsLayout isMinimalLayout={isMinimalLayout}>
        {children}
      </ExplorerPanelsLayout>
    </GlobalExplorerProvider>
  );
};

// Coquille de l'explorateur — Design System (AppShell shadcn). Le chemin
// MainLayout/ui-kit (non-DS) a été retiré (dépose totale) : la coquille DS est
// désormais l'unique rendu.
export const ExplorerPanelsLayout = ({
  children,
  isMinimalLayout,
}: {
  children: React.ReactNode;
  isMinimalLayout?: boolean;
}) => {
  const {
    rightPanelOpen,
    item,
    rightPanelForcedItem: rightPanelItem,
  } = useGlobalExplorer();

  const { user } = useAuth();

  const rightPanelContent = <ExplorerRightPanelContent item={rightPanelItem} />;
  const hideLeftPanelOnDesktop = !user || isMinimalLayout;

  return (
    <DsExplorerShell
      header={
        <DsExplorerHeader displaySearch={isMinimalLayout} currentItem={item} />
      }
      rightPanelContent={rightPanelContent}
      rightPanelIsOpen={rightPanelOpen}
      hideLeftPanelOnDesktop={hideLeftPanelOnDesktop}
    >
      {children}
    </DsExplorerShell>
  );
};
