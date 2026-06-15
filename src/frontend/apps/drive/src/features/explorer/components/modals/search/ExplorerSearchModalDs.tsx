// Palette de recherche DS — variante Design System d'ExplorerSearchModal.
// Pages Router : pas de "use client".
//
// Réutilise TOUTE la logique métier de la modale Cunningham (driver.searchItems
// debouncé, navigation/preview/WOPI, filtres) mais rend une palette `command`
// (cmdk) dans un Dialog DS. `shouldFilter={false}` : le filtrage est côté
// serveur, on affiche directement les résultats. Les filtres
// (ExplorerFilterType/Workspace/Scope) sont désormais DS (cf. phase 8a), donc
// intégrables sous `.sahla-ds` sans casse.
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDsModals } from "@/components/ds-modals";
import { CornerDownLeft } from "lucide-react";
import type { Key } from "react";
import { Item, ItemType } from "@/features/drivers/types";
import { ItemFilters } from "@/features/drivers/Driver";
import { getDriver } from "@/features/config/Config";
import { ItemIcon } from "../../icons/ItemIcon";
import {
  NavigationEventType,
  useGlobalExplorer,
} from "../../GlobalExplorerContext";
import {
  ExplorerFilterType,
  ExplorerFilterWorkspace,
  ExplorerFilterScope,
  handleFilterChange,
} from "../../app-view/ExplorerFilters";
import { messageModalTrashNavigate } from "../../trash/utils";
import {
  clearFromRoute,
  getItemTitle,
  itemToPreviewFile,
} from "@/features/explorer/utils/utils";
import { useIsMinimalLayout } from "@/utils/useLayout";
import { openWopiInNewTab } from "@/features/wopi/openWopi";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";

type ExplorerSearchModalDsProps = {
  isOpen: boolean;
  onClose: () => void;
  defaultFilters?: ItemFilters;
};

export const ExplorerSearchModalDs = ({
  isOpen,
  onClose,
  defaultFilters,
}: ExplorerSearchModalDsProps) => {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState<string>("");
  const isMinimalLayout = useIsMinimalLayout();
  const [filters, setFilters] = useState<ItemFilters>(defaultFilters || {});
  const [items, setItems] = useState<Item[]>([]);
  const driver = getDriver();
  const { onNavigate, setPreviewItem, setPreviewItems } = useGlobalExplorer();
  const modals = useDsModals();

  // Recherche serveur debouncée. Le clear et la requête passent tous deux par le
  // timeout (pas de setState synchrone dans l'effet), avec annulation au cleanup.
  useEffect(() => {
    const isEmpty = inputValue === "" && Object.keys(filters).length === 0;
    const timeoutId = setTimeout(
      async () => {
        if (isEmpty) {
          setItems([]);
          return;
        }
        const result = await driver.searchItems({
          ...filters,
          title: inputValue,
        });
        setItems(result);
      },
      isEmpty ? 0 : 300,
    );
    return () => clearTimeout(timeoutId);
  }, [filters, inputValue, driver]);

  const onFilterChange = (name: string, value: Key | null) => {
    setFilters(handleFilterChange(filters, name, value));
  };

  const onItemClick = (item: Item) => {
    if (item.type === ItemType.FOLDER) {
      if (item.deleted_at) {
        messageModalTrashNavigate(modals);
      } else {
        clearFromRoute();
        onNavigate({ item, type: NavigationEventType.ITEM });
        onClose();
      }
      return;
    }
    if (item.is_wopi_supported) {
      openWopiInNewTab(itemToPreviewFile(item));
      onClose();
      return;
    }
    setPreviewItems([item]);
    setPreviewItem(item);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">
          {t("explorer.search.modal.title")}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {t("explorer.search.modal.placeholder")}
        </DialogDescription>
        <Command shouldFilter={false} className="bg-popover">
          <CommandInput
            value={inputValue}
            onValueChange={setInputValue}
            placeholder={t("explorer.search.modal.placeholder")}
            autoFocus
          />
          <div className="flex flex-wrap items-center gap-2 border-b border-solid border-border px-3 py-2">
            <ExplorerFilterType
              value={filters?.type ?? null}
              onChange={(value) => onFilterChange("type", value)}
            />
            <ExplorerFilterWorkspace
              value={filters?.workspace ?? null}
              isDisabled={isMinimalLayout}
              onChange={(value) => onFilterChange("workspace", value)}
            />
            <ExplorerFilterScope
              value={filters?.scope ?? null}
              onChange={(value) => onFilterChange("scope", value)}
            />
            {Object.keys(filters).length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="ms-auto"
                onClick={() => setFilters({})}
              >
                {t("explorer.search.modal.filters.reset")}
              </Button>
            )}
          </div>
          <CommandList>
            {items.length > 0 && (
              <CommandGroup heading={t("explorer.search.modal.results")}>
                {items.map((item) => {
                  const showAncestors =
                    (item.parents && item.parents.length > 0) ||
                    item.deleted_at;
                  return (
                    <CommandItem
                      key={item.id}
                      value={item.id}
                      onSelect={() => onItemClick(item)}
                      data-testid="search-item"
                    >
                      <ItemIcon item={item} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">
                          {getItemTitle(item)}
                        </span>
                        {showAncestors && (
                          <span className="block truncate text-xs text-muted-foreground">
                            {item.deleted_at
                              ? t("explorer.tree.trash")
                              : item.parents
                                  ?.map((ancestor) => getItemTitle(ancestor))
                                  .join(" / ")}
                          </span>
                        )}
                      </span>
                      <CornerDownLeft
                        className="size-4 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
};
