// Modale de déplacement — Design System (Dialog DS). Réutilise toute la logique
// métier (EmbeddedExplorer compact comme sélecteur de cible, mutation de
// déplacement, confirmation inter-espaces) ; le shell Cunningham (Modal +
// leftActions/rightActions) a été porté sur Dialog/DialogFooter et l'ui-kit
// (HorizontalSeparator/useResponsive) sur Separator DS / useIsMobile.
import { Item, ItemType, Role } from "@/features/drivers/types";
import { Button as DsButton } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useModal } from "@/components/use-modal";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/utils/cn";
import { FolderPlus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useTreeContext } from "@/components/tree";
import { Trans, useTranslation } from "react-i18next";
import { useMoveItems } from "@/features/explorer/api/useMoveItem";
import { addItemsMovedToast } from "../../toasts/addItemsMovedToast";
import { ExplorerTreeMoveConfirmationModal } from "../../tree/ExplorerTreeMoveConfirmationModal";
import { ExplorerCreateFolderModal } from "../ExplorerCreateFolderModal";
import {
  EmbeddedExplorer,
  useEmbeddedExplorer,
} from "@/features/explorer/components/embedded-explorer/EmbeddedExplorer";
import { useGlobalExplorer } from "../../GlobalExplorerContext";
import { useRef, useSyncExternalStore } from "react";
import { useItem } from "@/features/explorer/hooks/useQueries";

interface ExplorerMoveFolderProps {
  isOpen: boolean;
  onClose: () => void;
  initialFolderId?: string;
  itemsToMove: Item[];
}

