import {
  ClassificationLevel,
  Item,
  ItemType,
  ItemUploadState,
} from "@/features/drivers/types";
import { useItemsClassifications } from "@/features/explorer/hooks/useQueries";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSelectionStore } from "@/features/explorer/stores/selectionStore";
import { useTranslation } from "react-i18next";
import { CellContext, createColumnHelper, Row } from "@tanstack/react-table";
import { useReactTable } from "@tanstack/react-table";
import { getCoreRowModel } from "@tanstack/react-table";
import { AppExplorerProps } from "@/features/explorer/components/app-view/AppExplorer";
import {
  GlobalExplorerContextType,
  NavigationEvent,
  NavigationEventType,
} from "@/features/explorer/components/GlobalExplorerContext";
import { EmbeddedExplorerGridMobileCell } from "@/features/explorer/components/embedded-explorer/EmbeddedExplorerGridMobileCell";
import {
  EmbeddedExplorerGridNameCell,
  EmbeddedExplorerGridNameCellProps,
} from "@/features/explorer/components/embedded-explorer/EmbeddedExplorerGridNameCell";
import { EmbeddedExplorerGridActionsCell } from "@/features/explorer/components/embedded-explorer/EmbeddedExplorerGridActionsCell";
import { useTableKeyboardNavigation } from "@/features/explorer/hooks/useTableKeyboardNavigation";
import clsx from "clsx";
import { isTablet } from "@/features/ui/components/responsive/ResponsiveDivs";
import { useDragItemContext } from "@/features/explorer/components/ExplorerDndProvider";
import { useModal } from "@/components/use-modal";
import { ExplorerMoveFolder } from "@/features/explorer/components/modals/move/ExplorerMoveFolderModal";
import { useContextMenuContext } from "@/components/ds-context-menu";
import { useItemActionMenuItems } from "../../hooks/useItemActionMenuItems";
import { ColumnConfig, ColumnType, SortState } from "../../types/columns";
import { IconSize } from "@/features/ui/components/icon/Icon";
import { useColumnWidths } from "../../hooks/useColumnWidths";
import { useDuplicatingItemsPoller } from "../../hooks/useDuplicatingItemsPoller";
import { DsExplorerGridRow, DsSelectAllCheckbox } from "./DsExplorerGridRow";
import { DsGridSortHeader } from "./headers/DsGridSortHeader";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type EmbeddedExplorerGridProps = {
  isCompact?: boolean;
  enableMetaKeySelection?: boolean;
  disableItemDragAndDrop?: boolean;
  setRightPanelForcedItem?: (item: Item | undefined) => void;
  items: AppExplorerProps["childrenItems"];
  gridActionsCell?: AppExplorerProps["gridActionsCell"];
  gridNameCell?: (params: EmbeddedExplorerGridNameCellProps) => React.ReactNode;
  onNavigate: (event: NavigationEvent) => void;
  parentItem?: Item;
  displayMode?: GlobalExplorerContextType["displayMode"];
  canSelect?: (item: Item) => boolean;
  onFileClick?: (item: Item) => void;
  disableKeyboardNavigation?: boolean;
  // Custom columns
  sortState?: SortState;
  onSort?: (columnId: "title" | ColumnType) => void;
  /** Colonnes de données visibles (ordonnées), N variables. */
  columnConfigs?: ColumnConfig[];
  viewSortable?: boolean;
};

const EMPTY_ARRAY: Item[] = [];
const EMPTY_COLUMN_CONFIGS: ColumnConfig[] = [];
const columnHelper = createColumnHelper<Item>();

// Only the fields actually consumed by cells/hooks — keeping this narrow so
// that the memoized context value stays stable across parent re-renders.
// Adding fields here means cells will re-render on every parent tick that
// changes them, so treat new additions with care.
type EmbeddedExplorerGridContextType = {
  disableItemDragAndDrop?: boolean;
  isActionModalOpen: boolean;
  setIsActionModalOpen: (value: boolean) => void;
  classifications?: Record<string, ClassificationLevel | null>;
};

