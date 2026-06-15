import { Button as DsButton } from "@/components/ui/button";
import { useModal } from "@/components/use-modal";
import { ExplorerSearchModalDs } from "@/features/explorer/components/modals/search/ExplorerSearchModalDs";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { Search } from "lucide-react";
import { ItemFilters } from "@/features/drivers/Driver";
export const ExplorerSearchButton = ({
  keyboardShortcut,
  defaultFilters,
}: {
  keyboardShortcut?: boolean;
  defaultFilters?: ItemFilters;
}) => {
  const searchModal = useModal();
  const { t } = useTranslation();

  // Toggle the menu when ⌘K is pressed
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
      <ExplorerSearchModalDs {...searchModal} defaultFilters={defaultFilters} />

      <DsButton
        variant="ghost"
        size="icon"
        aria-label={t("explorer.tree.search")}
        onClick={searchModal.open}
      >
        <Search className="size-4" />
      </DsButton>
    </>
  );
};
