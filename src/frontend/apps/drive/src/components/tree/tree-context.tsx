// Contexte d'arbre — Design System (réimplémente TreeProvider/useTreeContext de
// l'ui-kit DINUM). Expose le store `useTree` + les méta (root/cible
// initiale) + la ref impérative react-arborist (treeApiRef), à la forme exacte
// de `TreeContextType` ui-kit. Pages Router : pas de "use client".
import * as React from "react";
import type { TreeApi } from "react-arborist";
import type {
  TreeViewDataType,
  TreeDataItem,
  PaginatedChildrenResult,
} from "./tree-types";
import { useTree, type UseTreeReturn } from "./use-tree";

export type TreeContextType<T> = {
  treeApiRef: React.RefObject<TreeApi<TreeDataItem<T>> | null>;
  treeData: UseTreeReturn<T>;
  root: T | null;
  initialTargetId: string | null;
  setInitialTargetId: (id: string) => void;
  setRoot: (root: T) => void;
};

// Contexte non typé en interne (impossible de paramétrer un contexte React par
// le générique d'appel) ; `useTreeContext<T>()` recaste à l'usage, comme ui-kit.
const TreeContext = React.createContext<TreeContextType<unknown> | null>(null);

export type TreeProviderProps<T> = {
  children: React.ReactNode;
  initialTreeData?: TreeViewDataType<T>[];
  initialNodeId?: string;
  onLoadChildren?: (
    id: string,
    page: number,
  ) => Promise<PaginatedChildrenResult<T>>;
  onRefresh?: (id: string) => Promise<Partial<TreeViewDataType<T>>>;
};

export function TreeProvider<T>({
  children,
  initialTreeData,
  initialNodeId,
  onLoadChildren,
  onRefresh,
}: TreeProviderProps<T>) {
  const treeApiRef = React.useRef<TreeApi<TreeDataItem<T>> | null>(null);
  const treeData = useTree<T>(
    initialTreeData ?? [],
    onRefresh,
    onLoadChildren,
  );
  const [root, setRoot] = React.useState<T | null>(null);
  const [initialTargetId, setInitialTargetId] = React.useState<string | null>(
    initialNodeId ?? null,
  );

  const value = React.useMemo<TreeContextType<T>>(
    () => ({
      treeApiRef,
      treeData,
      root,
      setRoot,
      initialTargetId,
      setInitialTargetId,
    }),
    [treeData, root, initialTargetId],
  );

  return (
    <TreeContext.Provider value={value as TreeContextType<unknown>}>
      {children}
    </TreeContext.Provider>
  );
}

export function useTreeContext<T>(): TreeContextType<T> | null {
  return React.useContext(TreeContext) as TreeContextType<T> | null;
}
