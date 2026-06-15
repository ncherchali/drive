import { Button } from "@/components/ui/button";
import { logout } from "../Auth";
import { useTranslation } from "react-i18next";

export const LogoutButton = () => {
  const { t } = useTranslation();
  return (
    <Button variant="ghost" className="w-full" onClick={logout}>
      {t("logout")}
    </Button>
  );
};
