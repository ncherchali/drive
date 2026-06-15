import { getSimpleLayout } from "@/features/layouts/components/simple/SimpleLayout";
import { GenericDisclaimer } from "@/features/ui/components/generic-disclaimer/GenericDisclaimer";
import { Icon } from "@/features/ui/components/icon/Icon";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function UnauthorizedPage() {
  const { t } = useTranslation();
  return (
    <GenericDisclaimer
      message={t("403.title")}
      imageSrc="/assets/403-background.png"
    >
      <Button asChild>
        <Link href="/">
          <Icon name="home" />
          {t("403.button")}
        </Link>
      </Button>
    </GenericDisclaimer>
  );
}

UnauthorizedPage.getLayout = getSimpleLayout;
