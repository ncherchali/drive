// Variante Design System d'ItemInfo (métadonnées du panneau de droite).
// Pages Router : pas de "use client".
//
// Rangées label/valeur en DS (Tailwind) + avatar DS pour le créateur, en
// remplacement d'InfoRow (SCSS) et UserRow (ui-kit). Rendue par
// ExplorerRightPanelContentDs → panneau de droite 100 % DS.
import { useTranslation } from "react-i18next";
import { Item } from "@/features/drivers/types";
import { getFormatTranslationKey } from "@/features/explorer/utils/mimeTypes";
import { formatSize } from "@/features/explorer/utils/utils";
import { Avatar } from "@/components/ui/avatar";

export type ItemInfoDsProps = {
  item: Item;
};

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-solid border-border py-2 text-sm last:border-b-0">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-end text-foreground">
        {children}
      </span>
    </div>
  );
}

export const ItemInfoDs = ({ item }: ItemInfoDsProps) => {
  const { t } = useTranslation();

  const fmtDate = (value?: string | Date | null) =>
    value
      ? new Date(value).toLocaleString(undefined, {
          dateStyle: "short",
          timeStyle: "short",
        })
      : "";

  return (
    <div className="flex flex-col">
      <InfoRow label={t("explorer.rightPanel.format")}>
        {t(getFormatTranslationKey(item))}
      </InfoRow>
      <InfoRow label={t("explorer.rightPanel.updated_at")}>
        {fmtDate(item.updated_at)}
      </InfoRow>
      <InfoRow label={t("explorer.rightPanel.created_at")}>
        {fmtDate(item.created_at)}
      </InfoRow>
      {item.size && (
        <InfoRow label={t("explorer.rightPanel.size")}>
          {formatSize(item.size, t)}
        </InfoRow>
      )}
      <InfoRow label={t("explorer.rightPanel.created_by")}>
        <span className="inline-flex min-w-0 items-center gap-2">
          <Avatar name={item.creator.full_name} className="size-6" />
          <span className="min-w-0 truncate">{item.creator.full_name}</span>
        </span>
      </InfoRow>
    </div>
  );
};
