// Ligne de la data table shadcn (variante DS de EmbeddedExplorerGridRow).
// Réutilise le MOTEUR (TanStack Row, Droppable/DnD, selectionStore, cells via
// flexRender) mais rend le markup avec les primitives shadcn <TableRow>/<TableCell>
// + une colonne de case à cocher. Rendue derrière le flag DS_EXPLORER_GRID par
// EmbeddedExplorerGrid. Pages Router : pas de "use client".
import { memo } from "react";
import { Row, flexRender } from "@tanstack/react-table";
import clsx from "clsx";
import { Item, ItemType, ItemUploadState } from "@/features/drivers/types";
import { Droppable } from "@/features/explorer/components/Droppable";
import {
  useIsItemSelected,
  useSelectionCount,
  SelectionStore,
} from "@/features/explorer/stores/selectionStore";
import { TableRow, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

export type DsExplorerGridRowProps = {
  row: Row<Item>;
  isOvered: boolean;
  onClickRow: (e: React.MouseEvent<HTMLTableRowElement>, row: Row<Item>) => void;
  onContextMenuRow: (
    e: React.MouseEvent<HTMLTableRowElement>,
    row: Row<Item>,
  ) => void;
  onOver: (rowId: string, isOver: boolean, draggedItem: Item) => void;
  onToggleSelect: (row: Row<Item>) => void;
};

const DsExplorerGridRowComponent = ({
  row,
  isOvered,
  onClickRow,
  onContextMenuRow,
  onOver,
  onToggleSelect,
}: DsExplorerGridRowProps) => {
  const item = row.original;
  const isSelected = useIsItemSelected(item.id);
  const isDuplicating = item.upload_state === ItemUploadState.DUPLICATING;
  // La colonne « mobile » (vue combinée) est hors data table desktop.
  const cells = row.getVisibleCells().filter((c) => c.column.id !== "mobile");

  return (
    <TableRow
      data-id={item.id}
      data-state={isSelected ? "selected" : undefined}
      tabIndex={0}
      className={clsx("cursor-pointer", {
        "pointer-events-none opacity-60": isDuplicating,
        "bg-primary/10 ring-1 ring-inset ring-primary": isOvered,
      })}
      onClick={(e) => onClickRow(e, row)}
      onContextMenu={(e) => onContextMenuRow(e, row)}
    >
      <TableCell
        className="w-9 ps-3"
        onClick={(e) => e.stopPropagation()}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(row)}
          aria-label="Sélectionner la ligne"
          disabled={isDuplicating}
        />
      </TableCell>
      {cells.map((cell) => (
        <TableCell
          key={cell.id}
          className={clsx({
            "text-end": cell.column.id === "actions",
          })}
        >
          <Droppable
            id={cell.id}
            item={item}
            disabled={
              isSelected ||
              item.type !== ItemType.FOLDER ||
              !item.abilities?.children_create
            }
            onOver={(isOver, draggedItem) => onOver(item.id, isOver, draggedItem)}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </Droppable>
        </TableCell>
      ))}
    </TableRow>
  );
};

export const DsExplorerGridRow = memo(DsExplorerGridRowComponent);

/** Case « tout sélectionner » de l'en-tête, réactive à la sélection. */
export const DsSelectAllCheckbox = ({
  rows,
  selectionStore,
}: {
  rows: Row<Item>[];
  selectionStore: SelectionStore;
}) => {
  const count = useSelectionCount();
  const selectable = rows.filter(
    (r) => r.original.upload_state !== ItemUploadState.DUPLICATING,
  );
  const allSelected =
    selectable.length > 0 &&
    selectable.every((r) => selectionStore.isSelected(r.original.id));
  const checked = count === 0 ? false : allSelected ? true : "indeterminate";

  return (
    <Checkbox
      checked={checked}
      aria-label="Tout sélectionner"
      disabled={selectable.length === 0}
      onCheckedChange={() => {
        if (count > 0) {
          selectionStore.clear();
        } else {
          selectionStore.setSelectedItems(selectable.map((r) => r.original));
        }
      }}
    />
  );
};
