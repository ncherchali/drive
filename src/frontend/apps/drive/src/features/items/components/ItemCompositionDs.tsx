// Onglet « Composition » du panneau de droite (ADR-0001 §5 / manifeste).
// Pages Router : pas de "use client".
//
// Le graphe de composition est DISTINCT de l'arborescence (ltree) : un composite
// assemble des parties PAR RÉFÉRENCE (multi-parents, ordonnées, partageables).
// Cet onglet montre le manifeste (parties part_of), son état de complétude
// (rôles requis / manquants, parties cassées) et permet d'ajouter/retirer une
// partie. Réservé aux managers (l'onglet n'est monté que pour eux).
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Boxes, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ContentRelation } from "@/features/drivers/types";
import { useItemManifest } from "@/features/explorer/hooks/useQueries";
import {
  useMutationAddRelation,
  useMutationRemoveRelation,
} from "@/features/explorer/hooks/useMutationsComposition";

export type ItemCompositionDsProps = {
  itemId: string;
};

export const ItemCompositionDs = ({ itemId }: ItemCompositionDsProps) => {
  const { t } = useTranslation();
  const { data: manifest } = useItemManifest(itemId);
  const addRelation = useMutationAddRelation();
  const removeRelation = useMutationRemoveRelation();

  const [toItem, setToItem] = useState("");
  const [role, setRole] = useState("");

  const parts = manifest?.parts ?? [];
  const missingRoles = manifest?.missing_roles ?? [];

  const handleAdd = () => {
    if (!toItem.trim()) {
      return;
    }
    addRelation.mutate(
      {
        itemId,
        toItem: toItem.trim(),
        relationType: "part_of",
        role: role || "",
      },
      {
        onSuccess: () => {
          setToItem("");
          setRole("");
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-5 py-2 text-sm">
      {/* Complétude */}
      <section className="flex flex-col gap-2">
        <h3 className="flex items-center gap-2 font-medium text-foreground">
          <Boxes className="size-4" />
          {t("explorer.rightPanel.composition.title")}
        </h3>
        {manifest?.complete ? (
          <span className="inline-flex w-fit items-center rounded-md bg-secondary px-2 py-0.5 text-secondary-foreground">
            {t("explorer.rightPanel.composition.complete")}
          </span>
        ) : (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-destructive">
            {t("explorer.rightPanel.composition.incomplete")}
            {missingRoles.length > 0 && (
              <div className="text-xs">
                {t("explorer.rightPanel.composition.missing_roles", {
                  roles: missingRoles.join(", "),
                })}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Parties (manifeste) */}
      <section className="flex flex-col gap-2 border-t border-solid border-border pt-3">
        <h3 className="font-medium text-foreground">
          {t("explorer.rightPanel.composition.parts")}
        </h3>
        {parts.length === 0 ? (
          <p className="text-muted-foreground">
            {t("explorer.rightPanel.composition.no_part")}
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {parts.map((part: ContentRelation) => (
              <li
                key={part.id}
                className="flex items-center gap-2 rounded-md border border-solid border-border p-2"
              >
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-foreground">
                    {part.to_item_title}
                    {part.to_item_missing && (
                      <span className="ml-1 text-destructive">
                        ({t("explorer.rightPanel.composition.missing")})
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {part.role || "—"}
                    {part.pinned_version
                      ? ` · ${t("explorer.rightPanel.composition.pinned")} ${part.pinned_version}`
                      : ""}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0"
                  onClick={() =>
                    removeRelation.mutate({ itemId, relationId: part.id })
                  }
                  aria-label={t("explorer.rightPanel.composition.remove")}
                >
                  <X className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Ajout d'une partie */}
      <section className="flex flex-col gap-2 border-t border-solid border-border pt-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="part-target">
            {t("explorer.rightPanel.composition.target_id")}
          </Label>
          <Input
            id="part-target"
            value={toItem}
            onChange={(event) => setToItem(event.target.value)}
          />
        </div>
        <div className="flex items-end gap-2">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="part-role">
              {t("explorer.rightPanel.composition.role")}
            </Label>
            <Input
              id="part-role"
              value={role}
              onChange={(event) => setRole(event.target.value)}
            />
          </div>
          <Button onClick={handleAdd} disabled={addRelation.isPending}>
            {t("explorer.rightPanel.composition.add")}
          </Button>
        </div>
      </section>
    </div>
  );
};
