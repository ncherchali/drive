// En-tête de colonne triable, style shadcn data table : libellé cliquable +
// indicateur de tri (chevrons / flèche). Remplace le bouton de tri circulaire
// ui-kit dans la branche DS. Pages Router : pas de "use client".
import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/utils/cn";
import { SortState } from "@/features/explorer/types/columns";

type SortColumnId = NonNullable<SortState>["columnId"];

export type DsGridSortHeaderProps = {
  label: string;
  columnId: SortColumnId;
  sortState: SortState;
  onSort: (columnId: SortColumnId) => void;
  sortable?: boolean;
  /** Icône optionnelle (colonnes de données) affichée avant le libellé. */
  icon?: ReactNode;
};

export const DsGridSortHeader = ({
  label,
  columnId,
  sortState,
  onSort,
  sortable = true,
  icon,
}: DsGridSortHeaderProps) => {
  const active = sortState?.columnId === columnId;

  if (!sortable) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSort(columnId)}
      className={cn(
        "-mx-1.5 inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs font-semibold uppercase tracking-wide transition-colors hover:bg-muted",
        active ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {icon}
      {label}
      {active ? (
        sortState!.direction === "asc" ? (
          <ArrowUp className="size-3.5" />
        ) : (
          <ArrowDown className="size-3.5" />
        )
      ) : (
        <ChevronsUpDown className="size-3.5 opacity-50" />
      )}
    </button>
  );
};
