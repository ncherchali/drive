// Version Design System de la confirmation de déplacement (arbre).
import { Item } from "@/features/drivers/types";
import { Trans, useTranslation } from "react-i18next";
import { DsConfirmDialog } from "@/components/ds-confirm-dialog";

export interface ExplorerTreeMoveConfirmationModalDsProps {
  isOpen: boolean;
  onClose: () => void;
  sourceItem: Item;
  targetItem: Item;
  onMove: () => void;
  itemsCount?: number;
  isMoveToRoot?: boolean;
}

export function ExplorerTreeMoveConfirmationModalDs({
  isOpen,
  onClose,
  sourceItem,
  targetItem,
  itemsCount = 1,
  isMoveToRoot = false,
  onMove,
}: ExplorerTreeMoveConfirmationModalDsProps) {
  const { t } = useTranslation();

  const description = isMoveToRoot ? (
    <Trans i18nKey="explorer.tree.workspace.move.confirmation_modal.root_description" />
  ) : (
    <Trans
      i18nKey={
        itemsCount > 1
          ? "explorer.tree.workspace.move.confirmation_modal.description_multiple"
          : "explorer.tree.workspace.move.confirmation_modal.description"
      }
      values={{
        count: itemsCount,
        sourceItem: sourceItem.title,
        targetItem: targetItem.title,
      }}
    />
  );

  return (
    <DsConfirmDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t("explorer.tree.workspace.move.confirmation_modal.title")}
      description={description}
      cancelLabel={t(
        "explorer.tree.workspace.move.confirmation_modal.cancel_button",
      )}
      confirmLabel={t(
        "explorer.tree.workspace.move.confirmation_modal.confirm_button",
      )}
      onConfirm={onMove}
    />
  );
}
