// Adaptateur de menu DS — pont data-driven ui-kit → Design System.
// Pages Router : pas de "use client".
//
// Le `DropdownMenu` de @gouvfr-lasuite/ui-kit est piloté par DONNÉES
// (`options={MenuItem[]}`), alimenté par les hooks métier (useItemActionMenuItems,
// useCreateMenuItems, useItemActionMenuItems…). Ce pont expose EXACTEMENT la même
// API mais rend, derrière le flag DS_APP_SHELL, les primitives DS (dropdown-menu).
// Flag éteint, il délègue au composant ui-kit d'origine. Les hooks restent donc
// inchangés ; seul l'import du call site bascule.
//
// Contrôle d'ouverture : la version DS est NON contrôlée côté Radix (le trigger
// gère l'état), et `onOpenChange` informe le parent. Les call sites conservent
// souvent un `onClick` d'ouverture sur leur bouton : il devient inoffensif (il
// met à jour un état parent que Radix n'écoute pas), évitant tout double toggle.
import * as React from "react";
import { DropdownMenu as UiKitDropdownMenu } from "@gouvfr-lasuite/ui-kit";
import { Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  FLAG_DS_APP_SHELL,
  useFeatureFlag,
} from "@/features/flags/useFeatureFlag";

type MenuDropdownProps = React.ComponentProps<typeof UiKitDropdownMenu>;

/** Vue permissive d'un item : superset réellement passé par les call sites. */
type ActionEntry = {
  type?: undefined;
  id?: string;
  label: string;
  subText?: string;
  icon?: React.ReactNode;
  callback?: () => void | Promise<unknown>;
  isDisabled?: boolean;
  isHidden?: boolean;
  isChecked?: boolean;
  variant?: "default" | "danger";
  keepOpen?: boolean;
  testId?: string;
};
type SeparatorEntry = { type: "separator" };
type Entry = ActionEntry | SeparatorEntry;

function isSeparator(entry: Entry): entry is SeparatorEntry {
  return (entry as SeparatorEntry).type === "separator";
}

function DsMenuItems({ options }: { options: Entry[] }) {
  return (
    <>
      {options.map((entry, index) => {
        if (isSeparator(entry)) {
          return <DropdownMenuSeparator key={`sep-${index}`} />;
        }
        if (entry.isHidden) {
          return null;
        }
        return (
          <DropdownMenuItem
            key={entry.id ?? `${entry.label}-${index}`}
            variant={entry.variant === "danger" ? "destructive" : "default"}
            disabled={entry.isDisabled}
            data-testid={entry.testId}
            onSelect={(event) => {
              // `keepOpen` : empêche la fermeture (ex. bascules dans le menu).
              if (entry.keepOpen) {
                event.preventDefault();
              }
              void entry.callback?.();
            }}
          >
            {entry.icon != null && (
              <span className="flex size-4 shrink-0 items-center justify-center [&_img]:size-4 [&_svg]:size-4">
                {entry.icon}
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate">{entry.label}</span>
              {entry.subText && (
                <span className="block truncate text-xs text-muted-foreground">
                  {entry.subText}
                </span>
              )}
            </span>
            {entry.isChecked && <Check className="ms-auto size-4" aria-hidden />}
          </DropdownMenuItem>
        );
      })}
    </>
  );
}

function MenuDropdownDs({ options, onOpenChange, children }: MenuDropdownProps) {
  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      {/* `.sahla-ds` : reset scopé sur le contenu portalé (hors du sous-arbre DS). */}
      <DropdownMenuContent className="sahla-ds">
        <DsMenuItems options={(options ?? []) as Entry[]} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Menu déroulant à API ui-kit (`options`, `isOpen`, `onOpenChange`, children).
 * Rend le DS derrière le flag DS_APP_SHELL, sinon le composant ui-kit d'origine.
 */
export function MenuDropdown(props: MenuDropdownProps) {
  const useDs = useFeatureFlag(FLAG_DS_APP_SHELL);
  if (useDs) {
    return <MenuDropdownDs {...props} />;
  }
  return <UiKitDropdownMenu {...props} />;
}
