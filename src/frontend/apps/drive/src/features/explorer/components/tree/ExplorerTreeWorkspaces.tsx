import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { HorizontalSeparator, IconSize } from "@gouvfr-lasuite/ui-kit";
import { useFirstLevelItems } from "../../hooks/useQueries";
import { itemIsWorkspace } from "@/features/drivers/utils";
import { ItemIcon } from "../icons/ItemIcon";
import { ExplorerTreeNavItem } from "./nav/ExplorerTreeNavItem";

/**
 * Dedicated section listing the root-level workspaces (folders at depth 1,
 * excluding the personal "main" workspace), so they appear as first-class
 * spaces separate from "My files".
 */
export const ExplorerTreeWorkspaces = () => {
  const { t } = useTranslation();
  const { data: firstLevelItems } = useFirstLevelItems();

  const workspaces = useMemo(
    () => firstLevelItems?.filter(itemIsWorkspace) ?? [],
    [firstLevelItems],
  );

  if (workspaces.length === 0) {
    return null;
  }

  return (
    <div className="explorer__tree__nav__container">
      <HorizontalSeparator withPadding={false} />
      <div className="explorer__tree__workspaces__title">
        {t("explorer.tree.workspaces.title")}
      </div>
      <div className="explorer__tree__nav">
        {workspaces.map((workspace) => (
          <ExplorerTreeNavItem
            key={workspace.id}
            icon={<ItemIcon item={workspace} size={IconSize.SMALL} />}
            label={workspace.title}
            route={`/explorer/items/${workspace.id}`}
          />
        ))}
      </div>
    </div>
  );
};
