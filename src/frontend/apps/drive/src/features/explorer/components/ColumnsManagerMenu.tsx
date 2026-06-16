// Menu « Colonnes » : ajoute/retire les colonnes de données de la grille de
// l'explorateur (cases à cocher). Les choix sont persistés via
// useColumnPreferences (→ backend user.column_preferences). Pages Router.
import { useTranslation } from "react-i18next";
import { Columns3, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ALL_COLUMN_TYPES } from "../types/columns";
import { COLUMN_REGISTRY } from "../config/columnRegistry";
import { useColumnPreferences } from "../hooks/useColumnPreferences";
import { IconSize } from "@/features/ui/components/icon/Icon";
import { cn } from "@/utils/cn";

export const ColumnsManagerMenu = () => {
  const { t } = useTranslation();
  const { prefs, toggleColumn } = useColumnPreferences();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          aria-label={t("explorer.grid.columns.manage", "Colonnes")}
        >
          <Columns3 className="size-4" />
          {t("explorer.grid.columns.manage", "Colonnes")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuLabel>
          {t("explorer.grid.columns.manage", "Colonnes")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ALL_COLUMN_TYPES.map((type) => {
          const config = COLUMN_REGISTRY[type];
          const ColumnIcon = config.icon;
          const checked = prefs.columns.includes(type);
          return (
            <DropdownMenuItem
              key={type}
              // preventDefault : garder le menu ouvert pour cocher plusieurs
              // colonnes d'affilée.
              onSelect={(event) => {
                event.preventDefault();
                toggleColumn(type);
              }}
            >
              <ColumnIcon size={IconSize.SMALL} />
              <span className="flex-1">{t(config.labelKey)}</span>
              <Check
                className={cn(
                  "ms-auto size-4",
                  checked ? "opacity-100" : "opacity-0",
                )}
                aria-hidden
              />
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
