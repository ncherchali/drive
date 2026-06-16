import { JSX } from "react";
import type { IconProps } from "@/features/ui/components/icon/Icon";
import { fromLucide } from "@/features/ui/components/icon/Icon";
import { History, House, Share2, Star, Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export enum DefaultRoute {
  MY_FILES = "my-files",
  RECENT = "recent",
  SHARED_WITH_ME = "shared-with-me",
  FAVORITES = "favorites",
  TRASH = "trash",
}

/**
 * Icônes lucide (DS) des routes par défaut, rendues dans l'arbre derrière le flag
 * DS_EXPLORER_GRID en remplacement des SVG ui-kit (cf. repeinture DS de l'arbre).
 */
export const DS_ROUTE_ICONS: Record<DefaultRoute, LucideIcon> = {
  [DefaultRoute.RECENT]: History,
  [DefaultRoute.MY_FILES]: House,
  [DefaultRoute.SHARED_WITH_ME]: Share2,
  [DefaultRoute.FAVORITES]: Star,
  [DefaultRoute.TRASH]: Trash2,
};
export type DefaultRouteData = {
  id: DefaultRoute;
  label: string;
  route: string;
  icon: (props: Partial<IconProps>) => JSX.Element;
};
export const ORDERED_DEFAULT_ROUTES: DefaultRouteData[] = [
  {
    id: DefaultRoute.RECENT,
    label: "explorer.tree.recent",
    route: "/explorer/items/recent",
    icon: fromLucide(History),
  },
  {
    id: DefaultRoute.MY_FILES,
    label: "explorer.tree.my_files",
    route: "/explorer/items/my-files",
    icon: fromLucide(House),
  },
  {
    id: DefaultRoute.SHARED_WITH_ME,
    label: "explorer.tree.shared_with_me",
    route: "/explorer/items/shared-with-me",
    icon: fromLucide(Share2),
  },
  {
    id: DefaultRoute.FAVORITES,
    label: "explorer.tree.favorites",
    route: "/explorer/items/favorites",
    icon: fromLucide(Star),
  },
];

export const TRASH_ROUTE_DATA: DefaultRouteData = {
  id: DefaultRoute.TRASH,
  label: "explorer.tree.trash",
  route: "/explorer/trash",
  icon: fromLucide(Trash2),
};

export const getDefaultRoute = (
  pathname: string,
): DefaultRouteData | undefined => {
  if (pathname === TRASH_ROUTE_DATA.route) {
    return TRASH_ROUTE_DATA;
  }
  return ORDERED_DEFAULT_ROUTES.find((r) => r.route === pathname);
};

export const getDefaultRouteId = (
  pathname: string,
): DefaultRoute | undefined => {
  return getDefaultRoute(pathname)?.id;
};

export const isDefaultRoute = (pathname: string): boolean => {
  return getDefaultRoute(pathname) !== undefined;
};

export const isMyFilesRoute = (pathname: string): boolean => {
  return getDefaultRouteId(pathname) === DefaultRoute.MY_FILES;
};

export const getMyFilesQueryKey = (): string[] => {
  return ["items", "infinite", JSON.stringify({ is_creator_me: true })];
};

export const getRecentItemsQueryKey = (): string[] => {
  return ["items", "infinite"];
};

export const getSharedWithMeQueryKey = (): string[] => {
  return ["items", "infinite", JSON.stringify({ is_creator_me: false })];
};

export const getQueryKeyForRouteId = (pathname: string): string[] => {
  const route = getDefaultRouteId(pathname);
  switch (route) {
    case DefaultRoute.MY_FILES:
      return getMyFilesQueryKey();
    case DefaultRoute.RECENT:
      return getRecentItemsQueryKey();
    case DefaultRoute.SHARED_WITH_ME:
      return getSharedWithMeQueryKey();

    default:
      return [];
  }
};
