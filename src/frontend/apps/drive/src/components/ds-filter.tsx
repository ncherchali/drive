// Adaptateur de filtre DS — pont data-driven ui-kit → Design System.
// Pages Router : pas de "use client".
//
// Le `Filter` de @gouvfr-lasuite/ui-kit est un dropdown mono-sélection « chip »
// (label + options { value, label, render?, showSeparator? }, `selectedKey`,
// `onSelectionChange`). Ce pont expose la même API : derrière le flag
// DS_APP_SHELL il rend une version DS (popover + liste sélectionnable), sinon il
// délègue au composant ui-kit. Les filtres métier (ExplorerFilterType/Workspace/
// Scope) restent inchangés ; seul leur primitif de rendu bascule.
//
// Auto-suffisance : le déclencheur fixe `border-solid` explicitement et le
// contenu portalé porte `.sahla-ds`, pour un rendu correct même hors d'un
// sous-arbre `.sahla-ds` (barre de grille, modale de recherche…).
import * as React from "react";
import { Filter as UiKitFilter } from "@gouvfr-lasuite/ui-kit";
import type { Key } from "react-aria-components";
import { Check, ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  FLAG_DS_APP_SHELL,
  useFeatureFlag,
} from "@/features/flags/useFeatureFlag";
import { cn } from "@/utils/cn";

type FilterProps = React.ComponentProps<typeof UiKitFilter>;

/** Vue permissive d'une option (superset réellement passé par les filtres). */
type Option = {
  label: string;
  value?: Key;
  render?: () => React.ReactNode;
  showSeparator?: boolean;
};

function DsFilter({
  label,
  options,
  selectedKey,
  onSelectionChange,
  isDisabled,
}: FilterProps) {
  const [open, setOpen] = React.useState(false);
  const list = (options ?? []) as Option[];
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
 * Filtre « chip » à API ui-kit (`label`, `options`, `selectedKey`,
 * `onSelectionChange`, `isDisabled`). Rend le DS derrière le flag DS_APP_SHELL,
 * sinon le composant ui-kit d'origine.
 */
export function FilterControl(props: FilterProps) {
  const useDs = useFeatureFlag(FLAG_DS_APP_SHELL);
  if (useDs) {
    return <DsFilter {...props} />;
  }
  return <UiKitFilter {...props} />;
}
