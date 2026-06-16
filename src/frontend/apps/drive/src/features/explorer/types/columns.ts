import React from "react";
import { CellContext } from "@tanstack/react-table";
import { Item } from "@/features/drivers/types";
import { IconProps } from "@/features/ui/components/icon/Icon";

export enum ColumnType {
  LAST_MODIFIED = "last_modified",
  CREATED = "created",
  CREATED_BY = "created_by",
  FILE_TYPE = "file_type",
  FILE_SIZE = "file_size",
}

export type SortDirection = "asc" | "desc";

export type SortState = {
  columnId: "title" | ColumnType;
  direction: SortDirection;
} | null;

/** Liste ORDONNÉE des colonnes de données affichées dans la grille (ajout/retrait
 *  via le menu « Colonnes »). Remplace l'ancien duo de slots fixes. */
export type ColumnPreferences = {
  columns: ColumnType[];
};

export const DEFAULT_COLUMN_PREFERENCES: ColumnPreferences = {
  columns: [ColumnType.LAST_MODIFIED, ColumnType.CREATED_BY],
};

/** Toutes les colonnes proposables au menu « Colonnes », dans l'ordre d'offre. */
export const ALL_COLUMN_TYPES: ColumnType[] = Object.values(ColumnType);

export type ColumnCellProps = CellContext<Item, unknown>;

export type ColumnConfig = {
  type: ColumnType;
  labelKey: string;
  icon: React.ComponentType<IconProps>;
  orderingField: string;
  cell: React.FC<ColumnCellProps>;
  sortable?: boolean;
};
