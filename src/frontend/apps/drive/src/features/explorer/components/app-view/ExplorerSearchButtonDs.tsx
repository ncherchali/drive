// Déclencheur de recherche DS — variante Design System d'ExplorerSearchButton.
// Pages Router : pas de "use client".
//
// Rend un bouton DS (loupe lucide) qui ouvre la palette de recherche DS
// (ExplorerSearchModalDs, palette `command`). Depuis la phase 8b, les filtres
// étant DS, la palette est intégralement DS.
import { useEffect } from "react";
import { useModal } from "@gouvfr-lasuite/cunningham-react";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ExplorerSearchModalDs } from "@/features/explorer/components/modals/search/ExplorerSearchModalDs";
import { ItemFilters } from "@/features/drivers/Driver";

export const ExplorerSearchButtonDs = ({
  keyboardShortcut,
  defaultFilters,
}: {
  keyboardShortcut?: boolean;
  defaultFilters?: ItemFilters;
}) => {
  const searchModal = useModal();
  const { t } = useTranslation();

  // Ouvre la recherche au raccourci ⌘K / Ctrl+K.
  useEffect(() => {
    if (!keyboardShortcut) {
      return;
    }
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        searchModal.open();
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [keyboardShortcut]);

  return (
    <>
      <ExplorerSearchModalDs
        isOpen={searchModal.isOpen}
        onClose={searchModal.onClose}
        defaultFilters={defaultFilters}
      />
      <Button
        variant="ghost"
        size="icon"
        aria-label={t("explorer.tree.search")}
        onClick={searchModal.open}
      >
        <Search />
      </Button>
    </>
  );
};
