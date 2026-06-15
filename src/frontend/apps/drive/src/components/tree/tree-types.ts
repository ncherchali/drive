// Types de l'arbre — Design System.
//
// Remplacent les types de @gouvfr-lasuite/ui-kit qui n'étaient eux-mêmes que des
// alias autour de react-arborist (le <TreeView> ui-kit est un mince wrapper de
// react-arborist <Tree>). On promeut react-arborist en dépendance DIRECTE et on
// reproduit ici la forme EXACTE des types ui-kit consommés par l'app
// (ExplorerTreeItem, le store, les hooks) → compat structurelle, 0 changement
// côté consommateurs.
import type { NodeApi, TreeApi, NodeRendererProps } from "react-arborist";

/** Nature d'un nœud d'arbre (valeur — utilisée dans canDrag/canDrop). */
export enum TreeViewNodeTypeEnum {
  NODE = "node",
  SEPARATOR = "separator",
  TITLE = "title",
  SIMPLE_NODE = "simpleNode",
  VIEW_MORE = "viewMore",
}

/** Mode de déplacement (react-arborist ne fait que des « move »). */
export enum TreeViewMoveModeEnum {
  MOVE = "move",
}

/** État ouvert/fermé des nœuds, indexé par id. */
export type OpenMap = { [id: string]: boolean };

/** Pagination des enfants chargés à la demande. */
export type TreePagination = {
  currentPage: number;
  totalCount?: number;
  hasMore: boolean;
};

/**
 * Donnée d'un nœud. Union discriminée par `nodeType` (identique à ui-kit) : un
 * vrai nœud porte le type métier `T` ; les variantes title/separator/view-more
 * sont des nœuds de présentation.
 */
export type BaseTreeViewData<T> = {
  id: string;
  childrenCount?: number;
  hasLoadedChildren?: boolean;
  children?: BaseTreeViewData<T>[];
  pagination?: TreePagination;
  canDrop?: boolean;
} & (
  | { nodeType: TreeViewNodeTypeEnum.SIMPLE_NODE; label: string }
  | { nodeType: TreeViewNodeTypeEnum.TITLE; headerTitle: string }
  | { nodeType: TreeViewNodeTypeEnum.SEPARATOR }
  | { nodeType: TreeViewNodeTypeEnum.VIEW_MORE; label?: string }
  | ({
      nodeType?: Exclude<
        TreeViewNodeTypeEnum,
        | TreeViewNodeTypeEnum.TITLE
        | TreeViewNodeTypeEnum.SEPARATOR
        | TreeViewNodeTypeEnum.VIEW_MORE
        | TreeViewNodeTypeEnum.SIMPLE_NODE
      >;
    } & T)
);

export type TreeViewDataType<T> = BaseTreeViewData<T>;

/** Nœud matérialisé fourni à react-arborist (key/parentKey/value/children). */
export type TreeDataItem<T> = {
  key: string;
  parentKey?: string | null;
  value: TreeViewDataType<T>;
  children: TreeDataItem<T>[] | null;
};

/** Résultat d'un déplacement, normalisé depuis le MoveHandler react-arborist. */
export type TreeViewMoveResult = {
  targetModeId: string;
  mode: TreeViewMoveModeEnum;
  oldParentId?: string;
  index: number;
  newParentId: string | null;
  sourceId: string;
};

/** Résultat d'un chargement paginé d'enfants. */
export type PaginatedChildrenResult<T> = {
  children?: TreeViewDataType<T>[];
  pagination?: TreePagination;
};

// Ré-exports des types react-arborist consommés (NodeApi/NodeRendererProps par
// ExplorerTreeItem, TreeApi par le contexte).
export type { NodeApi, TreeApi, NodeRendererProps };
