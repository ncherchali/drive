// Variante Design System d'ExplorerCreateFolderModal (cf. ds-prompt-dialog).
// Réutilise la mutation de création ; rendue derrière le flag DS_APP_SHELL par
// le pont ExplorerCreateFolderModal.
import { useTranslation } from "react-i18next";
import { useRouter } from "next/router";
import { DsPromptDialog } from "@/components/ds-prompt-dialog";
import { useMutationCreateFolder } from "../../hooks/useMutations";
import { useSetSelectedItems } from "../../stores/selectionStore";

export type ExplorerCreateFolderModalDsProps = {
  isOpen: boolean;
  onClose: () => void;
  parentId?: string;
  redirectAfterCreate?: boolean;
};

export const ExplorerCreateFolderModalDs = ({
  isOpen,
  onClose,
  parentId,
  redirectAfterCreate,
}: ExplorerCreateFolderModalDsProps) => {
  const { t } = useTranslation();
  const createFolder = useMutationCreateFolder();
  const router = useRouter();
  const setSelectedItems = useSetSelectedItems();

  const onSubmit = (title: string) => {
    createFolder.mutate(
      { title, parentId },
      {
        onSuccess: (createdItem) => {
          onClose();
          if (redirectAfterCreate && createdItem?.id) {
            router.push(`/explorer/items/${createdItem.id}`);
            setSelectedItems([createdItem]);
          }
        },
      },
    );
  };

  return (
    <DsPromptDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t("explorer.actions.createFolder.modal.title")}
      label={t("explorer.actions.createFolder.modal.label")}
      submitLabel={t("explorer.actions.createFolder.modal.submit")}
      cancelLabel={t("explorer.actions.createFolder.modal.cancel")}
      onSubmit={onSubmit}
      submitting={createFolder.isPending}
      inputTestId="create-folder-input"
    />
  );
};
