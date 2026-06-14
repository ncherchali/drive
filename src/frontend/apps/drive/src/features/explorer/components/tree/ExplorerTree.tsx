import { useTranslation } from "react-i18next";
import {
  DefaultRoute,
  DS_ROUTE_ICONS,
  ORDERED_DEFAULT_ROUTES,
} from "@/utils/defaultRoutes";
import { Icon as DsIcon } from "@/components/ui/icon";
import {
  useFeatureFlag,
  FLAG_DS_EXPLORER_GRID,
} from "@/features/flags/useFeatureFlag";
import { HorizontalSeparator, IconSize } from "@gouvfr-lasuite/ui-kit";
import { useCallback, useEffect, useState } from "react";
import { ExplorerTreeActions } from "./ExplorerTreeActions";
import { ExplorerTreeWorkspaces } from "./ExplorerTreeWorkspaces";
import { ExplorerTreeNav } from "./nav/ExplorerTreeNav";
import { ExplorerFolderTree } from "./ExplorerFolderTree";
import React from "react";
import { LeftPanelMobile } from "@/features/layouts/components/left-panel/LeftPanelMobile";
import { useAuth } from "@/features/auth/Auth";
import { ExplorerTreeNavItem } from "./nav/ExplorerTreeNavItem";

export const ExplorerTree = () => {
  return (
    <div className="explorer__tree">
      <ExplorerTreeActions />
      <HorizontalSeparator withPadding={false} />
      <ExplorerTreeNavDefault />

      <ExplorerFolderTree />

      <ExplorerTreeWorkspaces />
      <ExplorerTreeNav />
      <div className="explorer__tree__mobile-navs">
        <HorizontalSeparator />
        <LeftPanelMobile />
      </div>
    </div>
  );
};

type ExplorerTreeNavNode = {
  id: string;
  label: string;
  route: string;
  icon: React.ReactNode | string;
};

export const ExplorerTreeNavDefault = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const useDs = useFeatureFlag(FLAG_DS_EXPLORER_GRID);
  const [nodes, setNodes] = useState<ExplorerTreeNavNode[]>([]);

  const initTree = useCallback(async () => {
    if (!user) {
      return;
    }

    const nodes: ExplorerTreeNavNode[] = ORDERED_DEFAULT_ROUTES.filter(
      (route) => route.id !== DefaultRoute.FAVORITES,
    ).map((route) => ({
      id: route.id,
      label: t(route.label),
      route: route.route,
      icon: useDs ? (
        <DsIcon icon={DS_ROUTE_ICONS[route.id]} size="small" />
      ) : (
        <route.icon size={IconSize.SMALL} />
      ),
    }));

    setNodes(nodes);
  }, [user, t, useDs]);

  useEffect(() => {
    initTree();
  }, [initTree]);

  if (!nodes) {
    return null;
  }

  return (
    <div className="explorer__tree__nav">
      {nodes.map((node) => (
        <ExplorerTreeNavItem key={node.id} {...node} />
      ))}
    </div>
  );
};
