// Menu contextuel position-based — Design System (remplace ContextMenuProvider /
// useContextMenuContext de l'ui-kit DINUM). API impérative : un seul menu global
// ouvert au curseur via `useContextMenuContext().open({ position, items })`.
// Implémenté avec un DropdownMenu Radix contrôlé + un trigger fixe positionné au
// curseur. Pages Router : pas de "use client".
import * as React from "react";
import { Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { MenuItem, MenuItemAction } from "@/components/ds-menu";

type Position = { x: number; y: number };
type OpenConfig = {
  position: Position;
  items: MenuItem[];
  onBlur?: () => void;
};
type ContextMenuContextValue = {
  open: (config: OpenConfig) => void;
  close: () => void;
};

const ContextMenuContext =
  React.createContext<ContextMenuContextValue | null>(null);

export const useContextMenuContext = () => {
  const context = React.useContext(ContextMenuContext);
  if (!context) {
    throw new Error("ContextMenu must be used within a ContextMenuProvider");
  }
  return context;
};

const isSeparator = (item: MenuItem): item is { type: "separator" } =>
  "type" in item && item.type === "separator";

function ContextMenuItems({ items }: { items: MenuItem[] }) {
  return (
    <>
      {items.map((item, index) => {
        if (isSeparator(item)) {
          return <DropdownMenuSeparator key={`sep-${index}`} />;
        }
        const entry = item as MenuItemAction & {
          isHidden?: boolean;
          isChecked?: boolean;
          isDisabled?: boolean;
          subText?: string;
          testId?: string;
        };
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

export const ContextMenuProvider = ({
  children,
}: {
  children?: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [position, setPosition] = React.useState<Position>({ x: 0, y: 0 });
  const [items, setItems] = React.useState<MenuItem[]>([]);
  const onBlurRef = React.useRef<(() => void) | undefined>(undefined);

  const close = React.useCallback(() => {
    onBlurRef.current?.();
    onBlurRef.current = undefined;
    setIsOpen(false);
  }, []);

  const open = React.useCallback((config: OpenConfig) => {
    onBlurRef.current?.();
    onBlurRef.current = config.onBlur;
    setPosition(config.position);
    setItems(config.items);
    setIsOpen(true);
  }, []);

  const value = React.useMemo(() => ({ open, close }), [open, close]);

  return (
    <ContextMenuContext.Provider value={value}>
      {children}
      <DropdownMenu
        open={isOpen}
        onOpenChange={(next) => {
          if (!next) close();
        }}
      >
        <DropdownMenuTrigger asChild>
          <div
            aria-hidden
            style={{
              position: "fixed",
              left: position.x,
              top: position.y,
              width: 0,
              height: 0,
            }}
          />
        </DropdownMenuTrigger>
        {/* `.sahla-ds` : reset scopé sur le contenu portalé (hors sous-arbre DS). */}
        <DropdownMenuContent align="start" sideOffset={2}>
          <ContextMenuItems items={items} />
        </DropdownMenuContent>
      </DropdownMenu>
    </ContextMenuContext.Provider>
  );
};
