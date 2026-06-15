// Coquille d'application Design System pour l'explorateur — sidebar portée sur
// le composant shadcn (Sidebar/Radix), en-tête DS, panneau de méta. Activée
// derrière le flag DS_APP_SHELL (cf. ExplorerPanelsLayout).
//
// IMPORTANT : on n'enveloppe PAS le contenu dans `.sahla-ds`. La sidebar héberge
// du Cunningham (ExplorerTreeActions, ExplorerFolderTree) ; le reset scopé
// casserait leurs boutons (spécificité). Les tokens DS vivent sur :root, donc
// les couleurs marchent sans le reset ; les bordures des primitives sidebar sont
// forcées `solid` via ds-explorer-grid.css (preflight global off).
import * as React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { MetaPanel } from "@/components/layout/app-shell";
import { DsExplorerSidebar } from "./DsExplorerSidebar";

export interface DsExplorerShellProps {
  children: React.ReactNode;
  /** Contenu d'en-tête (typiquement <DsExplorerHeader />). */
  header: React.ReactNode;
  rightPanelContent: React.ReactNode;
  rightPanelIsOpen?: boolean;
  hideLeftPanelOnDesktop?: boolean;
}

const SIDEBAR_WIDTH_KEY = "sahla_sidebar_w";
const DEFAULT_SIDEBAR_WIDTH = "280px";

export function DsExplorerShell({
  children,
  header,
  rightPanelContent,
  rightPanelIsOpen = false,
  hideLeftPanelOnDesktop = false,
}: DsExplorerShellProps) {
  // Largeur de sidebar réglable (poignée de redimensionnement), persistée.
  const [sidebarWidth, setSidebarWidth] = React.useState(DEFAULT_SIDEBAR_WIDTH);
  React.useEffect(() => {
    const saved = window.localStorage.getItem(SIDEBAR_WIDTH_KEY);
    if (saved) setSidebarWidth(saved);
  }, []);
  const handleResize = React.useCallback((width: string) => {
    setSidebarWidth(width);
    window.localStorage.setItem(SIDEBAR_WIDTH_KEY, width);
  }, []);

  return (
    <div className="sahla-ds-grid h-dvh w-full bg-background text-foreground">
      <SidebarProvider
        className="h-full min-h-0"
        style={{ "--sidebar-width": sidebarWidth } as React.CSSProperties}
      >
        {!hideLeftPanelOnDesktop && (
          <DsExplorerSidebar onResize={handleResize} />
        )}
        <SidebarInset className="min-w-0">
          {header}
          <div className="flex min-h-0 flex-1">
            <main className="min-w-0 flex-1 overflow-auto">{children}</main>
            {rightPanelIsOpen ? (
              <MetaPanel>{rightPanelContent}</MetaPanel>
            ) : undefined}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
