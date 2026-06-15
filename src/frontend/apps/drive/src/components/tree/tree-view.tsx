// Arbre — Design System (remplace `<TreeView>` de l'ui-kit DINUM).
//
// Mince wrapper autour de react-arborist `<Tree>` (le même moteur que celui
// qu'ui-kit wrappait). Mappe l'API ui-kit (selectedNodeId/canDrag/canDrop/
// beforeMove/afterMove/renderNode/initialOpenState) sur react-arborist, lit le
// store via useTreeContext et dimensionne via ResizeObserver (react-window
// exige des dimensions numériques). Pages Router : pas de "use client".
import * as React from "react";
import { Tree } from "react-arborist";
import type { NodeApi, NodeRendererProps } from "react-arborist";
import type { TreeDataItem, TreeViewMoveResult, OpenMap } from "./tree-types";
import { TreeViewMoveModeEnum } from "./tree-types";
import { useTreeContext } from "./tree-context";

/** Hauteur de rangée / indentation — à ajuster à la validation live si besoin. */
export const TREE_ROW_HEIGHT = 32;
export const TREE_INDENT = 20;

export type TreeViewProps<T> = {
  initialOpenState?: OpenMap;
  selectedNodeId?: string;
  rootNodeId: string;
  canDrop?: (args: {
    parentNode: NodeApi<TreeDataItem<T>> | null;
    dragNodes: NodeApi<TreeDataItem<T>>[];
    index: number;
  }) => boolean;
  canDrag?: (node: TreeDataItem<T>) => boolean;
  beforeMove?: (result: TreeViewMoveResult, moveCallback: () => void) => void;
  afterMove?: (result: TreeViewMoveResult) => void;
  renderNode: (props: NodeRendererProps<TreeDataItem<T>>) => React.ReactNode;
  paddingTop?: number;
  paddingBottom?: number;
};

export function TreeView<T>({
  initialOpenState,
  selectedNodeId,
  canDrop,
  canDrag,
  beforeMove,
  afterMove,
  renderNode,
  paddingTop,
  paddingBottom,
}: TreeViewProps<T>) {
  const ctx = useTreeContext<T>();
  const treeData = ctx?.treeData;
  const treeApiRef = ctx?.treeApiRef;

  // react-window exige une hauteur/largeur numériques → on mesure le conteneur.
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [size, setSize] = React.useState({ width: 0, height: 0 });
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () =>
      setSize({ width: el.clientWidth, height: el.clientHeight });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  }, []);

  const onMove = React.useCallback(
    (args: {
      dragIds: string[];
      dragNodes: NodeApi<TreeDataItem<T>>[];
      parentId: string | null;
      parentNode: NodeApi<TreeDataItem<T>> | null;
      index: number;
    }) => {
      const sourceId = args.dragIds[0];
      const oldParentId = args.dragNodes[0]?.data.parentKey ?? undefined;
      const result: TreeViewMoveResult = {
        sourceId,
        targetModeId: args.parentId ?? "",
        newParentId: args.parentId,
        oldParentId: oldParentId ?? undefined,
        index: args.index,
        mode: TreeViewMoveModeEnum.MOVE,
      };
      const doMove = () => {
        treeData?.moveNode(sourceId, args.parentId, args.index);
        afterMove?.(result);
      };
      // beforeMove peut différer (modale de confirmation) : si moveCallback
      // n'est pas appelé, aucun déplacement (react-arborist est contrôlé).
      if (beforeMove) beforeMove(result, doMove);
      else doMove();
    },
    [treeData, beforeMove, afterMove],
  );

  if (!treeData) return null;

  return (
    <div ref={containerRef} className="h-full min-h-0 w-full flex-1">
      <Tree<TreeDataItem<T>>
        ref={treeApiRef}
        data={treeData.nodes}
        idAccessor={(d) => d.key}
        childrenAccessor={(d) => d.children}
        openByDefault={false}
        initialOpenState={initialOpenState}
        selection={selectedNodeId}
        width={size.width || undefined}
        height={size.height || 400}
        rowHeight={TREE_ROW_HEIGHT}
        indent={TREE_INDENT}
        paddingTop={paddingTop}
        paddingBottom={paddingBottom}
        disableMultiSelection
        disableEdit
        onMove={onMove}
        disableDrag={canDrag ? (d) => !canDrag(d) : undefined}
        disableDrop={canDrop ? (args) => !canDrop(args) : undefined}
        onToggle={(id) => {
          // Lazy-load : si le nœud vient de s'ouvrir, charge ses enfants.
          const node = treeApiRef?.current?.get(id);
          if (node?.isOpen) void treeData.handleLoadChildren(id);
        }}
      >
        {renderNode as React.ElementType}
      </Tree>
    </div>
  );
}