export const EmbeddedExplorerGridContext = createContext<
  EmbeddedExplorerGridContextType | undefined
>(undefined);

export const useEmbeddedExplorerGirdContext = () => {
  const context = useContext(EmbeddedExplorerGridContext);
  if (!context) {
    throw new Error(
      "useEmbeddedExplorerGirdContext must be used within an EmbeddedExplorerGridContext",
    );
  }
  return context;
};

/**
 * Standalone component to display a list of items in a table.
 *
 * It provides:
 * - Compact and Full mode
 * - Keyboard navigation
 * - Selection
 * - Over
 * - Actions
 * - Mobile support
 * - Table support
 * - Droppable support
 * - Right panel support
 */
export const EmbeddedExplorerGrid = (props: EmbeddedExplorerGridProps) => {
  const { t } = useTranslation();

  const [moveItem, setMoveItem] = useState<Item | null>(null);
  const moveModal = useModal();
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const { getMenuItems: getItemActionMenuItems, modals: itemActionModals } =
    useItemActionMenuItems({
      onModalOpenChange: setIsActionModalOpen,
    });
  const contextMenu = useContextMenuContext();

  useDuplicatingItemsPoller(props.items ?? EMPTY_ARRAY);

  const selectionStore = useSelectionStore();
  // TODO: This hook makes use of the ExplorerContext to manage the overred items. So, this component is not really standalone as it should be.
  const { overedItemIds, setOveredItemIds } = useDragItemContext();

  const lastSelectedRowRef = useRef<string | null>(null);

  const columnConfigs = props.columnConfigs ?? EMPTY_COLUMN_CONFIGS;
  const { getWidth, startResize } = useColumnWidths();
  const resizable = !props.isCompact;

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "mobile",
        cell: EmbeddedExplorerGridMobileCell,
      }),
      columnHelper.accessor("title", {
        id: "title",
        header: t("explorer.grid.name"),
        cell: props.gridNameCell ?? EmbeddedExplorerGridNameCell,
      }),
      ...(props.isCompact
        ? []
        : [
            // Une colonne de données par préférence visible (ordre conservé).
            ...columnConfigs.map((config) =>
              columnHelper.display({
                id: `info-${config.type}`,
                cell: config.cell,
              }),
            ),
            columnHelper.display({
              id: "actions",
              cell: props.gridActionsCell ?? EmbeddedExplorerGridActionsCell,
            }),
          ]),
    ],

    [
      columnConfigs,
      props.isCompact,
      props.gridNameCell,
      props.gridActionsCell,
      t,
    ],
  );

  const table = useReactTable({
    data: props.items ?? EMPTY_ARRAY,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
  });

  const tableRef = useRef<HTMLTableElement>(null);
  const { onKeyDown } = useTableKeyboardNavigation({
    table,
    tableRef,
    isDisabled: isActionModalOpen || props.disableKeyboardNavigation,
  });

  const handleCloseMoveModal = () => {
    moveModal.close();
    setMoveItem(null);
  };

  const canSelect = props.canSelect ?? (() => true);

  const handleSortTitle = useCallback(
    (id: string) => props.onSort?.(id as "title" | ColumnType),
    [props.onSort],
  );

  const handleSortColumn = useCallback(
    (id: string) => props.onSort?.(id as ColumnType),
    [props.onSort],
  );

  // Batch des classifications des items visibles (1 requête, anti-N+1).
  const itemIds = useMemo(
    () => (props.items ?? EMPTY_ARRAY).map((item) => item.id),
    [props.items],
  );
  const { data: classifications } = useItemsClassifications(itemIds);

  const contextValue = useMemo<EmbeddedExplorerGridContextType>(
    () => ({
      disableItemDragAndDrop: props.disableItemDragAndDrop,
      isActionModalOpen,
      setIsActionModalOpen,
      classifications,
    }),
    [props.disableItemDragAndDrop, isActionModalOpen, classifications],
  );

  const applyShiftRangeSelect = useCallback(
    (row: Row<Item>) => {
      const rows = table.getRowModel().rows;
      const lastSelectedIndex = rows.findIndex(
        (r) => r.id === lastSelectedRowRef.current,
      );
      const currentIndex = rows.findIndex((r) => r.id === row.id);
      if (lastSelectedIndex === -1 || currentIndex === -1) {
        return;
      }

      const startIndex = Math.min(lastSelectedIndex, currentIndex);
      const endIndex = Math.max(lastSelectedIndex, currentIndex);
      const newSelection = [...selectionStore.getSelectedItems()];
      for (let i = startIndex; i <= endIndex; i++) {
        if (!selectionStore.isSelected(rows[i].original.id)) {
          newSelection.push(rows[i].original);
        }
      }
      selectionStore.setSelectedItems(newSelection);
    },
    [selectionStore, table],
  );

  const toggleRowSelection = useCallback(
    (row: Row<Item>) => {
      const wasSelected = selectionStore.isSelected(row.original.id);
      selectionStore.setSelectedItems((value) => {
        if (value.some((item) => item.id === row.original.id)) {
          return value.filter((item) => item.id !== row.original.id);
        }
        return [...value, row.original];
      });
      if (!wasSelected) {
        lastSelectedRowRef.current = row.id;
      }
    },
    [selectionStore],
  );

  const replaceRowSelection = useCallback(
    (row: Row<Item>) => {
      selectionStore.setSelectedItems([row.original]);
      lastSelectedRowRef.current = row.id;
      props.setRightPanelForcedItem?.(undefined);
    },
    [selectionStore, props.setRightPanelForcedItem],
  );

  const openRow = useCallback(
    (row: Row<Item>) => {
      if (row.original.type === ItemType.FOLDER) {
        props.onNavigate({
          type: NavigationEventType.ITEM,
          item: row.original,
        });
      } else {
        props.onFileClick?.(row.original);
      }
    },
    [props.onNavigate, props.onFileClick],
  );

  const handleRowClick = useCallback(
    (e: React.MouseEvent<HTMLTableRowElement>, row: Row<Item>) => {
      if (row.original.upload_state === ItemUploadState.DUPLICATING) {
        return;
      }

      // Because if we use modals or other components, even with a Portal, React triggers events on the original parent.
      // So we check that the clicked element is indeed an element of the table.
      if (!(e.target as HTMLElement).closest("tr")) {
        return;
      }

      // In SDK mode we want the popup to behave like desktop. For instance we want the simple click to
      // trigger selection, not to open a file as it is the case on mobile.
      const isMobile = isTablet() && props.displayMode !== "sdk";

      if (isMobile || e.detail === 2) {
        openRow(row);
        return;
      }

      if (e.detail !== 1 || !canSelect(row.original)) {
        return;
      }

      const metaActive =
        props.enableMetaKeySelection &&
        (e.metaKey || e.ctrlKey || props.displayMode === "sdk");

      if (
        props.enableMetaKeySelection &&
        e.shiftKey &&
        lastSelectedRowRef.current
      ) {
        applyShiftRangeSelect(row);
      } else if (metaActive) {
        toggleRowSelection(row);
      } else {
        replaceRowSelection(row);
      }
    },
    [
      props.displayMode,
      props.enableMetaKeySelection,
      canSelect,
      openRow,
      applyShiftRangeSelect,
      toggleRowSelection,
      replaceRowSelection,
    ],
  );

  const handleRowContextMenu = useCallback(
    (e: React.MouseEvent<HTMLTableRowElement>, row: Row<Item>) => {
      if (props.displayMode === "sdk") {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      if (row.original.upload_state === ItemUploadState.DUPLICATING) {
        return;
      }

      selectionStore.setSelectedItems([row.original]);

      contextMenu.open({
        position: { x: e.clientX, y: e.clientY },
        items: getItemActionMenuItems(row.original),
      });
    },
    [props.displayMode, selectionStore, contextMenu, getItemActionMenuItems],
  );

  const handleRowOver = useCallback(
    (rowId: string, isOver: boolean, draggedItem: Item) => {
      setOveredItemIds?.((prev) => ({
        ...prev,
        [rowId]: draggedItem.id === rowId ? false : isOver,
      }));
    },
    [setOveredItemIds],
  );

  const rows = table.getRowModel().rows;

  // Data table shadcn : markup shadcn + colonne de cases + en-têtes triables ;
  // le moteur (TanStack, sélection, DnD, menu contextuel, clavier) est partagé.
  return (
    <EmbeddedExplorerGridContext.Provider value={contextValue}>
      <Table
        ref={tableRef}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className={clsx({ explorer__compact: props.isCompact })}
        // `table-layout: fixed` + <colgroup> : largeurs de colonnes contrôlées
        // (redimensionnables) ; la colonne « Nom » reste SANS largeur → elle
        // absorbe l'espace restant (évite le collapse des autres colonnes).
        style={resizable ? { tableLayout: "fixed" } : undefined}
      >
        {resizable && (
          <colgroup>
            <col style={{ width: 44 }} />
            <col />
            {columnConfigs.map((config) => (
              <col key={config.type} style={{ width: getWidth(config.type) }} />
            ))}
            <col style={{ width: 48 }} />
          </colgroup>
        )}
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-9 ps-3 pe-0">
              <DsSelectAllCheckbox
                rows={rows}
                selectionStore={selectionStore}
              />
            </TableHead>
            <TableHead className="w-full">
              <DsGridSortHeader
                label={t("explorer.grid.name")}
                columnId="title"
                sortState={props.sortState ?? null}
                onSort={handleSortTitle}
                sortable={props.viewSortable !== false}
              />
            </TableHead>
            {!props.isCompact && (
              <>
                {columnConfigs.map((config) => {
                  const ColumnIcon = config.icon;
                  return (
                    <TableHead key={config.type} className="relative">
                      <DsGridSortHeader
                        label={t(config.labelKey)}
                        columnId={config.type}
                        sortState={props.sortState ?? null}
                        onSort={handleSortColumn}
                        sortable={
                          props.viewSortable !== false &&
                          config.sortable !== false
                        }
                        icon={<ColumnIcon size={IconSize.SMALL} />}
                      />
                      {/* Poignée de redimensionnement (bord inline-end). */}
                      <div
                        role="separator"
                        aria-orientation="vertical"
                        aria-label={t(
                          "explorer.grid.columns.resize",
                          "Redimensionner la colonne",
                        )}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          startResize(
                            config.type,
                            event.clientX,
                            getWidth(config.type),
                          );
                        }}
                        className="absolute inset-y-1 end-0 z-10 w-1 cursor-col-resize touch-none rounded bg-transparent transition-colors hover:bg-primary/40"
                      />
                    </TableHead>
                  );
                })}
                <TableHead className="w-12" />
              </>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <DsExplorerGridRow
              key={row.original.id}
              row={row}
              isOvered={!!overedItemIds[row.original.id]}
              onClickRow={handleRowClick}
              onContextMenuRow={handleRowContextMenu}
              onOver={handleRowOver}
              onToggleSelect={toggleRowSelection}
            />
          ))}
        </TableBody>
      </Table>
      {moveModal.isOpen && moveItem && (
        <ExplorerMoveFolder
          {...moveModal}
          onClose={handleCloseMoveModal}
          itemsToMove={[moveItem]}
          initialFolderId={props.parentItem?.id}
        />
      )}
      {itemActionModals}
    </EmbeddedExplorerGridContext.Provider>
  );
};

export type EmbeddedExplorerGridTypeCellProps = CellContext<Item, string> & {
  children?: React.ReactNode;
};
