// Primitive de layout DS — coquille applicative de l'explorateur EFSS.
// Régions : sidebar (w-sidebar) · en-tête · contenu principal · panneau de méta
// (w-meta-panel). Remplace l'agencement ui-kit (MainLayout) côté DS, sans
// branding DINUM. RTL-aware (bordure logique border-s sur le meta-panel).
import * as React from "react";
import { cn } from "@/utils/cn";

interface AppShellProps extends React.ComponentProps<"div"> {
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  metaPanel?: React.ReactNode;
}

function AppShell({
  sidebar,
  header,
  metaPanel,
  className,
  children,
  ...props
}: AppShellProps) {
  return (
    <div
      data-slot="app-shell"
      className={cn("flex h-full min-h-0 w-full bg-background", className)}
      {...props}
    >
      {sidebar}
      <div className="flex min-w-0 flex-1 flex-col">
        {header}
        <div className="flex min-h-0 flex-1">
          <main className="min-w-0 flex-1 overflow-auto">{children}</main>
          {metaPanel}
        </div>
      </div>
    </div>
  );
}

function MetaPanel({ className, ...props }: React.ComponentProps<"aside">) {
  return (
    <aside
      data-slot="meta-panel"
      className={cn(
        "hidden w-meta-panel shrink-0 overflow-auto border-s border-border bg-card lg:block",
        className,
      )}
      {...props}
    />
  );
}

export { AppShell, MetaPanel };
