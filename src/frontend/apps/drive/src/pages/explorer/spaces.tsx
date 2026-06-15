import WorkspacesExplorer from "@/features/explorer/components/workspaces-explorer/WorkspacesExplorer";
import { getGlobalExplorerLayout } from "@/features/layouts/components/explorer/ExplorerLayout";

// Vue « Espaces » : liste les espaces (items de premier niveau) dans la grille
// centrale. Ouverte depuis le lien « Espaces » de la sidebar.
export default function SpacesPage() {
  return <WorkspacesExplorer defaultFilters={{}} />;
}

SpacesPage.getLayout = getGlobalExplorerLayout;
