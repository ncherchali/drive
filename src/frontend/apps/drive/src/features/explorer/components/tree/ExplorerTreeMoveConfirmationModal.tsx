import { Item } from "@/features/drivers/types";
import { Button, Modal, ModalSize } from "@gouvfr-lasuite/cunningham-react";
import { Trans, useTranslation } from "react-i18next";
import {
  useFeatureFlag,
  FLAG_DS_CONFIRM_MODALS,
} from "@/features/flags/useFeatureFlag";
import { ExplorerTreeMoveConfirmationModalDs } from "./ExplorerTreeMoveConfirmationModalDs";

export type ConfirmationMoveState = {
  sourceItem: Item;
  targetItem: Item;
  moveCallback?: () => void;
};

type ExplorerTreeMoveConfirmationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  sourceItem: Item;
  targetItem: Item;
  onMove: () => void;
  itemsCount?: number;
  isMoveToRoot?: boolean;
};

/** Bascule Cunningham ↔ DS selon le flag DS_CONFIRM_MODALS (cf. pilote). */
export const ExplorerTreeMoveConfirmationModal = (
  props: ExplorerTreeMoveConfirmationModalProps,
) => {
  const useDs = useFeatureFlag(FLAG_DS_CONFIRM_MODALS);
  if (useDs) {
    return <ExplorerTreeMoveConfirmationModalDs {...props} />;
  }
  return <ExplorerTreeMoveConfirmationModalCunningham {...props} />;
};

const ExplorerTreeMoveConfirmationModalCunningham = ({
  isOpen,
  onClose,
  sourceItem,
  targetItem,
  itemsCount = 1,
  isMoveToRoot = false,
  onMove,
}: ExplorerTreeMoveConfirmationModalProps) => {
  const { t } = useTranslation();
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={ModalSize.MEDIUM}
      aria-label={t(
        "explorer.tree.workspace.move.confirmation_modal.aria_label",
      )}
      rightActions={
        <>
          <Button variant="bordered" onClick={onClose}>
            {t("explorer.tree.workspace.move.confirmation_modal.cancel_button")}
          </Button>
          <Button color="error" onClick={onMove}>
            {t("explorer.tree.workspace.move.confirmation_modal.confirm_button")}
          </Button>
        </>
      }
      title={t("explorer.tree.workspace.move.confirmation_modal.title")}
    >
      <div>
        <p>
          {isMoveToRoot ? (
            <Trans
              i18nKey={
                "explorer.tree.workspace.move.confirmation_modal.root_description"
              }
            />
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
          )}
        </p>
      </div>
    </Modal>
  );
};
