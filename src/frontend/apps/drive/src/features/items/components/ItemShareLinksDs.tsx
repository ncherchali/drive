// Onglet « Liens » du panneau de droite (H1.3).
// Pages Router : pas de "use client".
//
// Gestion des liens de partage avancés d'un item : création (rôle, mot de passe,
// expiration, plafond), liste (URL copiable, compteur, révocation). Réservé aux
// managers (owner/admin) ; l'onglet n'est monté que dans ce cas.
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShareLink } from "@/features/drivers/types";
import { useItemShareLinks } from "@/features/explorer/hooks/useQueries";
import {
  useMutationCreateShareLink,
  useMutationDeleteShareLink,
} from "@/features/explorer/hooks/useMutationsShareLinks";

export type ItemShareLinksDsProps = {
  itemId: string;
};

const shareUrl = (token: string) =>
  typeof window !== "undefined"
    ? `${window.location.origin}/share/${token}`
    : `/share/${token}`;

export const ItemShareLinksDs = ({ itemId }: ItemShareLinksDsProps) => {
  const { t } = useTranslation();
  const { data: links, isLoading } = useItemShareLinks(itemId);
  const createMutation = useMutationCreateShareLink();
  const deleteMutation = useMutationDeleteShareLink();

  const [role, setRole] = useState("reader");
  const [password, setPassword] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [maxDownloads, setMaxDownloads] = useState("");

  const handleCreate = () => {
    createMutation.mutate(
      {
        itemId,
        role,
        password: password || undefined,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        max_downloads: maxDownloads ? Number(maxDownloads) : null,
      },
      {
        onSuccess: () => {
          setPassword("");
          setExpiresAt("");
          setMaxDownloads("");
        },
      },
    );
  };

  const copy = (token: string) => {
    void navigator.clipboard.writeText(shareUrl(token));
  };

  return (
    <div className="flex flex-col gap-4 py-2">
      <div className="flex flex-col gap-3 rounded-md border border-solid border-border p-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="share-role">
            {t("explorer.rightPanel.share_links.role")}
          </Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger id="share-role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="reader">
                {t("explorer.rightPanel.share_links.role_reader")}
              </SelectItem>
              <SelectItem value="editor">
                {t("explorer.rightPanel.share_links.role_editor")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="share-password">
            {t("explorer.rightPanel.share_links.password")}
          </Label>
          <Input
            id="share-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={t("explorer.rightPanel.share_links.password_optional")}
          />
        </div>

        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="share-expires">
              {t("explorer.rightPanel.share_links.expires")}
            </Label>
            <Input
              id="share-expires"
              type="date"
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
            />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="share-max">
              {t("explorer.rightPanel.share_links.max_downloads")}
            </Label>
            <Input
              id="share-max"
              type="number"
              min={1}
              value={maxDownloads}
              onChange={(event) => setMaxDownloads(event.target.value)}
            />
          </div>
        </div>

        <Button onClick={handleCreate} disabled={createMutation.isPending}>
          {t("explorer.rightPanel.share_links.create")}
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">
          {t("explorer.rightPanel.share_links.loading")}
        </p>
      ) : !links || links.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("explorer.rightPanel.share_links.empty")}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {links.map((link: ShareLink) => (
            <li
              key={link.id}
              className="flex flex-col gap-1 rounded-md border border-solid border-border p-2 text-sm"
            >
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={shareUrl(link.token)}
                  className="h-8 flex-1 text-xs"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                  onClick={() => copy(link.token)}
                  aria-label={t("explorer.rightPanel.share_links.copy")}
                >
                  <Copy className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                  onClick={() =>
                    deleteMutation.mutate({ itemId, linkId: link.id })
                  }
                  aria-label={t("explorer.rightPanel.share_links.revoke")}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                <span>
                  {t("explorer.rightPanel.share_links.downloads", {
                    n: link.download_count,
                    max: link.max_downloads ?? "∞",
                  })}
                </span>
                {link.has_password && (
                  <span>{t("explorer.rightPanel.share_links.protected")}</span>
                )}
                {link.expires_at && (
                  <span>
                    {t("explorer.rightPanel.share_links.expires_on", {
                      date: new Date(link.expires_at).toLocaleDateString(),
                    })}
                  </span>
                )}
                {!link.is_valid && (
                  <span className="text-destructive">
                    {t("explorer.rightPanel.share_links.invalid")}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
