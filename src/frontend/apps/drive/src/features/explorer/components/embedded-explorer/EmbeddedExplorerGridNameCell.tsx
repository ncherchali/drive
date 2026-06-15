import { CellContext } from "@tanstack/react-table";
import { Item, ItemUploadState, LinkReach } from "@/features/drivers/types";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Draggable } from "@/features/explorer/components/Draggable";
import { ItemIcon } from "@/features/explorer/components/icons/ItemIcon";
import { useDisableDragGridItem } from "@/features/explorer/components/embedded-explorer/hooks";
import { Icon, IconSize } from "@/features/ui/components/icon/Icon";
import { removeFileExtension } from "@/features/explorer/utils/fileTypes";
import { LoadingRing } from "@/features/ui/components/loading-ring/LoadingRing";
import { useEmbeddedExplorerGirdContext } from "./EmbeddedExplorerGrid";
import { useIsItemSelected } from "@/features/explorer/stores/selectionStore";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
export type EmbeddedExplorerGridNameCellProps = CellContext<Item, string> & {
  children?: React.ReactNode;
};

const EmbeddedExplorerGridNameCellComponent = (
  params: EmbeddedExplorerGridNameCellProps,
) => {
  const item = params.row.original;
  const { t } = useTranslation();
  const ref = useRef<HTMLSpanElement>(null);
  const [isOverflown, setIsOverflown] = useState(false);
  const { disableItemDragAndDrop } = useEmbeddedExplorerGirdContext();
  const isSelected = useIsItemSelected(item.id);
  const isDuplicating = item.upload_state === ItemUploadState.DUPLICATING;

  const disableDrag = useDisableDragGridItem(item);

  const renderTitle = () => {
    // We need to have the element holding the ref nested because the Tooltip component
    // seems to make the top-most children ref null.
    return (
      <Draggable
        id={params.cell.id + "-title"}
        item={item}
        className="explorer__grid__item__name__title-wrapper"
        disabled={isDuplicating || disableItemDragAndDrop || isSelected} // If it's selected then we can drag on the entire cell
      >
        <div
          className="explorer__grid__item__name__title-wrapper"
          title={isOverflown ? item.title : undefined}
        >
          <span
            className={clsx("explorer__grid__item__name__text", {
              "explorer__grid__item__name--duplicating-text": isDuplicating,
            })}
            ref={ref}
          >
            {removeFileExtension(item.title)}
            {isDuplicating && (
              <span className="explorer__grid__item__name__duplicating-label">
                {" "}
                ({t("explorer.item.duplicating")})
              </span>
            )}
            {params.children}
          </span>
        </div>
      </Draggable>
    );
  };

  useEffect(() => {
    const checkOverflow = () => {
      const element = ref.current;
      // Should always be defined, but just in case.
      if (element) {
        setIsOverflown(element.scrollWidth > element.clientWidth);
      }
    };
    checkOverflow();

    window.addEventListener("resize", checkOverflow);
    return () => {
      window.removeEventListener("resize", checkOverflow);
    };
  }, [item.title]);

  const rightIcon = useMemo(() => {
    let icon: string | null = null;

    if (item.computed_link_reach === LinkReach.PUBLIC) {
      icon = "public";
    } else if (item.nb_accesses && item.nb_accesses > 1) {
      icon = "people";
    }
    return icon;
  }, [item.computed_link_reach, item.link_reach, item.nb_accesses]);

  return (
    <Draggable
      id={params.cell.id}
      item={item}
      disabled={isDuplicating || disableDrag}
    >
      <div
        className={clsx("explorer__grid__item__name", {
          "explorer__grid__item__name--duplicating": isDuplicating,
        })}
      >
        {isDuplicating ? (
          <div className="explorer__grid__item__name__spinner-container">
            <LoadingRing size="md" />
          </div>
        ) : (
          <ItemIcon key={item.id} item={item} size={IconSize.LARGE} />
        )}
        {renderTitle()}
        {rightIcon && (
          <Icon
            name={rightIcon}
            size={IconSize.SMALL}
            color="var(--muted-foreground)"
          />
        )}
      </div>
    </Draggable>
  );
};

export const EmbeddedExplorerGridNameCell = memo(
  EmbeddedExplorerGridNameCellComponent,
);
