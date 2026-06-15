/**
 * Forme d'un fichier prévisualisable.
 *
 * Type local, anciennement importé de `@gouvfr-lasuite/ui-kit` — décorrélation
 * du Design System (cf. docs/ds-migration-plan.md, phase 13, lot 1). La forme
 * reste identique à celle d'ui-kit pour rester compatible avec le composant
 * `FilePreview` tant que la visionneuse n'est pas réécrite en natif (lot 9).
 */
export type FilePreviewType = {
  id: string;
  size: number;
  title: string;
  mimetype: string;
  is_wopi_supported?: boolean;
  url_preview: string;
  url: string;
  isSuspicious?: boolean;
};
