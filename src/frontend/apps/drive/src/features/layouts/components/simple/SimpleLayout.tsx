import { GlobalLayout } from "../global/GlobalLayout";
import { HeaderRight } from "../header/Header";
import { Toaster } from "@/features/ui/components/toaster/Toaster";

export const getSimpleLayout = (page: React.ReactElement) => {
  return <SimpleLayout>{page}</SimpleLayout>;
};

/**
 * Layout des pages simples (header + contexte d'auth) — Design System.
 * Le MainLayout/ui-kit (panneau gauche masqué sur desktop) a été remplacé par
 * une coquille DS minimale : en-tête + contenu.
 */
export const SimpleLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <GlobalLayout>
      <div className="flex min-h-dvh flex-col bg-background text-foreground">
        <header className="sahla-ds flex h-14 shrink-0 items-center justify-end gap-2 border-b border-solid border-border px-4">
          <HeaderRight />
        </header>
        <main className="flex-1">{children}</main>
        <Toaster />
      </div>
    </GlobalLayout>
  );
};
