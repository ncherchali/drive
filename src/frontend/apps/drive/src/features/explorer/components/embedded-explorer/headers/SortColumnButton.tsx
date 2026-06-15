import { useTranslation } from "react-i18next";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { Button as DsButton } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import { SortState } from "@/features/explorer/types/columns";

type SortColumnId = NonNullable<SortState>["columnId"];

type SortColumnButtonProps<TColumnId extends SortColumnId> = {
  columnId: TColumnId;
  sortState: SortState;
  onSort: (columnId: TColumnId) => void;
};

export const SortColumnButton = <TColumnId extends SortColumnId>({
  columnId,
  sortState,
  onSort,
}: SortColumnButtonProps<TColumnId>) => {
  const { t } = useTranslation();

  const isActive = sortState?.columnId === columnId;
  const direction = isActive ? sortState.direction : null;

  const nextTooltip = (() => {
    if (!isActive) return t("explorer.grid.sort.ascending");
    if (direction === "asc") return t("explorer.grid.sort.descending");
    return t("explorer.grid.sort.reset");
  })();

  // Chevrons lucide propres, cohérents avec l'en-tête NOM (DsGridSortHeader) ;
  // ghost (sans boîte), couleur active = foreground. Tooltip natif `title`
  // (pas de TooltipProvider hors d'un wrapper .sahla-ds).
  const sortIcon = !isActive ? (
    <ChevronsUpDown className="size-3.5 opacity-50" />
  ) : direction === "asc" ? (
    <ArrowUp className="size-3.5" />
  ) : (
    <ArrowDown className="size-3.5" />
  );

  return (
    <DsButton
      variant="ghost"
      size="icon"
      className={cn("size-7", isActive && "text-foreground")}
      onClick={(e) => {
        e.stopPropagation();
        onSort(columnId);
      }}
      aria-label={nextTooltip}
      title={nextTooltip}
    >
      {sortIcon}
    </DsButton>
  );
};
