// Rangée d'arbre — Design System (remplace `TreeViewItem` de l'ui-kit DINUM).
//
// C'est le `renderNode` de react-arborist : la rangée externe (positionnement
// absolu + sélection au clic) est gérée par le Row par défaut de react-arborist ;
// ici on ne fait que l'INDENTATION (prop `style`), le `dragHandle`, le chevron
// d'expansion (node.toggle) et le contenu (children). Pages Router : pas de
// "use client".
import * as React from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import type { NodeRendererProps } from "react-arborist";
import type { TreeDataItem } from "./tree-types";
import { cn } from "@/utils/cn";

export type TreeViewItemProps<T> = NodeRendererProps<TreeDataItem<T>> & {
  children?: React.ReactNode;
  itemProps?: React.HTMLAttributes<HTMLDivElement>;
  onClick?: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  forceLoading?: boolean;
  testId?: string;
};

export function TreeViewItem<T>({
  node,
  style,
  dragHandle,
  children,
  itemProps,
  onClick,
  onKeyDown,
  testId,
}: TreeViewItemProps<T>) {
  return (
    <div
      ref={dragHandle}
      style={style}
      data-testid={testId}
      onKeyDown={onKeyDown}
      {...itemProps}
      className={cn("flex h-full items-center", itemProps?.className)}
    >
      {node.isLeaf ? (
        // Espaceur pour aligner les feuilles sur les nœuds dépliables.
        <span className="size-5 shrink-0" aria-hidden />
      ) : (
        <button
          type="button"
          aria-label={node.isOpen ? "Réduire" : "Développer"}
          className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground"
          onClick={(e) => {
            e.stopPropagation();
            node.toggle();
          }}
        >
          {node.isOpen ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
        </button>
      )}
      <div className="min-w-0 flex-1" onClick={onClick}>
        {children}
      </div>
    </div>
  );
}
