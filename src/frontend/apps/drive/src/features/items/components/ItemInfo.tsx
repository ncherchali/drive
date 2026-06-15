import { Item } from "@/features/drivers/types";
import { getFormatTranslationKey } from "@/features/explorer/utils/mimeTypes";
import { formatSize } from "@/features/explorer/utils/utils";
import { InfoRow } from "@/features/ui/components/info/InfoRow";
import { Avatar } from "@/components/ui/avatar";
import { useTranslation } from "react-i18next";

export type ItemInfoProps = {
  item: Item;
};

export const ItemInfo = ({ item }: ItemInfoProps) => {
  const { t } = useTranslation();

  return (
    <div className="item-info">
      <InfoRow
        label={t("explorer.rightPanel.format")}
        rightContent={t(getFormatTranslationKey(item))}
      />
      <InfoRow
        label={t("explorer.rightPanel.updated_at")}
        rightContent={item.updated_at.toLocaleString(undefined, {
          dateStyle: "short",
          timeStyle: "short",
        })}
      />
      <InfoRow
        label={t("explorer.rightPanel.created_at")}
        rightContent={
          item.created_at
            ? new Date(item?.created_at).toLocaleString(undefined, {
                dateStyle: "short",
                timeStyle: "short",
              })
            : ""
        }
      />
      {item.size && (
        <InfoRow
          label={t("explorer.rightPanel.size")}
          rightContent={formatSize(item.size, t)}
        />
      )}
      <InfoRow
        label={t("explorer.rightPanel.created_by")}
        rightContent={
          <span className="flex items-center gap-2">
            <Avatar name={item.creator.full_name} className="size-6 text-xs" />
            <span className="truncate text-sm">{item.creator.full_name}</span>
          </span>
        }
      />
    </div>
  );
};
