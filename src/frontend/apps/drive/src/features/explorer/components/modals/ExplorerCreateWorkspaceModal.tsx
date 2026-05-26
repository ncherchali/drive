import {
  Button,
  Modal,
  ModalProps,
  ModalSize,
} from "@gouvfr-lasuite/cunningham-react";
import { useTranslation } from "react-i18next";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { RhfInput } from "@/features/forms/components/RhfInput";
import { useMutationCreateWorskpace } from "../../hooks/useMutations";
import { useRouter } from "next/router";
import { useSetSelectedItems } from "../../stores/selectionStore";

type Inputs = {
  title: string;
};

type ExplorerCreateWorkspaceModalProps = Pick<
  ModalProps,
  "isOpen" | "onClose"
> & {
  redirectAfterCreate?: boolean;
};

export const ExplorerCreateWorkspaceModal = ({
  ...props
}: ExplorerCreateWorkspaceModalProps) => {
  const { t } = useTranslation();
  const form = useForm<Inputs>();
  const createWorkspace = useMutationCreateWorskpace();
  const router = useRouter();
  const setSelectedItems = useSetSelectedItems();

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    createWorkspace.mutate(
      {
        title: data.title,
        description: "",
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
      title={t("explorer.actions.createWorkspace.modal.title")}
      rightActions={
        <>
          <Button variant="bordered" onClick={props.onClose}>
            {t("explorer.actions.createWorkspace.modal.cancel")}
          </Button>
          <Button type="submit" form="create-workspace-form">
            {t("explorer.actions.createWorkspace.modal.submit")}
          </Button>
        </>
      }
    >
      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          id="create-workspace-form"
          className="mt-s"
        >
          <RhfInput
            label={t("explorer.actions.createWorkspace.modal.label")}
            fullWidth={true}
            data-testid="create-workspace-input"
            autoFocus={true}
            {...form.register("title")}
          />
        </form>
      </FormProvider>
    </Modal>
  );
};