export const ExplorerMoveFolder = ({
  isOpen,
  onClose,
  initialFolderId,
  itemsToMove,
}: ExplorerMoveFolderProps) => {
  const isMobile = useIsMobile();
  const isMoveToRoot = useRef(false);
  const { itemId: currentItemId } = useGlobalExplorer();
  const queryClient = useQueryClient();

  const { t } = useTranslation();
  const treeContext = useTreeContext<Item>();
  const moveItems = useMoveItems();

  const imOwner = itemsToMove.every((item) => {
    return item.user_role === Role.OWNER;
  });

  const showMoveToRootButton =
    imOwner && itemsToMove.every((item) => item.path.split(".").length > 1);

  const itemsExplorer = useEmbeddedExplorer({
    initialFolderId: initialFolderId,
    isCompact: true,
    gridProps: {
      enableMetaKeySelection: false,
      gridActionsCell: () => <div />,
      disableKeyboardNavigation: true,
    },
    itemsFilters: {
      type: ItemType.FOLDER,
    },
    itemsFilter: (items) => {
      const filteredItems = items.filter((itemFiltered) => {
        return !itemsToMove.some((i) => {
          return i.id === itemFiltered.id;
        });
      });

      return filteredItems;
    },
    breadcrumbsRight: () => (
      <DsButton
        variant="ghost"
        size="icon"
        aria-label={t("explorer.actions.createFolder.modal.title")}
        onClick={createFolderModal.open}
      >
        <FolderPlus className="size-4 text-primary" />
      </DsButton>
    ),
  });

  const moveConfirmationModal = useModal();
  const createFolderModal = useModal();

  // Subscribe to the embedded explorer's local selection store so the modal
  // reactively updates when the user picks a target folder inside it.
  const localSelectedItems = useSyncExternalStore(
    itemsExplorer.selectionStore.subscribe,
    itemsExplorer.selectionStore.getSelectedItems,
    itemsExplorer.selectionStore.getSelectedItems,
  );

  const { data: item } = useItem(itemsExplorer.currentItemId!, {
    enabled: !!itemsExplorer.currentItemId,
  });

  const onCloseModal = () => {
    onClose();
    itemsExplorer.selectionStore.clear();
  };

  const getMoveData = () => {
    const ids = itemsToMove.map((item) => item.id);
    const pathSegments = itemsToMove[0].path.split(".");
    const oldParentId = pathSegments[pathSegments.length - 2];
    const oldRootParentId = pathSegments[0];
    const selected = itemsExplorer.selectionStore.getSelectedItems();
    const newParentId =
      selected.length === 1
        ? selected[0].id
        : (itemsExplorer.currentItemId ?? undefined);
    const newParentItem = selected.length === 1 ? selected[0] : item;

    const newRootId = newParentItem?.path.split(".")[0];
    return {
      ids,
      oldParentId,
      oldRootParentId,
      newParentId,
      newRootId,
    };
  };
  const handleMove = (
    ids: string[],
    newParentId: string | undefined,
    oldParentId: string,
  ) => {
    moveItems.mutateAsync(
      {
        ids: ids,
        parentId: newParentId,
        oldParentId: oldParentId,
      },

      {
        onSettled() {
          isMoveToRoot.current = false;
        },
        onSuccess: () => {
          onCloseModal();
          addItemsMovedToast(ids.length);

          if (newParentId) {
            // update the tree
            let childrenCount =
              treeContext?.treeData.getNode(newParentId)?.children?.length ?? 0;

            ids.forEach((id) => {
              treeContext?.treeData.moveNode(id, newParentId, childrenCount);
              childrenCount++;
            });
          }

          // If the current item is moved, we invalidate the item and breadcrumb queries
          if (ids.includes(currentItemId)) {
            queryClient.invalidateQueries({
              queryKey: ["items", currentItemId],
            });
            queryClient.invalidateQueries({
              queryKey: ["breadcrumb", currentItemId],
            });
          }
        },
      },
    );
  };

  const onMove = () => {
    // If we are in the root, and no item is selected, we can't move
    if (
      itemsExplorer.currentItemId === null &&
      itemsExplorer.selectionStore.getSelectedItems().length === 0
    ) {
      return;
    }

    // If we are in a folder, and the item is not found, we can't move
    if (itemsExplorer.currentItemId && item === undefined) {
      return;
    }
    const data = getMoveData();
    if (data.newRootId !== data.oldRootParentId) {
      moveConfirmationModal.open();
      return;
    }

    handleMove(data.ids, data.newParentId, data.oldParentId);
  };

  const onMoveToRoot = () => {
    isMoveToRoot.current = true;
    moveConfirmationModal.open();
  };

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) onCloseModal();
        }}
      >
        <DialogContent
          aria-label={t("explorer.modal.move.aria_label")}
          className={cn(
            "gap-0 overflow-hidden p-0",
            isMobile
              ? "h-[100dvh] max-w-full rounded-none"
              : "max-w-2xl",
          )}
        >
          <DialogHeader className="px-4 pt-4">
            <DialogTitle>{t("explorer.modal.move.title")}</DialogTitle>
            <DialogDescription>
              <Trans
                i18nKey={
                  itemsToMove.length === 1
                    ? "explorer.modal.move.description_one_item"
                    : "explorer.modal.move.description_multiple_items"
                }
                values={{
                  count: itemsToMove.length,
                  name: itemsToMove[0].title,
                }}
              />
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="max-h-[55vh] overflow-y-auto px-4 py-2">
            <EmbeddedExplorer {...itemsExplorer} showSearch={true} />
          </div>
          <Separator />
          <DialogFooter className="px-4 py-3 sm:justify-between">
            <div>
              {showMoveToRootButton && (
                <DsButton variant="ghost" onClick={onMoveToRoot}>
                  {t("explorer.modal.move.move_to_root")}
                </DsButton>
              )}
            </div>
            <div className="flex gap-2">
              <DsButton variant="outline" onClick={onCloseModal}>
                {t("common.cancel")}
              </DsButton>
              <DsButton
                disabled={
                  !itemsExplorer.currentItemId &&
                  localSelectedItems.length === 0
                }
                onClick={onMove}
              >
                {t("explorer.modal.move.move_button")}
              </DsButton>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {createFolderModal.isOpen && (
        <ExplorerCreateFolderModal
          {...createFolderModal}
          parentId={itemsExplorer.currentItemId ?? undefined}
        />
      )}
      {moveConfirmationModal.isOpen && (
        <ExplorerTreeMoveConfirmationModal
          itemsCount={itemsToMove.length}
          isMoveToRoot={isMoveToRoot.current}
          isOpen={moveConfirmationModal.isOpen}
          onClose={() => {
            moveConfirmationModal.close();
            isMoveToRoot.current = false;
          }}
          sourceItem={itemsToMove[0]}
          targetItem={
            localSelectedItems.length === 1 ? localSelectedItems[0] : item!
          }
          onMove={() => {
            const data = getMoveData();

            if (isMoveToRoot.current) {
              handleMove(data.ids, undefined, data.oldParentId);
            } else {
              handleMove(data.ids, data.newParentId, data.oldParentId);
            }
            isMoveToRoot.current = false;
            moveConfirmationModal.close();
          }}
        />
      )}
    </>
  );
};
