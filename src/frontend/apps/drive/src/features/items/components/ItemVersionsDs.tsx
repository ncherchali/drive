// Onglet « Versions » du panneau de droite (H1.4).
// Pages Router : pas de "use client".
//
// Liste les versions S3 d'un fichier : télécharger une version, restaurer une
// version antérieure, supprimer une version non courante. Réservé aux managers
// (l'onglet n'est monté que pour eux, et uniquement pour les fichiers).
import { useTranslation } from "react-i18next";
import { Download, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getDriver } from "@/features/config/Config";
import { ItemVersion } from "@/features/drivers/types";
import { useItemVersions } from "@/features/explorer/hooks/useQueries";
import {
  useMutationDeleteVersion,
  useMutationRestoreVersion,
} from "@/features/explorer/hooks/useMutationsVersions";
import { formatSize } from "@/features/explorer/utils/utils";
import { downloadFile } from "@/features/items/utils";

export type ItemVersionsDsProps = {
  itemId: string;
  filename: string;
};

export const ItemVersionsDs = ({ itemId, filename }: ItemVersionsDsProps) => {
  const { t } = useTranslation();
  const { data: versions, isLoading } = useItemVersions(itemId);
  const restoreMutation = useMutationRestoreVersion();
  const deleteMutation = useMutationDeleteVersion();

  const download = async (versionId: string) => {
    const url = await getDriver().getItemVersionDownloadUrl(itemId, versionId);
    void downloadFile(url, filename);
  };

  if (isLoading) {
    return (
      <p className="py-4 text-sm text-muted-foreground">
        {t("explorer.rightPanel.versions.loading")}
      </p>
    );
  }

  if (!versions || versions.length === 0) {
    return (
      <p className="py-4 text-sm text-muted-foreground">
        {t("explorer.rightPanel.versions.empty")}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2 py-2">
      {versions.map((version: ItemVersion) => (
        <li
          key={version.version_id}
          className="flex items-center gap-2 rounded-md border border-solid border-border p-2 text-sm"
        >
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-foreground">
              <span className="truncate">
                {new Date(version.last_modified).toLocaleString(undefined, {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </span>
              {version.is_latest && (
                <Badge variant="secondary">
                  {t("explorer.rightPanel.versions.current")}
                </Badge>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatSize(version.size, t)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            onClick={() => void download(version.version_id)}
            aria-label={t("explorer.rightPanel.versions.download")}
          >
            <Download className="size-4" />
          </Button>
          {!version.is_latest && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                onClick={() =>
                  restoreMutation.mutate({
                    itemId,
                    versionId: version.version_id,
                  })
                }
                aria-label={t("explorer.rightPanel.versions.restore")}
              >
                <RotateCcw className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                onClick={() =>
                  deleteMutation.mutate({
                    itemId,
                    versionId: version.version_id,
                  })
                }
                aria-label={t("explorer.rightPanel.versions.delete")}
              >
                <Trash2 className="size-4" />
              </Button>
            </>
          )}
        </li>
      ))}
    </ul>
  );
};
