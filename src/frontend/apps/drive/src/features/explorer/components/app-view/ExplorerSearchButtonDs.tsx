// Déclencheur de recherche DS — variante Design System d'ExplorerSearchButton.
// Pages Router : pas de "use client".
//
// Rend un bouton DS (loupe lucide) qui ouvre la modale de recherche existante.
// La modale (ExplorerSearchModal, Cunningham) est portalée hors du header par
// react-aria : elle reste donc stylée Cunningham même si ce bouton vit sous
// `.sahla-ds`. La réécriture de la modale en palette `command` est planifiée
// APRÈS la migration DS des filtres (cf. docs/ds-migration-plan.md, phase 8) —
// envelopper des filtres Cunningham dans `.sahla-ds` casserait leur style.
import { useEffect } from "react";
import { useModal } from "@gouvfr-lasuite/cunningham-react";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ExplorerSearchModal } from "@/features/explorer/components/modals/search/ExplorerSearchModal";
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
      <ExplorerSearchModal {...searchModal} defaultFilters={defaultFilters} />
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
