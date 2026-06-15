import { useTranslation } from "react-i18next";
import { ExplorerTreeNavItem } from "./ExplorerTreeNavItem";
import { Separator } from "@/components/ui/separator";
import { Trash2 } from "lucide-react";
import { Icon as DsIcon } from "@/components/ui/icon";

export const ExplorerTreeNav = () => {
  const { t } = useTranslation();

  const navItems = [
    {
      icon: <DsIcon icon={Trash2} size="small" />,
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
