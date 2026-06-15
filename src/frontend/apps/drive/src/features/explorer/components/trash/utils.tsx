import type { DsModalsApi } from "@/components/ds-modals";
import i18n from "@/features/i18n/initI18n";

export const messageModalTrashNavigate = (
  modals: DsModalsApi,
  isFile: boolean = false,
) => {
  const key = isFile ? "modal_file" : "modal_folder";
  void modals.messageModal({
    title: i18n.t(`explorer.trash.navigate.${key}.title`),
    children: (
      <div className="clr-greyscale-600">
        {i18n.t(`explorer.trash.navigate.${key}.description`)}
      </div>
    ),
  });
};
