import { Button } from "@gouvfr-lasuite/cunningham-react";

import {
  DecisionModalProps,
  Modal,
  ModalSize,
} from "@gouvfr-lasuite/cunningham-react";
import { useTranslation } from "react-i18next";
import {
  useFeatureFlag,
  FLAG_DS_CONFIRM_MODALS,
} from "@/features/flags/useFeatureFlag";
import { HardDeleteConfirmationModalDs } from "./HardDeleteConfirmationModalDs";

type Props = DecisionModalProps & {
  count?: number;
};

/**
 * Point de bascule du pilote : rend la version Design System (shadcn/Radix) si
 * le flag `DS_CONFIRM_MODALS` est actif, sinon la version Cunningham historique.
 * L'interface publique est identique → les call sites ne changent pas.
 */
export const HardDeleteConfirmationModal = (props: Props) => {
  const useDs = useFeatureFlag(FLAG_DS_CONFIRM_MODALS);
  if (useDs) {
    return (
      <HardDeleteConfirmationModalDs
        isOpen={props.isOpen}
        onClose={props.onClose}
        onDecide={props.onDecide}
        count={props.count}
      />
    );
  }
  return <HardDeleteConfirmationModalCunningham {...props} />;
};

const HardDeleteConfirmationModalCunningham = ({
  onDecide,
  count = 1,
  ...props
}: Props) => {
  const { t } = useTranslation();
  return (
    <Modal
      title={t("explorer.trash.hard_delete.title")}
      size={ModalSize.MEDIUM}
      rightActions={
        <>
          <Button
            variant="bordered"
            onClick={() => {
              onDecide(null);
              props.onClose();
            }}
          >
            {t("explorer.trash.hard_delete.cancel")}
          </Button>
          <Button
            color="error"
            onClick={() => {
              onDecide("yes");
              props.onClose();
            }}
          >
            {t("explorer.trash.hard_delete.confirm")}
          </Button>
        </>
      }
      {...props}
    >
      <div className="c__modal__content__text">
        {t("explorer.trash.hard_delete.content", {
          count,
        })}
      </div>
    </Modal>
  );
};
