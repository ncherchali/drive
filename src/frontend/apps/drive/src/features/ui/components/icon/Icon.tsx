// Icônes — module local (anciennement @gouvfr-lasuite/ui-kit, dépose totale).
//
// Découplage FIDÈLE : reproduit à l'identique l'`Icon` material + `IconSvg` (SVG)
// + l'enum `IconSize`/`IconType` + `iconSizeMap` d'ui-kit. La taille est appliquée
// en `fontSize`/`width` INLINE (auto-suffisant : ne dépend plus du CSS `icon--*`
// d'ui-kit). La police `material-icons` reste fournie par le CSS ui-kit pendant la
// cohabitation ; à son retrait (phase 13b) il faudra charger la police Google
// Material Icons. Le passage esthétique material→lucide est un polish séparé.
import * as React from "react";
import clsx from "clsx";
import type { LucideIcon } from "lucide-react";

export enum IconSize {
  X_SMALL = "xsmall",
  SMALL = "small",
  MEDIUM = "medium",
  LARGE = "large",
  X_LARGE = "xlarge",
}

export enum IconType {
  OUTLINED = "outlined",
  FILLED = "filled",
}

export const iconSizeMap: Record<IconSize, number> = {
  [IconSize.X_SMALL]: 11,
  [IconSize.SMALL]: 16,
  [IconSize.MEDIUM]: 24,
  [IconSize.LARGE]: 32,
  [IconSize.X_LARGE]: 40,
};

const resolveSize = (size?: IconSize | number): number | undefined => {
  if (typeof size === "number") return size;
  if (size && iconSizeMap[size]) return iconSizeMap[size];
  return undefined;
};

export type IconProps = {
  /** Nom de l'icône Material à afficher. */
  name?: string;
  type?: IconType;
  size?: IconSize | number;
  className?: string;
  color?: string;
  [key: string]: unknown;
};

/** Icône Material (rendue par ligature, police `material-icons`). */
export const Icon = ({
  name,
  size,
  className,
  color,
  type = IconType.FILLED,
  ...props
}: IconProps & { name: string }) => {
  const px = resolveSize(size);
  return (
    <span
      className={clsx(
        type === IconType.OUTLINED ? "material-icons-outlined" : "material-icons",
        className,
      )}
      style={{ color, fontSize: px !== undefined ? `${px}px` : undefined }}
      {...props}
    >
      {name}
    </span>
  );
};

/**
 * Adapte une icône lucide à l'API maison `(props: Partial<IconProps>) => JSX`
 * (taille via IconSize string|number → px). Permet aux registres d'icônes
 * (routes par défaut, colonnes de la grille) de rendre du lucide en gardant les
 * appels existants — icônes COHÉRENTES avec la sidebar (lucide) partout.
 */
export const fromLucide = (LucideComp: LucideIcon) => {
  const Adapted = ({ size, color, className }: Partial<IconProps>) => (
    <LucideComp
      size={resolveSize(size) ?? 24}
      color={color}
      className={className}
    />
  );
  Adapted.displayName = `Lucide(${LucideComp.displayName ?? "icon"})`;
  return Adapted;
};

export type IconSvgProps = Omit<Partial<IconProps>, "name" | "type">;

/** Conteneur SVG (icônes-tracé maison : RecentIcon, MyFilesIcon, …). */
export const IconSvg = (
  props: React.SVGProps<SVGSVGElement> & IconProps,
) => {
  const size = resolveSize(props.size) ?? 24;
  const { size: _ignored, color: _color, ...rest } = props;
  void _ignored;
  void _color;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      {props.children}
    </svg>
  );
};
