// Variante Design System d'ExplorerRenameItemModal (cf. ds-prompt-dialog).
// Réutilise la mutation de renommage + la mise à jour de l'arbre et du panneau
// de droite ; rendue derrière le flag DS_APP_SHELL par le pont
// ExplorerRenameItemModal.
import { useTranslation } from "react-i18next";
import { removeFileExtension } from "@/features/explorer/utils/fileTypes";
import { DsPromptDialog } from "@/components/ds-prompt-dialog";
import { Item } from "@/features/drivers/types";
import { useMutationRenameItem } from "../../hooks/useMutations";
import { useTreeUtils } from "../../hooks/useTreeUtils";
import { useGlobalExplorer } from "../GlobalExplorerContext";
import { useSelectionStore } from "../../stores/selectionStore";

export type ExplorerRenameItemModalDsProps = {
  isOpen: boolean;
  onClose: () => void;
  item: Item;
};

export const ExplorerRenameItemModalDs = ({
  isOpen,
  onClose,
  item,
}: ExplorerRenameItemModalDsProps) => {
  const { t } = useTranslation();
  const treeUtils = useTreeUtils();
  const { rightPanelOpen, rightPanelForcedItem, setRightPanelForcedItem } =
    useGlobalExplorer();
  const selectionStore = useSelectionStore();
  const updateItem = useMutationRenameItem();

  const onSubmit = async (title: string) => {
    await updateItem.mutateAsync(
      { title, id: item.id },
      {
        onSuccess: (_, updatedItem) => {
          treeUtils.updateNodeByOriginalId(item.id, { title });

          const selectedItem =
            rightPanelForcedItem ?? selectionStore.getSelectedItems()[0];

          if (rightPanelOpen && selectedItem?.id === item.id) {
            setRightPanelForcedItem({ ...selectedItem, ...updatedItem });
          }
        },
      },
    );
    onClose();
  };

  return (
    <DsPromptDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t("explorer.actions.rename.modal.title")}
      label={t("explorer.actions.rename.modal.label")}
      defaultValue={removeFileExtension(item.title)}
      submitLabel={t("explorer.actions.rename.modal.submit")}
      cancelLabel={t("explorer.actions.rename.modal.cancel")}
      onSubmit={onSubmit}
      submitting={updateItem.isPending}
      selectOnFocus
    />
  );
};
