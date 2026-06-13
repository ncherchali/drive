// Primitives de layout DS — barre latérale de l'explorateur EFSS.
// Sobre, enterprise, SANS sélecteur d'apps « gaufre » DINUM. Largeur pilotée par
// le token `--spacing-sidebar` (w-sidebar). RTL-aware (border-e logique).
// Auto-suffisant (border-solid + box-border) : fonctionne SANS le reset
// `.sahla-ds`, pour pouvoir héberger du contenu Cunningham sans l'altérer.
// Pages Router : pas de "use client".
import * as React from "react";
import { cn } from "@/utils/cn";

function Sidebar({ className, ...props }: React.ComponentProps<"aside">) {
  return (
    <aside
      data-slot="sidebar"
      className={cn(
        "box-border flex h-full w-sidebar shrink-0 flex-col border-e border-solid border-sidebar-border bg-sidebar text-sidebar-foreground",
        className,
      )}
      {...props}
    />
  );
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      className={cn("flex h-14 items-center gap-2 px-4", className)}
      {...props}
    />
  );
}

function SidebarNav({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      data-slot="sidebar-nav"
      className={cn("flex flex-1 flex-col gap-1 overflow-auto px-2 py-2", className)}
      {...props}
    />
  );
}

function SidebarNavItem({
  className,
  active = false,
  ...props
}: React.ComponentProps<"button"> & { active?: boolean }) {
  return (
    <button
      type="button"
      data-slot="sidebar-nav-item"
      data-active={active}
      className={cn(
        "flex appearance-none items-center gap-3 rounded-md border-0 bg-transparent px-3 py-2 text-sm font-medium outline-none transition-colors",
        "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
        "focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
        "[&_svg]:size-4 [&_svg]:shrink-0",
        className,
      )}
      {...props}
    />
  );
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      className={cn("mt-auto flex flex-col gap-1 px-2 py-3", className)}
      {...props}
    />
  );
}

export { Sidebar, SidebarHeader, SidebarNav, SidebarNavItem, SidebarFooter };
