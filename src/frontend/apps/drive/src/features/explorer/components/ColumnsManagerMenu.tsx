// Menu « Colonnes » : ajoute/retire ET réordonne (drag) les colonnes de données
// de la grille. Les choix sont persistés via useColumnPreferences (→ backend
// user.column_preferences.columns).
//
// Popover (et non DropdownMenu) : le menu Radix intercepte les events pointeur
// (navigation/typeahead) et casserait le drag HTML5 natif. Le reorder est en
// drag HTML5 natif (pas de @dnd-kit/sortable, et pas de DndContext imbriqué avec
// le DnD fichiers). Pages Router : pas de "use client".
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Columns3, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { ALL_COLUMN_TYPES, ColumnType } from "../types/columns";
import { COLUMN_REGISTRY } from "../config/columnRegistry";
import { useColumnPreferences } from "../hooks/useColumnPreferences";
import { IconSize } from "@/features/ui/components/icon/Icon";
import { cn } from "@/utils/cn";

export const ColumnsManagerMenu = () => {
  const { t } = useTranslation();
  const { prefs, toggleColumn, setColumns } = useColumnPreferences();
  // Ref pour le type dragué : lue de façon SYNCHRONE dans onDrop (un state seul
  // poserait une closure périmée si drop suit dragstart sans re-render). Le state
  // `dragType` ne sert qu'au rendu (surbrillance), tenu en phase avec la ref.
  const dragTypeRef = useRef<ColumnType | null>(null);
  const [dragType, setDragType] = useState<ColumnType | null>(null);
  const [overType, setOverType] = useState<ColumnType | null>(null);

  const visible = prefs.columns;
  const hidden = ALL_COLUMN_TYPES.filter((type) => !visible.includes(type));

  const reorder = (from: ColumnType, to: ColumnType) => {
    if (from === to) {
      return;
    }
    const cols = [...visible];
    const fromIdx = cols.indexOf(from);
    const toIdx = cols.indexOf(to);
    if (fromIdx < 0 || toIdx < 0) {
      return;
    }
    cols.splice(fromIdx, 1);
    cols.splice(toIdx, 0, from);
    setColumns(cols);
  };

  const resetDrag = () => {
    dragTypeRef.current = null;
    setDragType(null);
    setOverType(null);
  };

  const renderRow = (type: ColumnType, draggable: boolean) => {
    const config = COLUMN_REGISTRY[type];
    const ColumnIcon = config.icon;
    const checked = visible.includes(type);
    const isOver = draggable && overType === type && dragType && dragType !== type;

    return (
      <div
        key={type}
        draggable={draggable}
        onDragStart={
          draggable
            ? () => {
                dragTypeRef.current = type;
                setDragType(type);
              }
            : undefined
        }
        onDragOver={
          draggable
            ? (event) => {
                event.preventDefault();
                setOverType(type);
              }
            : undefined
        }
        onDrop={
          draggable
            ? (event) => {
                event.preventDefault();
                if (dragTypeRef.current) {
                  reorder(dragTypeRef.current, type);
                }
                resetDrag();
              }
            : undefined
        }
        onDragEnd={resetDrag}
        className={cn(
          "flex items-center gap-2 rounded-md px-1.5 py-1.5 text-sm transition-colors",
          draggable && "cursor-grab active:cursor-grabbing",
          isOver && "ring-1 ring-primary",
        )}
      >
        {draggable ? (
          <GripVertical
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
        ) : (
          <span className="size-4 shrink-0" aria-hidden />
        )}
        <ColumnIcon size={IconSize.SMALL} />
        <span className="flex-1 truncate">{t(config.labelKey)}</span>
        <Checkbox
          checked={checked}
          onCheckedChange={() => toggleColumn(type)}
          aria-label={t(config.labelKey)}
        />
      </div>
    );
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          aria-label={t("explorer.grid.columns.manage", "Colonnes")}
        >
          <Columns3 className="size-4" />
          {t("explorer.grid.columns.manage", "Colonnes")}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-60 p-2">
        <p className="px-1.5 pb-1.5 text-xs font-medium text-muted-foreground">
          {t("explorer.grid.columns.manage", "Colonnes")}
        </p>
        <div className="flex flex-col">
          {visible.map((type) => renderRow(type, true))}
          {hidden.length > 0 && visible.length > 0 && (
            <div className="my-1 h-px bg-border" />
          )}
          {hidden.map((type) => renderRow(type, false))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
