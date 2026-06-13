// Adaptateur d'icônes DS — pont de migration ui-kit → lucide.
// Pages Router : pas de "use client".
//
// Le DS utilise lucide-react (icônes-composants), là où `@gouvfr-lasuite/ui-kit`
// expose un `<Icon>` Material piloté par l'enum `IconSize` (xsmall…xlarge). Pour
// migrer sans recalculer les tailles, ce wrapper accepte un jeton `IconSize`
// (ou un nombre brut de pixels) et rend une icône lucide à la taille
// équivalente. Les pixels reprennent EXACTEMENT `iconSizeMap` du ui-kit.
import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/utils/cn";

/** Jetons de taille, alignés sur `IconSize` du ui-kit. */
export type IconSizeToken =
  | "xsmall"
  | "small"
  | "medium"
  | "large"
  | "xlarge";

/** Pixels par jeton — copie de `iconSizeMap` (@gouvfr-lasuite/ui-kit). */
const ICON_SIZE_PX: Record<IconSizeToken, number> = {
  xsmall: 11,
  small: 16,
  medium: 24,
  large: 32,
  xlarge: 40,
};

export interface IconProps
  extends Omit<React.ComponentProps<LucideIcon>, "ref" | "size"> {
  /** Icône lucide à rendre (composant). */
  icon: LucideIcon;
  /** Jeton ui-kit (xsmall…xlarge) ou nombre de pixels. Défaut : medium. */
  size?: IconSizeToken | number;
}

function resolveSize(size: IconProps["size"]): number {
  if (typeof size === "number") return size;
  return ICON_SIZE_PX[size ?? "medium"];
}

function Icon({ icon: LucideCmp, size = "medium", className, ...props }: IconProps) {
  return (
    <LucideCmp
      data-slot="icon"
      size={resolveSize(size)}
      className={cn("shrink-0", className)}
      aria-hidden
      {...props}
    />
  );
}

export { Icon, ICON_SIZE_PX };
