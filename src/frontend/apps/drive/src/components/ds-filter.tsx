// Filtre « chip » Design System — dropdown mono-sélection (label + options
// { value, label, render?, showSeparator? }, `selectedKey`, `onSelectionChange`).
// Pages Router : pas de "use client".
//
// Remplace le `Filter` de l'ui-kit DINUM (dépose totale) : popover + liste
// sélectionnable, types locaux. Les filtres métier (ExplorerFilterType/Workspace/
// Scope) consomment ce composant via `FilterControl`.
//
// Auto-suffisance : le déclencheur fixe `border-solid` explicitement et le
// contenu portalé porte `.sahla-ds`, pour un rendu correct même hors d'un
// sous-arbre `.sahla-ds` (barre de grille, modale de recherche…).
import * as React from "react";
import type { Key } from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

/** Option d'un filtre « chip ». */
export type FilterOption = {
  label: string;
  value?: Key;
  render?: () => React.ReactNode;
  showSeparator?: boolean;
};

export type FilterProps = {
  label: string;
  options?: FilterOption[];
  selectedKey?: Key | null;
  onSelectionChange?: (key: Key | null) => void;
  isDisabled?: boolean;
};

function DsFilter({
  label,
  options,
  selectedKey,
  onSelectionChange,
  isDisabled,
}: FilterProps) {
  const [open, setOpen] = React.useState(false);
  const list = options ?? [];
  const isActive = selectedKey != null;
  const selected = list.find(
    (option) => String(option.value) === String(selectedKey),
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isDisabled}
          className={cn(
            "gap-1.5 border-solid",
            isActive && "border-primary text-primary",
          )}
        >
          <span className="truncate">
            {isActive && selected ? `${label} : ${selected.label}` : label}
          </span>
          <ChevronDown className="opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="sahla-ds w-56 p-1">
        {list.map((option, index) => {
          const isSelected =
            option.value != null &&
            String(option.value) === String(selectedKey);
          return (
            <React.Fragment key={`${String(option.value)}-${index}`}>
              <button
                type="button"
                className={cn(
                  "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-start text-sm outline-none",
                  "hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent",
                  "[&_img]:size-4 [&_svg]:size-4",
                )}
                onClick={() => {
                  onSelectionChange?.(option.value ?? null);
                  setOpen(false);
                }}
              >
                <span className="min-w-0 flex-1 truncate">
                  {option.render ? option.render() : option.label}
                </span>
                {isSelected && <Check className="size-4 shrink-0" aria-hidden />}
              </button>
              {option.showSeparator && (
                <div className="-mx-1 my-1 h-px bg-border" />
              )}
            </React.Fragment>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

/**
 * Filtre « chip » data-driven (`label`, `options`, `selectedKey`,
 * `onSelectionChange`, `isDisabled`) — rendu Design System.
 */
export function FilterControl(props: FilterProps) {
  return <DsFilter {...props} />;
}
