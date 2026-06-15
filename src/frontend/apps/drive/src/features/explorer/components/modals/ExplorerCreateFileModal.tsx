// Modale de création de fichier (depuis un gabarit) — Design System.
// Réécrite en DsPromptDialog (dépose totale d'ui-kit) : un seul champ (nom de
// fichier), l'extension est dérivée du type. Interface publique inchangée.
import { useTranslation } from "react-i18next";
import { useRouter } from "next/router";
import { DsPromptDialog } from "@/components/ds-prompt-dialog";
import { useMutationCreateFileFromTemplate } from "../../hooks/useMutations";
import { useSetSelectedItems } from "../../stores/selectionStore";

export enum ExplorerCreateFileType {
  DOC = "doc",
  POWERPOINT = "powerpoint",
  CALC = "calc",
}

const getExtension = (type: ExplorerCreateFileType) => {
  switch (type) {
    case ExplorerCreateFileType.DOC:
      return "odt";
    case ExplorerCreateFileType.POWERPOINT:
      return "odp";
    case ExplorerCreateFileType.CALC:
      return "ods";
  }
};

type ExplorerCreateFileModalProps = {
  isOpen: boolean;
  onClose: () => void;
  parentId?: string;
  redirectAfterCreate?: boolean;
  type: ExplorerCreateFileType;
};

export const ExplorerCreateFileModal = (props: ExplorerCreateFileModalProps) => {
  const { t } = useTranslation();
  const createFileFromTemplate = useMutationCreateFileFromTemplate();
  const router = useRouter();
  const setSelectedItems = useSetSelectedItems();

  const onSubmit = (filename: string) => {
    createFileFromTemplate.mutate(
      {
        parentId: props.parentId,
        extension: getExtension(props.type),
        title: filename,
      },
      {
        onSuccess: (createdItem) => {
          props.onClose();
          if (props.redirectAfterCreate && createdItem?.id) {
            router.push(`/explorer/items/my-files`);
            setSelectedItems([createdItem]);
          }
        },
      },
    );
  };

  return (
    <DsPromptDialog
      open={props.isOpen}
      onOpenChange={(open) => {
        if (!open) props.onClose();
      }}
      title={t(`explorer.actions.createFile.modal.title_${props.type}`)}
      label={t("explorer.actions.createFile.modal.label")}
      submitLabel={t("explorer.actions.createFile.modal.submit")}
      cancelLabel={t("explorer.actions.createFile.modal.cancel")}
      onSubmit={onSubmit}
      submitting={createFileFromTemplate.isPending}
    />
  );
};
