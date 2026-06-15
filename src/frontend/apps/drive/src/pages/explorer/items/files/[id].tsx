import { GenericDisclaimer } from "@/features/ui/components/generic-disclaimer/GenericDisclaimer";
import { SpinnerPage } from "@/features/ui/components/spinner/SpinnerPage";
import { CustomFilesPreview } from "@/features/ui/preview/CustomFilesPreview";
import { Icon } from "@/features/ui/components/icon/Icon";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import { useItem } from "@/features/explorer/hooks/useQueries";

export default function FilePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const itemId = router.query.id as string;

  const { data: item, isLoading, error } = useItem(itemId);

  // On 403, 401, the user is automatically redirected to the 401/403 page.

  // If the error is a 401 or 403, we want to show the spinner page because an auto redirect is happening.
  if (isLoading || (error && [401, 403].includes(error.code))) {
    return <SpinnerPage />;
  }

  // Can happen if the file is deleted.
  if (!item) {
    return (
      <GenericDisclaimer
        message={t("explorer.files.not_found.description")}
        imageSrc="/assets/403-background.png"
      >
        <Button asChild className="sahla-ds">
          <Link href="/">
            <Icon name="home" />
            {t("403.button")}
          </Link>
        </Button>
      </GenericDisclaimer>
    );
  }

  return (
    <div>
      <CustomFilesPreview currentItem={item} items={[item]} />
    </div>
  );
}
