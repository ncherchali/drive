import { MenuDropdown, useDropdownMenu } from "@/components/ds-menu";
import { useGlobalExplorer } from "@/features/explorer/components/GlobalExplorerContext";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ExplorerSearchButton } from "@/features/explorer/components/app-view/ExplorerSearchButton";
import { useCreateMenuItems } from "../../hooks/useCreateMenuItems";

export const ExplorerTreeActions = () => {
  const { t } = useTranslation();
  const { treeIsInitialized } = useGlobalExplorer();

  const createMenu = useDropdownMenu();

  const { menuItems, modals } = useCreateMenuItems();

  if (!treeIsInitialized) {
    return null;
  }
  return (
    <>
      <div className="explorer__tree__actions">
        <div className="explorer__tree__actions__left">
          <MenuDropdown
            options={menuItems}
            {...createMenu}
            onOpenChange={createMenu.setIsOpen}
          >
            <Button onClick={() => createMenu.setIsOpen(true)}>
              <Plus className="size-4" />
              {t("explorer.tree.create.label")}
            </Button>
          </MenuDropdown>
        </div>
        <ExplorerSearchButton keyboardShortcut />
      </div>
      {modals}
    </>
  );
};
