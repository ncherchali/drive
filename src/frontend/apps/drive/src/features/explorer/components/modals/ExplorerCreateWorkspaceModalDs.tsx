// Variante Design System d'ExplorerCreateWorkspaceModal (cf. ds-prompt-dialog).
// Réutilise la mutation de création ; rendue derrière le flag DS_APP_SHELL par
// le pont ExplorerCreateWorkspaceModal.
import { useTranslation } from "react-i18next";
import { useRouter } from "next/router";
import { DsPromptDialog } from "@/components/ds-prompt-dialog";
import { useMutationCreateWorskpace } from "../../hooks/useMutations";
import { useSetSelectedItems } from "../../stores/selectionStore";

export type ExplorerCreateWorkspaceModalDsProps = {
  isOpen: boolean;
  onClose: () => void;
  redirectAfterCreate?: boolean;
};

export const ExplorerCreateWorkspaceModalDs = ({
  isOpen,
  onClose,
  redirectAfterCreate,
}: ExplorerCreateWorkspaceModalDsProps) => {
  const { t } = useTranslation();
  const createWorkspace = useMutationCreateWorskpace();
  const router = useRouter();
  const setSelectedItems = useSetSelectedItems();

  const onSubmit = (title: string) => {
    createWorkspace.mutate(
      { title, description: "" },
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
      title={t("explorer.actions.createWorkspace.modal.title")}
      label={t("explorer.actions.createWorkspace.modal.label")}
      submitLabel={t("explorer.actions.createWorkspace.modal.submit")}
      cancelLabel={t("explorer.actions.createWorkspace.modal.cancel")}
      onSubmit={onSubmit}
      submitting={createWorkspace.isPending}
      inputTestId="create-workspace-input"
    />
  );
};
