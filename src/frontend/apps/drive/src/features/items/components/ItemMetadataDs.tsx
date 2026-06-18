// Onglet « Métadonnées » du panneau de droite (ADR-0001 : objet de contenu).
// Pages Router : pas de "use client".
//
// Type de contenu (content_type, phases 1/4) + métadonnées gouvernées (E2.1) +
// propositions d'enrichissement avec provenance (phase 3) : accepter promeut
// les valeurs dans l'autoritatif, rejeter les écarte. Réservé aux managers
// (l'onglet n'est monté que pour eux).
import { useTranslation } from "react-i18next";
import { Check, Sparkles, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MetadataProposal } from "@/features/drivers/types";
import {
  useItemContentType,
  useItemMetadata,
  useItemMetadataProposals,
} from "@/features/explorer/hooks/useQueries";
import {
  useMutationAcceptProposal,
  useMutationRejectProposal,
} from "@/features/explorer/hooks/useMutationsMetadata";

export type ItemMetadataDsProps = {
  itemId: string;
};

const ValueList = ({ values }: { values: Record<string, unknown> }) => (
  <dl className="flex flex-col gap-1 rounded-md border border-solid border-border p-2">
    {Object.entries(values).map(([field, value]) => (
      <div key={field} className="flex justify-between gap-2">
        <dt className="text-muted-foreground">{field}</dt>
        <dd className="min-w-0 truncate text-foreground">{String(value)}</dd>
      </div>
    ))}
  </dl>
);

export const ItemMetadataDs = ({ itemId }: ItemMetadataDsProps) => {
  const { t } = useTranslation();
  const { data: contentType } = useItemContentType(itemId);
  const { data: metadata } = useItemMetadata(itemId);
  const { data: proposals } = useItemMetadataProposals(itemId);
  const acceptProposal = useMutationAcceptProposal();
  const rejectProposal = useMutationRejectProposal();

  const namespaces = Object.entries(metadata ?? {});
  const pendingProposals = (proposals ?? []).filter(
    (proposal: MetadataProposal) => proposal.status === "proposed",
  );

  return (
    <div className="flex flex-col gap-5 py-2 text-sm">
      {/* Type de contenu */}
      <section className="flex flex-col gap-2">
        <h3 className="flex items-center gap-2 font-medium text-foreground">
          <Tag className="size-4" />
          {t("explorer.rightPanel.metadata.content_type")}
        </h3>
        {contentType?.content_type ? (
          <span className="inline-flex w-fit items-center rounded-md bg-secondary px-2 py-0.5 text-secondary-foreground">
            {contentType.content_type}
          </span>
        ) : (
          <p className="text-muted-foreground">
            {t("explorer.rightPanel.metadata.no_content_type")}
          </p>
        )}
      </section>

      {/* Métadonnées autoritatives */}
      <section className="flex flex-col gap-2 border-t border-solid border-border pt-3">
        <h3 className="font-medium text-foreground">
          {t("explorer.rightPanel.metadata.fields")}
        </h3>
        {namespaces.length === 0 ? (
          <p className="text-muted-foreground">
            {t("explorer.rightPanel.metadata.no_metadata")}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {namespaces.map(([templateKey, values]) => (
              <div key={templateKey} className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase text-muted-foreground">
                  {templateKey}
                </span>
                <ValueList values={values as Record<string, unknown>} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Propositions d'enrichissement (provenance) */}
      <section className="flex flex-col gap-2 border-t border-solid border-border pt-3">
        <h3 className="flex items-center gap-2 font-medium text-foreground">
          <Sparkles className="size-4" />
          {t("explorer.rightPanel.metadata.proposals")}
        </h3>
        {pendingProposals.length === 0 ? (
          <p className="text-muted-foreground">
            {t("explorer.rightPanel.metadata.no_proposal")}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {pendingProposals.map((proposal: MetadataProposal) => (
              <li
                key={proposal.id}
                className="flex flex-col gap-2 rounded-md border border-solid border-border p-2"
              >
                <span className="text-xs text-muted-foreground">
                  {t(`explorer.rightPanel.metadata.source.${proposal.source}`)}
                  {proposal.model ? ` · ${proposal.model}` : ""}
                  {proposal.confidence != null
                    ? ` · ${Math.round(proposal.confidence * 100)}%`
                    : ""}
                </span>
                <ValueList values={proposal.values} />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      acceptProposal.mutate({ itemId, proposalId: proposal.id })
                    }
                    disabled={acceptProposal.isPending}
                  >
                    <Check className="size-4" />
                    {t("explorer.rightPanel.metadata.accept")}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      rejectProposal.mutate({ itemId, proposalId: proposal.id })
                    }
                    disabled={rejectProposal.isPending}
                  >
                    <X className="size-4" />
                    {t("explorer.rightPanel.metadata.reject")}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
