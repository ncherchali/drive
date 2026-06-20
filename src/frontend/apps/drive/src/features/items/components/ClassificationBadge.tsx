// Badge de classification de sensibilité (p6). Deux usages :
// - <ClassificationLabel level> : badge pur (couleur par niveau), sans fetch —
//   utilisé sur les lignes de l'explorateur (données fournies par un batch).
// - <ClassificationBadge itemId> : variante auto-fetch (classification EFFECTIVE)
//   pour l'en-tête du panneau de droite.
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

export type ClassificationLabelProps = {
  level: ClassificationLevel;
  compact?: boolean;
};

export const ClassificationLabel = ({
  level,
  compact = false,
}: ClassificationLabelProps) => {
  const { t } = useTranslation();
  return (
    <Badge
      variant="outline"
      className={`shrink-0 gap-1 border-transparent ${
        compact ? "px-1.5 py-0 text-[10px]" : ""
      } ${LEVEL_CLASS[level]}`}
    >
      <ShieldAlert className="size-3" />
      {t(`explorer.rightPanel.compliance.level.${level}`)}
    </Badge>
  );
};

export type ClassificationBadgeProps = {
  itemId: string;
};

export const ClassificationBadge = ({ itemId }: ClassificationBadgeProps) => {
  const { data } = useItemClassification(itemId);
  const level = data?.effective_classification ?? null;
  if (!level) {
    return null;
  }
  return <ClassificationLabel level={level} />;
};
