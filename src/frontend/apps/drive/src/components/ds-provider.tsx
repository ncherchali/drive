// Fournisseur racine du Design System Sahla.
// À placer autour de tout sous-arbre DS : applique le reset scopé (`.sahla-ds`),
// la direction (LTR/RTL, dérivée de la locale i18n — Radix s'aligne dessus via
// DirectionProvider) et le contexte Tooltip. Pages Router : pas de "use client".
import * as React from "react";
import { DirectionProvider } from "@radix-ui/react-direction";
import { useTranslation } from "react-i18next";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/utils/cn";

type Dir = "ltr" | "rtl";

export interface DsProviderProps
  extends Omit<React.ComponentProps<"div">, "dir"> {
  /** Force la direction. Par défaut : dérivée de la locale i18n active. */
  dir?: Dir;
}

export function DsProvider({
  children,
  className,
  dir: dirProp,
  ...props
}: DsProviderProps) {
  const { i18n } = useTranslation();
  // i18next expose `dir(lng?)` → "ltr" | "rtl" selon la langue.
  const dir: Dir =
    dirProp ?? ((i18n.dir?.() as Dir | undefined) ?? "ltr");

  return (
    <DirectionProvider dir={dir}>
      <TooltipProvider>
        <div dir={dir} className={cn("sahla-ds", className)} {...props}>
          {children}
        </div>
      </TooltipProvider>
    </DirectionProvider>
  );
}
