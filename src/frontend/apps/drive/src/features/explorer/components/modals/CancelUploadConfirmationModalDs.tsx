// Version Design System de la confirmation d'annulation d'upload.
import { useTranslation } from "react-i18next";
import { DsConfirmDialog } from "@/components/ds-confirm-dialog";

export interface CancelUploadConfirmationModalDsProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function CancelUploadConfirmationModalDs({
  isOpen,
  onClose,
  onConfirm,
}: CancelUploadConfirmationModalDsProps) {
  const { t } = useTranslation();
  return (
    <DsConfirmDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t("explorer.actions.upload.cancel_modal.title")}
      description={t("explorer.actions.upload.cancel_modal.description")}
      cancelLabel={t("explorer.actions.upload.cancel_modal.keep")}
      confirmLabel={t("explorer.actions.upload.cancel_modal.confirm")}
      onConfirm={onConfirm}
    />
  );
}
