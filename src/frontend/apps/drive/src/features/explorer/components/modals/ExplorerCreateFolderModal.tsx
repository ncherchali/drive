import {
  Button,
  Modal,
  ModalProps,
  ModalSize,
} from "@gouvfr-lasuite/cunningham-react";
import { useTranslation } from "react-i18next";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { RhfInput } from "@/features/forms/components/RhfInput";
import { useMutationCreateFolder } from "../../hooks/useMutations";
import { useRouter } from "next/router";
import { useSetSelectedItems } from "../../stores/selectionStore";
import {
  FLAG_DS_APP_SHELL,
  useFeatureFlag,
} from "@/features/flags/useFeatureFlag";
import { ExplorerCreateFolderModalDs } from "./ExplorerCreateFolderModalDs";

type Inputs = {
  title: string;
};

type ExplorerCreateFolderModalProps = Pick<ModalProps, "isOpen" | "onClose"> & {
  parentId?: string;
  redirectAfterCreate?: boolean;
};

/**
 * Point de bascule : rend la version DS si le flag DS_APP_SHELL est actif, sinon
 * la version Cunningham. Interface publique identique → call sites inchangés.
 */
export const ExplorerCreateFolderModal = (
  props: ExplorerCreateFolderModalProps,
) => {
  const useDs = useFeatureFlag(FLAG_DS_APP_SHELL);
  if (useDs) {
    return (
      <ExplorerCreateFolderModalDs
        isOpen={props.isOpen}
        onClose={props.onClose}
        parentId={props.parentId}
        redirectAfterCreate={props.redirectAfterCreate}
      />
    );
  }
  return <ExplorerCreateFolderModalCunningham {...props} />;
};

const ExplorerCreateFolderModalCunningham = ({
  ...props
}: ExplorerCreateFolderModalProps) => {
  const { t } = useTranslation();
  const form = useForm<Inputs>();
  const createFolder = useMutationCreateFolder();
  const router = useRouter();
  const setSelectedItems = useSetSelectedItems();

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    form.reset();
    createFolder.mutate(
      {
        ...data,
        parentId: props.parentId,
      },
      {
        onSuccess: (createdItem) => {
          form.reset();
          props.onClose();
          if (props.redirectAfterCreate && createdItem?.id) {
            router.push(`/explorer/items/${createdItem.id}`);
            setSelectedItems([createdItem]);
          }
        },
      },
    );
  };

  return (
    <Modal
      {...props}
      size={ModalSize.SMALL}
      title={t("explorer.actions.createFolder.modal.title")}
      rightActions={
        <>
          <Button variant="bordered" onClick={props.onClose}>
            {t("explorer.actions.createFolder.modal.cancel")}
          </Button>
          <Button type="submit" form="create-folder-form">
            {t("explorer.actions.createFolder.modal.submit")}
          </Button>
        </>
      }
    >
      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          id="create-folder-form"
          className="mt-s"
        >
          <RhfInput
            label={t("explorer.actions.createFolder.modal.label")}
            fullWidth={true}
            data-testid="create-folder-input"
            autoFocus={true}
            {...form.register("title")}
          />
        </form>
      </FormProvider>
    </Modal>
  );
};
