import type { ReactNode } from "react";

/**
 * Étape d'une note de version.
 *
 * Type local, anciennement importé de `@gouvfr-lasuite/ui-kit` — décorrélation
 * du Design System (cf. docs/ds-migration-plan.md, phase 13, lot 1). La forme
 * reste identique à celle d'ui-kit pour rester compatible avec `ReleaseNoteModal`
 * tant que ce composant n'est pas migré (lot 8).
 */
export interface ReleaseNoteStep {
  /** Icône affichée à côté du titre de l'étape */
  icon: ReactNode;
  /** Icône affichée lorsque l'étape est active */
  activeIcon?: ReactNode;
  /** Titre de l'étape */
  title: string;
  /** Description, visible uniquement lorsque l'étape est active */
  description?: string;
}
