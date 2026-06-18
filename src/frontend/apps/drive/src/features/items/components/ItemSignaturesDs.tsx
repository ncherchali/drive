// Onglet « Signature » du panneau de droite (H1.8 / Sahla Sign).
// Pages Router : pas de "use client".
//
// Envoyer un fichier en signature, suivre le statut, simuler la signature
// (mock/sandbox) ou annuler. Réservé aux éditeurs/managers (fichiers).
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignatureRequest } from "@/features/drivers/types";
import { useItemSignatures } from "@/features/explorer/hooks/useQueries";
import {
  useMutationCancelSignature,
  useMutationCompleteSignature,
  useMutationRequestSignature,
} from "@/features/explorer/hooks/useMutationsSignatures";

export type ItemSignaturesDsProps = {
  itemId: string;
};

export const ItemSignaturesDs = ({ itemId }: ItemSignaturesDsProps) => {
  const { t } = useTranslation();
  const { data: signatures, isLoading } = useItemSignatures(itemId);
  const requestSignature = useMutationRequestSignature();
  const completeSignature = useMutationCompleteSignature();
  const cancelSignature = useMutationCancelSignature();

  const [email, setEmail] = useState("");

  const handleRequest = () => {
    if (!email) {
      return;
    }
    requestSignature.mutate(
      { itemId, signerEmail: email },
      { onSuccess: () => setEmail("") },
    );
  };

  return (
    <div className="flex flex-col gap-4 py-2 text-sm">
      <div className="flex items-end gap-2">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="signer-email">
            {t("explorer.rightPanel.signatures.signer_email")}
          </Label>
          <Input
            id="signer-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <Button onClick={handleRequest} disabled={requestSignature.isPending}>
          {t("explorer.rightPanel.signatures.send")}
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">
          {t("explorer.rightPanel.signatures.loading")}
        </p>
      ) : !signatures || signatures.length === 0 ? (
        <p className="text-muted-foreground">
          {t("explorer.rightPanel.signatures.empty")}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {signatures.map((signature: SignatureRequest) => (
            <li
              key={signature.id}
              className="flex items-center gap-2 rounded-md border border-solid border-border p-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-foreground">
                  {signature.signer_email}
                </p>
                <Badge
                  variant={
                    signature.status === "signed" ? "default" : "secondary"
                  }
                >
                  {t(`explorer.rightPanel.signatures.status.${signature.status}`)}
                </Badge>
              </div>
              {signature.status === "pending" && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0"
                    onClick={() =>
                      completeSignature.mutate({
                        itemId,
                        requestId: signature.id,
                      })
                    }
                    aria-label={t("explorer.rightPanel.signatures.mark_signed")}
                  >
                    <Check className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0"
                    onClick={() =>
                      cancelSignature.mutate({
                        itemId,
                        requestId: signature.id,
                      })
                    }
                    aria-label={t("explorer.rightPanel.signatures.cancel")}
                  >
                    <X className="size-4" />
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
