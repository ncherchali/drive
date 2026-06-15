import { CellContext } from "@tanstack/react-table";
import { Item } from "@/features/drivers/types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { timeAgo } from "@/features/explorer/utils/utils";
import { Draggable } from "@/features/explorer/components/Draggable";
import { useDisableDragGridItem } from "@/features/explorer/components/embedded-explorer/hooks";

export const CreatedCell = (params: CellContext<Item, unknown>) => {
  const item = params.row.original;
  const disableDrag = useDisableDragGridItem(item);

  return (
    <Draggable id={params.cell.id} item={item} disabled={disableDrag}>
      <div className="explorer__grid__item__cell-value">
        <Tooltip>
          <TooltipTrigger asChild>
            <span>{timeAgo(new Date(item.created_at))}</span>
          </TooltipTrigger>
          <TooltipContent>{item.created_at.toLocaleString()}</TooltipContent>
        </Tooltip>
      </div>
    </Draggable>
  );
};
