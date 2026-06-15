// Menu DS data-driven — Design System (anciennement pont vers l'ui-kit DINUM).
// Pages Router : pas de "use client".
//
// Menu piloté par DONNÉES (`options={MenuItem[]}`), alimenté par les hooks métier
// (useItemActionMenuItems, useCreateMenuItems…). Depuis la dépose totale d'ui-kit,
// ce composant rend TOUJOURS les primitives DS (dropdown-menu / context-menu) ;
// l'ancien repli ui-kit derrière le flag DS_APP_SHELL a été retiré (le DS est la
// seule cible). Les types de menu, jadis importés d'ui-kit, sont définis ici (forme
// identique → compat structurelle avec les hooks qui produisent encore `MenuItem[]`).
//
// Contrôle d'ouverture : non contrôlé côté Radix (le trigger gère l'état), et
// `onOpenChange` informe le parent. Les call sites conservent souvent un `onClick`
// d'ouverture sur leur bouton : il devient inoffensif (état parent que Radix
// n'écoute pas), évitant tout double toggle.
import * as React from "react";
import { Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";

/* -------------------------------------------------------------------------- */
/* Types de menu — locaux (forme identique aux ex-types ui-kit MenuItem/…).   */
/* -------------------------------------------------------------------------- */

/** Action de menu, partagée entre menu déroulant et menu contextuel. */
export type MenuItemAction = {
  id?: string;
  label: string;
  subText?: string;
  icon?: React.ReactNode;
  callback?: () => void | Promise<unknown>;
  isDisabled?: boolean;
  isHidden?: boolean;
  variant?: "default" | "danger";
  keepOpen?: boolean;
  testId?: string;
  children?: MenuItem[];
};
/** Séparateur de menu. */
export type MenuItemSeparator = { type: "separator" };
export type MenuItem = MenuItemAction | MenuItemSeparator;

/** Option de menu déroulant : ajoute la sélection (`isChecked`/`value`). */
export type DropdownMenuOption = MenuItemAction & {
  isChecked?: boolean;
  value?: string;
  /** @deprecated utiliser un MenuItemSeparator */
  showSeparator?: boolean;
};
export type DropdownMenuItem = DropdownMenuOption | MenuItemSeparator;

/** Remplace le `useDropdownMenu` d'ui-kit (état d'ouverture du menu). */
export function useDropdownMenu() {
  const [isOpen, setIsOpen] = React.useState(false);
  return { isOpen, setIsOpen };
}

/* -------------------------------------------------------------------------- */
/* Menu déroulant.                                                            */
/* -------------------------------------------------------------------------- */

type MenuDropdownProps = React.PropsWithChildren<{
  options: DropdownMenuItem[];
  onOpenChange?: (isOpen: boolean) => void;
  isOpen?: boolean;
  selectedValues?: string[];
  onSelectValue?: (value: string) => void;
  topMessage?: React.ReactNode;
  shouldCloseOnInteractOutside?: (element: Element) => boolean;
  variant?: "default" | "tiny";
}>;

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
 * Menu déroulant data-driven (`options`, `isOpen`, `onOpenChange`, children).
 * Rend les primitives DS.
 */
export function MenuDropdown(props: MenuDropdownProps) {
  return <MenuDropdownDs {...props} />;
}

/* -------------------------------------------------------------------------- */
/* Menu contextuel (clic droit) — même type MenuItem.                         */
/* -------------------------------------------------------------------------- */

type MenuContextProps = {
  children: React.ReactNode;
  options: MenuItem[] | ((context: unknown) => MenuItem[]);
  context?: unknown;
  disabled?: boolean;
  asChild?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
};

/** Rendu DS des items pour le menu contextuel (parallèle de DsMenuItems). */
function DsContextItems({ options }: { options: Entry[] }) {
  return (
    <>
      {options.map((entry, index) => {
        if (isSeparator(entry)) {
          return <ContextMenuSeparator key={`sep-${index}`} />;
        }
        if (entry.isHidden) {
          return null;
        }
        return (
          <ContextMenuItem
            key={entry.id ?? `${entry.label}-${index}`}
            variant={entry.variant === "danger" ? "destructive" : "default"}
            disabled={entry.isDisabled}
            data-testid={entry.testId}
            onSelect={(event) => {
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
          </ContextMenuItem>
        );
      })}
    </>
  );
}

function MenuContextDs({
  options,
  context,
  disabled,
  children,
}: MenuContextProps) {
  // `options` peut être un tableau ou une fonction (context) => MenuItem[].
  const items = (
    typeof options === "function" ? options(context as never) : (options ?? [])
  ) as Entry[];
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild disabled={disabled}>
        {/* `display:contents` : zone de clic droit SANS boîte ajoutée (layout
            inchangé) ; les événements des enfants remontent au trigger. */}
        <div style={{ display: "contents" }}>{children}</div>
      </ContextMenuTrigger>
      <ContextMenuContent className="sahla-ds">
        <DsContextItems options={items} />
      </ContextMenuContent>
    </ContextMenu>
  );
}

/**
 * Menu contextuel déclaratif data-driven (`options`, `context`, `disabled`,
 * children). Rend les primitives DS.
 */
export function MenuContext(props: MenuContextProps) {
  return <MenuContextDs {...props} />;
}
