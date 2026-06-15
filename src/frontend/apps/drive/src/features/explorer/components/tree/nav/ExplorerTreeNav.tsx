import { useTranslation } from "react-i18next";
import { ExplorerTreeNavItem } from "./ExplorerTreeNavItem";
import { Separator } from "@/components/ui/separator";
import { IconSize } from "@/features/ui/components/icon/Icon";
import { TrashIcon } from "@/features/ui/components/icon/TrashIcon";
import { Trash2 } from "lucide-react";
import { Icon as DsIcon } from "@/components/ui/icon";
import {
  useFeatureFlag,
  FLAG_DS_EXPLORER_GRID,
} from "@/features/flags/useFeatureFlag";

export const ExplorerTreeNav = () => {
  const { t } = useTranslation();
  const useDs = useFeatureFlag(FLAG_DS_EXPLORER_GRID);

  const navItems = [
    {
      icon: useDs ? (
        <DsIcon icon={Trash2} size="small" />
      ) : (
        <TrashIcon size={IconSize.SMALL} />
      ),
      label: t("explorer.tree.trash"),
      route: "/explorer/trash",
    },
  ];

  return (
    <div className="explorer__tree__nav__container">
      <Separator />
      <div className="explorer__tree__nav">
        {navItems.map((item) => (
          <ExplorerTreeNavItem key={item.label} {...item} />
        ))}
      </div>
    </div>
  );
};
