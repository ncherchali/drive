// Badge de classification de sensibilité (p6), visible en permanence dans
// l'en-tête du panneau de droite. Couleur par niveau ; affiche la classification
// EFFECTIVE (la plus restrictive, héritée des parties). Rien si non classifié.
// Pages Router : pas de "use client".
import { useTranslation } from "react-i18next";
import { ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ClassificationLevel } from "@/features/drivers/types";
import { useItemClassification } from "@/features/explorer/hooks/useQueries";

const LEVEL_CLASS: Record<ClassificationLevel, string> = {
  public: "bg-muted text-muted-foreground",
  internal: "bg-secondary text-secondary-foreground",
  confidential:
    "bg-amber-500/15 text-amber-700 dark:bg-amber-400/15 dark:text-amber-400",
  secret: "bg-destructive/15 text-destructive",
};

export type ClassificationBadgeProps = {
  itemId: string;
};

export const ClassificationBadge = ({ itemId }: ClassificationBadgeProps) => {
  const { t } = useTranslation();
  const { data } = useItemClassification(itemId);
  const level = data?.effective_classification ?? null;
  if (!level) {
    return null;
  }
  return (
    <Badge
      variant="outline"
      className={`gap-1 border-transparent ${LEVEL_CLASS[level]}`}
    >
      <ShieldAlert className="size-3" />
      {t(`explorer.rightPanel.compliance.level.${level}`)}
    </Badge>
  );
};
