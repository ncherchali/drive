// Onglet « Secrets » du panneau de droite (E4.1 — KMS).
// Pages Router : pas de "use client".
//
// Secrets scellés via le KMS : la valeur est chiffrée au repos et n'est révélée
// qu'à la demande (lecture sensible auditée côté backend), puis masquée. La
// valeur révélée reste en état local éphémère (jamais mise en cache). Réservé
// aux managers (l'onglet n'est monté que pour eux).
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, KeyRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ItemSecret } from "@/features/drivers/types";
import { useItemSecrets } from "@/features/explorer/hooks/useQueries";
import {
  useMutationDeleteSecret,
  useMutationRevealSecret,
  useMutationSetSecret,
} from "@/features/explorer/hooks/useMutationsSecrets";

export type ItemSecretsDsProps = {
  itemId: string;
};

export const ItemSecretsDs = ({ itemId }: ItemSecretsDsProps) => {
  const { t } = useTranslation();
  const { data: secrets } = useItemSecrets(itemId);
  const setSecret = useMutationSetSecret();
  const revealSecret = useMutationRevealSecret();
  const deleteSecret = useMutationDeleteSecret();

  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  // Valeurs révélées, par id de secret — état local éphémère, jamais persisté.
  const [revealed, setRevealed] = useState<Record<string, string>>({});

  const items = secrets ?? [];

  const handleAdd = () => {
    if (!name.trim() || !value) {
      return;
    }
    setSecret.mutate(
      { itemId, name: name.trim(), value },
      {
        onSuccess: () => {
          setName("");
          setValue("");
        },
      },
    );
  };

  const toggleReveal = (secret: ItemSecret) => {
    if (revealed[secret.id] !== undefined) {
      setRevealed((prev) => {
        const next = { ...prev };
        delete next[secret.id];
        return next;
      });
      return;
    }
    revealSecret.mutate(
      { itemId, secretId: secret.id },
      {
        onSuccess: (data) =>
          setRevealed((prev) => ({ ...prev, [secret.id]: data.value })),
      },
    );
  };

  return (
    <div className="flex flex-col gap-5 py-2 text-sm">
      <section className="flex flex-col gap-2">
        <h3 className="flex items-center gap-2 font-medium text-foreground">
          <KeyRound className="size-4" />
          {t("explorer.rightPanel.secrets.title")}
        </h3>
        <p className="text-muted-foreground">
          {t("explorer.rightPanel.secrets.description")}
        </p>

        {items.length === 0 ? (
          <p className="text-muted-foreground">
            {t("explorer.rightPanel.secrets.empty")}
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {items.map((secret) => (
              <li
                key={secret.id}
                className="flex flex-col gap-1 rounded-md border border-solid border-border p-2"
              >
                <div className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                    {secret.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0"
                    aria-label={t("explorer.rightPanel.secrets.reveal")}
                    onClick={() => toggleReveal(secret)}
                  >
                    {revealed[secret.id] !== undefined ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                    aria-label={t("explorer.rightPanel.secrets.delete")}
                    onClick={() =>
                      deleteSecret.mutate({ itemId, secretId: secret.id })
                    }
                  >
                    <X className="size-4" />
                  </Button>
                </div>
                {revealed[secret.id] !== undefined && (
                  <code className="break-all rounded bg-muted px-2 py-1 text-xs text-foreground">
                    {revealed[secret.id]}
                  </code>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Ajout d'un secret */}
      <section className="flex flex-col gap-2 border-t border-solid border-border pt-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="secret-name">
            {t("explorer.rightPanel.secrets.name")}
          </Label>
          <Input
            id="secret-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div className="flex items-end gap-2">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="secret-value">
              {t("explorer.rightPanel.secrets.value")}
            </Label>
            <Input
              id="secret-value"
              type="password"
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
          </div>
          <Button
            onClick={handleAdd}
            disabled={!name.trim() || !value || setSecret.isPending}
          >
            {t("explorer.rightPanel.secrets.add")}
          </Button>
        </div>
      </section>
    </div>
  );
};
