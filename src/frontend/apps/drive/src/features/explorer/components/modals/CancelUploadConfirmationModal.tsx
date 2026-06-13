import {
  Button,
  Modal,
  ModalProps,
  ModalSize,
} from "@gouvfr-lasuite/cunningham-react";
import { useTranslation } from "react-i18next";
import {
  useFeatureFlag,
  FLAG_DS_CONFIRM_MODALS,
} from "@/features/flags/useFeatureFlag";
import { CancelUploadConfirmationModalDs } from "./CancelUploadConfirmationModalDs";

type Props = Pick<ModalProps, "isOpen" | "onClose"> & {
  onConfirm: () => void;
};

/** Bascule Cunningham ↔ DS selon le flag DS_CONFIRM_MODALS (cf. pilote). */
export const CancelUploadConfirmationModal = (props: Props) => {
  const useDs = useFeatureFlag(FLAG_DS_CONFIRM_MODALS);
  if (useDs) {
    return (
      <CancelUploadConfirmationModalDs
        isOpen={props.isOpen}
        onClose={props.onClose}
        onConfirm={props.onConfirm}
      />
    );
  }
  return <CancelUploadConfirmationModalCunningham {...props} />;
};

const CancelUploadConfirmationModalCunningham = ({
  onConfirm,
  ...props
}: Props) => {
  const { t } = useTranslation();
  return (
    <Modal
      title={t("explorer.actions.upload.cancel_modal.title")}
      size={ModalSize.MEDIUM}
      rightActions={
        <>
          <Button
            variant="bordered"
            onClick={() => {
              props.onClose();
            }}
          >
            {t("explorer.actions.upload.cancel_modal.keep")}
          </Button>
          <Button
            color="error"
            onClick={() => {
              onConfirm();
              props.onClose();
            }}
          >
            {t("explorer.actions.upload.cancel_modal.confirm")}
          </Button>
        </>
      }
      {...props}
    >
      <div className="c__modal__content__text cancel-upload-modal__content">
        {t("explorer.actions.upload.cancel_modal.description")}
      </div>
    </Modal>
  );
};
