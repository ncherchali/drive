import { Button as DsButton } from "@/components/ui/button";
import { useModal } from "@/components/use-modal";
import { ArrowRight, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useGlobalExplorer } from "@/features/explorer/components/GlobalExplorerContext";
import {
  useSelectedItems,
  useSetSelectedItems,
} from "@/features/explorer/stores/selectionStore";
import { useAppExplorer } from "@/features/explorer/components/app-view/AppExplorer";
import { addToast } from "@/features/ui/components/toaster/Toaster";
import { ToasterItem } from "@/features/ui/components/toaster/Toaster";
import { useMutationDeleteItems } from "@/features/explorer/hooks/useMutations";
import { useEffect } from "react";
import { ExplorerMoveFolder } from "@/features/explorer/components/modals/move/ExplorerMoveFolderModal";

export const ExplorerSelectionBar = () => {
  const { t } = useTranslation();
  const { setRightPanelForcedItem } = useGlobalExplorer();
  const selectedItems = useSelectedItems();
  const setSelectedItems = useSetSelectedItems();
  const { selectionBarActions } = useAppExplorer();

  const handleClearSelection = () => {
    setSelectedItems([]);
    setRightPanelForcedItem(undefined);
  };

  return (
    <div className="explorer__selection-bar">
      <div className="explorer__selection-bar__left">
        <div className="explorer__selection-bar__caption">
          {t("explorer.selectionBar.caption", {
            count: selectedItems.length,
          })}
        </div>
        <div className="explorer__selection-bar__actions">
          {selectionBarActions ? (
            selectionBarActions
          ) : (
            <ExplorerSelectionBarActions />
          )}
        </div>
      </div>
      <div className="explorer__selection-bar__actions">
        <DsButton
          onClick={handleClearSelection}
          variant="ghost"
          size="icon"
          aria-label={t("explorer.selectionBar.reset_selection")}
        >
          <X className="size-4" />
        </DsButton>
      </div>
    </div>
  );
};

export const ExplorerSelectionBarActions = () => {
  const { t } = useTranslation();
  const { item, cancelUploadsForDeletedItems } = useGlobalExplorer();
  const selectedItems = useSelectedItems();
  const setSelectedItems = useSetSelectedItems();
  const moveModal = useModal();

  const deleteItems = useMutationDeleteItems();

  const handleDelete = async () => {
    let canDelete = true;
    for (const item of selectedItems) {
      if (!item.abilities?.destroy) {
        canDelete = false;
      }
    }
    if (canDelete) {
      addToast(
        <ToasterItem>
          <Trash2 className="size-4" />
          <span>
            {t("explorer.actions.delete.toast", {
              count: selectedItems.length,
            })}
          </span>
        </ToasterItem>,
      );
      const deletedIds = selectedItems.map((item) => item.id);
      setSelectedItems([]);
      await deleteItems.mutateAsync(deletedIds);
      cancelUploadsForDeletedItems(deletedIds);
    } else {
      addToast(
        <ToasterItem type="error">
          <Trash2 className="size-4" />
          <span>{t("explorer.actions.delete.low_rights_toast")}</span>
        </ToasterItem>,
      );
    }
  };

  // Add event listener when component mounts and remove when unmounts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Backspace") {
        event.preventDefault();
        handleDelete();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedItems]);

  return (
    <>
      {/* <Button
        onClick={handleClearSelection}
        icon={<span className="material-icons">download</span>}
        variant="tertiary"
        size="small"
        aria-label={t("explorer.selectionBar.download")}
      /> */}
      <DsButton
        onClick={handleDelete}
        variant="ghost"
        size="icon"
        aria-label={t("explorer.selectionBar.delete")}
      >
        <Trash2 className="size-4" />
      </DsButton>
      <DsButton
        onClick={moveModal.open}
        variant="ghost"
        size="icon"
        aria-label={t("explorer.selectionBar.move")}
      >
        <ArrowRight className="size-4" />
      </DsButton>

      {moveModal.isOpen && (
        <ExplorerMoveFolder
          {...moveModal}
          itemsToMove={selectedItems}
          initialFolderId={item?.id}
        />
      )}
    </>
  );
};
