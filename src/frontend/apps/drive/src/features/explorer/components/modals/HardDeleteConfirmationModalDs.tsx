// Version Design System de la confirmation de suppression définitive.
// Pilote de substitution Cunningham → DS (cf. useFeatureFlag).
import { useTranslation } from "react-i18next";
import { DsConfirmDialog } from "@/components/ds-confirm-dialog";

export interface HardDeleteConfirmationModalDsProps {
  isOpen: boolean;
  onClose: () => void;
  onDecide: (decision: "yes" | null) => void;
  count?: number;
}

export function HardDeleteConfirmationModalDs({
  isOpen,
  onClose,
  onDecide,
  count = 1,
}: HardDeleteConfirmationModalDsProps) {
  const { t } = useTranslation();
  return (
    <DsConfirmDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t("explorer.trash.hard_delete.title")}
      description={t("explorer.trash.hard_delete.content", { count })}
      cancelLabel={t("explorer.trash.hard_delete.cancel")}
      confirmLabel={t("explorer.trash.hard_delete.confirm")}
      onCancel={() => onDecide(null)}
      onConfirm={() => onDecide("yes")}
    />
  );
}
