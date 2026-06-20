// Coquille de la console d'administration : sidebar DS persistante + en-tête.
// Pages Router : `Page.getLayout = getAdminLayout`. Le wrapper `.sahla-ds-grid`
// applique le style des primitives sidebar/table (cf. ds-explorer-grid.css),
// comme la coquille de l'explorateur.
import * as React from "react";
import { GlobalLayout } from "@/features/layouts/components/global/GlobalLayout";
import { Toaster } from "@/features/ui/components/toaster/Toaster";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";

export const getAdminLayout = (page: React.ReactElement) => {
  return <AdminLayout>{page}</AdminLayout>;
};

export const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <GlobalLayout>
      <div className="sahla-ds-grid h-dvh w-full bg-background text-foreground">
        <SidebarProvider className="h-full min-h-0">
          <AdminSidebar />
          <SidebarInset className="min-w-0">
            <header className="flex h-14 shrink-0 items-center gap-2 border-b border-solid border-border px-4">
              <SidebarTrigger className="text-foreground/70" />
              <span className="text-sm font-medium text-muted-foreground">
                Administration
              </span>
            </header>
            <main className="min-h-0 flex-1 overflow-auto">{children}</main>
          </SidebarInset>
        </SidebarProvider>
        <Toaster />
      </div>
    </GlobalLayout>
  );
};
