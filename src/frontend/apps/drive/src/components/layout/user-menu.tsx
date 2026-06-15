// Menu utilisateur DS (remplace le UserProfile Cunningham). Avatar + menu
// (nom/email, items optionnels, déconnexion). Conçu pour fonctionner HORS d'un
// wrapper `.sahla-ds` : le contenu portalé porte `.sahla-ds` + dir, et un
// DirectionProvider traverse le portail pour aligner Radix sur la locale.
import * as React from "react";
import { DirectionProvider } from "@radix-ui/react-direction";
import { useTranslation } from "react-i18next";
import { LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/utils/cn";

export interface UserMenuProps {
  name?: string;
  email?: string;
  avatarUrl?: string | null;
  onLogout?: () => void;
  /** Items supplémentaires (ex. sélecteur de langue), insérés avant Déconnexion. */
  children?: React.ReactNode;
}

export function UserMenu({
  name,
  email,
  avatarUrl,
  onLogout,
  children,
}: UserMenuProps) {
  const { t, i18n } = useTranslation();
  const dir = (i18n.dir?.() as "ltr" | "rtl" | undefined) ?? "ltr";

  return (
    <DirectionProvider dir={dir}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={name ?? "Compte"}
            className={cn(
              "inline-flex appearance-none items-center rounded-full border-0 bg-transparent p-0 outline-none",
              "focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <Avatar name={name} src={avatarUrl} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="min-w-56"
          style={{ direction: dir }}
        >
          {(name || email) && (
            <div className="px-2 py-1.5">
              {name && (
                <p className="truncate text-sm font-medium text-foreground">
                  {name}
                </p>
              )}
              {email && (
                <p className="truncate text-xs text-muted-foreground">{email}</p>
              )}
            </div>
          )}
          {children && (
            <>
              <DropdownMenuSeparator />
              {children}
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onLogout}>
            <LogOut /> {t("user_menu.logout", "Se déconnecter")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </DirectionProvider>
  );
}
