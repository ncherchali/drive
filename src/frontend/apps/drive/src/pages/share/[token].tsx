// Page publique de résolution d'un lien de partage avancé (H1.3).
// Le destinataire saisit un mot de passe (si requis) puis accède au fichier.
import { useRouter } from "next/router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDriver } from "@/features/config/Config";
import { ShareLinkResolution } from "@/features/drivers/types";
import { downloadFile } from "@/features/items/utils";
import { getSimpleLayout } from "@/features/layouts/components/simple/SimpleLayout";

export default function ShareLinkPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const token =
    typeof router.query.token === "string" ? router.query.token : "";

  const [password, setPassword] = useState("");
  const [resolution, setResolution] = useState<ShareLinkResolution | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const triggerDownload = (result: ShareLinkResolution) => {
    if (result.download_url) {
      void downloadFile(
        result.download_url,
        result.item.filename ?? result.item.title,
      );
    }
  };

  const access = async () => {
    if (!token) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await getDriver().resolveShareLink(
        token,
        password || undefined,
      );
      setResolution(result);
      triggerDownload(result);
    } catch {
      setError(t("share.error"));
    } finally {
      setLoading(false);
    }
  };

  const card =
    "mx-auto flex min-h-[60vh] max-w-sm flex-col items-center justify-center gap-4 p-6 text-center";

  if (resolution) {
    return (
      <div className={card}>
        <h1 className="text-lg font-semibold text-foreground">
          {resolution.item.title}
        </h1>
        {resolution.download_url ? (
          <Button onClick={() => triggerDownload(resolution)}>
            {t("share.download")}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">{t("share.folder")}</p>
        )}
      </div>
    );
  }

  return (
    <div className={card}>
      <h1 className="text-lg font-semibold text-foreground">
        {t("share.title")}
      </h1>
      <div className="flex w-full flex-col gap-1.5 text-start">
        <Label htmlFor="share-password">{t("share.password")}</Label>
        <Input
          id="share-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              void access();
            }
          }}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button
        className="w-full"
        onClick={() => void access()}
        disabled={loading || !token}
      >
        {t("share.access")}
      </Button>
    </div>
  );
}

ShareLinkPage.getLayout = getSimpleLayout;
