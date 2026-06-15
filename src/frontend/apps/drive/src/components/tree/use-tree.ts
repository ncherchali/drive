// Store d'arbre — Design System (réimplémente le `useTree` de l'ui-kit DINUM).
//
// Source de vérité = un arbre de VALEURS (`TreeViewDataType<T>[]`, enfants
// imbriqués). `nodes` (matérialisation `TreeDataItem[]` consommée par
// react-arborist) en est dérivé/mémoïsé. Toutes les mutations sont immuables.
// Ne couvre QUE la surface réellement utilisée par l'app (getNode, addChild,
// moveNode, updateNode, deleteNode(s), resetTree, handleLoadChildren,
// setSelectedNode) — cf. inventaire des call sites (Lot 6).
import * as React from "react";
import type {
  TreeViewDataType,
  TreeDataItem,
  PaginatedChildrenResult,
} from "./tree-types";

/* ------------------------------ helpers value-tree ------------------------ */

function findValue<T>(
  items: TreeViewDataType<T>[],
  id: string,
): TreeViewDataType<T> | undefined {
  for (const it of items) {
    if (it.id === id) return it;
    if (it.children) {
      const found = findValue(it.children as TreeViewDataType<T>[], id);
      if (found) return found;
    }
  }
  return undefined;
}

function updateValue<T>(
  items: TreeViewDataType<T>[],
  id: string,
  fn: (v: TreeViewDataType<T>) => TreeViewDataType<T>,
): TreeViewDataType<T>[] {
  return items.map((it) => {
    if (it.id === id) return fn(it);
    if (it.children) {
      return {
        ...it,
        children: updateValue(it.children as TreeViewDataType<T>[], id, fn),
      };
    }
    return it;
  });
}

function removeValues<T>(
  items: TreeViewDataType<T>[],
  ids: Set<string>,
): TreeViewDataType<T>[] {
  return items
    .filter((it) => !ids.has(it.id))
    .map((it) =>
      it.children
        ? {
            ...it,
            children: removeValues(it.children as TreeViewDataType<T>[], ids),
          }
        : it,
    );
}

function insertChild<T>(
  items: TreeViewDataType<T>[],
  parentId: string,
  child: TreeViewDataType<T>,
  index?: number,
): TreeViewDataType<T>[] {
  return items.map((it) => {
    if (it.id === parentId) {
      const children = [...((it.children as TreeViewDataType<T>[]) ?? [])];
      children.splice(index ?? children.length, 0, child);
      return { ...it, children };
    }
    if (it.children) {
      return {
        ...it,
        children: insertChild(
          it.children as TreeViewDataType<T>[],
          parentId,
          child,
          index,
        ),
      };
    }
    return it;
  });
}

/** Matérialise une valeur en nœud react-arborist (key/parentKey/value/children). */
function toTreeData<T>(
  value: TreeViewDataType<T>,
  parentKey: string | null,
): TreeDataItem<T> {
  // `children` non-null (=> nœud dépliable) si le nœud a des enfants connus
  // (childrenCount > 0, ex. dossier non encore chargé) OU déjà chargés.
  const childValues = (value.children as TreeViewDataType<T>[]) ?? [];
  const expandable =
    (value.childrenCount ?? 0) > 0 || childValues.length > 0;
  return {
    key: value.id,
    parentKey,
    value,
    children: expandable
      ? childValues.map((c) => toTreeData(c, value.id))
      : null,
  };
}

/* ---------------------------------- hook ---------------------------------- */

export type UseTreeReturn<T> = ReturnType<typeof useTree<T>>;

export function useTree<T>(
  initialItems: TreeViewDataType<T>[],
  _onRefresh?: (id: string) => Promise<Partial<TreeViewDataType<T>>>,
  onLoadChildren?: (
    id: string,
    page: number,
  ) => Promise<PaginatedChildrenResult<T>>,
) {
  const [roots, setRoots] = React.useState<TreeViewDataType<T>[]>(initialItems);
  const [selectedNode, setSelectedNode] = React.useState<T | undefined>(
    undefined,
  );

  // Ref tenue à jour (hors rendu) : getNode/handleLoadChildren lisent l'état
  // courant depuis des handlers/async sans dépendre de la fermeture de rendu.
  const rootsRef = React.useRef(roots);
  React.useEffect(() => {
    rootsRef.current = roots;
  }, [roots]);

  const nodes = React.useMemo<TreeDataItem<T>[]>(
    () => roots.map((v) => toTreeData(v, null)),
    [roots],
  );

  const getNode = React.useCallback(
    (id: string) => findValue(rootsRef.current, id),
    [],
  );

  const addChild = React.useCallback(
    (parentId: string | null, newNode: TreeViewDataType<T>, index?: number) => {
      setRoots((prev) => {
        if (parentId == null) {
          const copy = [...prev];
          copy.splice(index ?? copy.length, 0, newNode);
          return copy;
        }
        return insertChild(prev, parentId, newNode, index);
      });
    },
    [],
  );

  const moveNode = React.useCallback(
    (nodeId: string, newParentId: string | null, newIndex: number) => {
      setRoots((prev) => {
        const node = findValue(prev, nodeId);
        if (!node) return prev;
        const without = removeValues(prev, new Set([nodeId]));
        if (newParentId == null) {
          const copy = [...without];
          copy.splice(newIndex, 0, node);
          return copy;
        }
        return insertChild(without, newParentId, node, newIndex);
      });
    },
    [],
  );

  const updateNode = React.useCallback(
    (nodeId: string, updatedData: Partial<TreeViewDataType<T>>) => {
      setRoots((prev) =>
        updateValue(
          prev,
          nodeId,
          (v) => ({ ...v, ...updatedData }) as TreeViewDataType<T>,
        ),
      );
    },
    [],
  );

  const deleteNode = React.useCallback((nodeId: string) => {
    setRoots((prev) => removeValues(prev, new Set([nodeId])));
  }, []);

  const deleteNodes = React.useCallback((nodeIds: string[]) => {
    setRoots((prev) => removeValues(prev, new Set(nodeIds)));
  }, []);

  const resetTree = React.useCallback((newItems?: TreeViewDataType<T>[]) => {
    setRoots(newItems ?? []);
  }, []);

  const handleLoadChildren = React.useCallback(
    async (nodeId: string) => {
      const node = findValue(rootsRef.current, nodeId);
      if (!node || node.hasLoadedChildren || !onLoadChildren) return;
      const page = (node.pagination?.currentPage ?? 0) + 1;
      const res = await onLoadChildren(nodeId, page);
      setRoots((prev) =>
        updateValue(prev, nodeId, (v) => ({
          ...v,
          children: [
            ...(((v.children as TreeViewDataType<T>[]) ?? []) || []),
            ...((res.children as TreeViewDataType<T>[]) ?? []),
          ],
          hasLoadedChildren: true,
          pagination: res.pagination,
        })) as TreeViewDataType<T>[],
      );
    },
    [onLoadChildren],
  );

  return {
    nodes,
    getNode,
    addChild,
    moveNode,
    updateNode,
    deleteNode,
    deleteNodes,
    resetTree,
    handleLoadChildren,
    selectedNode,
    setSelectedNode,
  };
}
