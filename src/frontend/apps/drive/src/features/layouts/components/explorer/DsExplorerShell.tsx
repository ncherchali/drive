// Coquille d'application Design System pour l'explorateur — équivalent du
// MainLayout ui-kit, mappé sur l'AppShell DS. Activée derrière le flag
// DS_APP_SHELL (cf. ExplorerPanelsLayout).
//
// IMPORTANT : on n'enveloppe PAS le contenu dans `.sahla-ds`. Les slots
// hébergent encore du Cunningham (ExplorerTree, HeaderRight…) ; le reset scopé
// casserait leurs boutons (spécificité). Les primitives de layout sont
// auto-suffisantes (border-solid/box-border) et les tokens DS vivent sur :root,
// donc tout s'affiche sans le reset.
import * as React from "react";
import { AppShell, MetaPanel } from "@/components/layout/app-shell";
import { Sidebar } from "@/components/layout/sidebar";
import { AppHeader } from "@/components/layout/app-header";

export interface DsExplorerShellProps {
  children: React.ReactNode;
  leftPanelContent: React.ReactNode;
  rightPanelContent: React.ReactNode;
  rightPanelIsOpen?: boolean;
  hideLeftPanelOnDesktop?: boolean;
  icon?: React.ReactNode;
  rightHeaderContent?: React.ReactNode;
}

export function DsExplorerShell({
  children,
  leftPanelContent,
  rightPanelContent,
  rightPanelIsOpen = false,
  hideLeftPanelOnDesktop = false,
  icon,
  rightHeaderContent,
}: DsExplorerShellProps) {
  return (
    <div className="h-dvh w-full bg-background text-foreground">
      <AppShell
        sidebar={
          hideLeftPanelOnDesktop ? undefined : (
            <Sidebar className="hidden md:flex">{leftPanelContent}</Sidebar>
          )
        }
        header={
          <AppHeader>
            {icon}
            <div className="ms-auto flex min-w-0 items-center gap-2">
              {rightHeaderContent}
            </div>
          </AppHeader>
        }
        metaPanel={
          rightPanelIsOpen ? (
            <MetaPanel>{rightPanelContent}</MetaPanel>
          ) : undefined
        }
      >
        {children}
      </AppShell>
    </div>
  );
}
