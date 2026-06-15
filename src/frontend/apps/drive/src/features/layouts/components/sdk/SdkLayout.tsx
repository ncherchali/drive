import { Auth } from "@/features/auth/Auth";
import { GlobalExplorerProvider } from "@/features/explorer/components/GlobalExplorerContext";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { createContext, useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export const getSdkLayout = (page: React.ReactElement) => {
  return <SdkLayout>{page}</SdkLayout>;
};

export const SdkContext = createContext<{
  token: string;
}>({
  token: "",
});

export const useSdkContext = () => {
  const context = useContext(SdkContext);
  if (!context) {
    throw new Error("useSdkContext must be used within a SdkContext");
  }
  return context;
};

/**
 * SDK.
 */

export const SdkLayout = ({ children }: { children: React.ReactNode }) => {
  const { t } = useTranslation();

  return (
    <Auth>
      <GlobalExplorerProvider displayMode="sdk" itemId="" onNavigate={() => {}}>
        <div className="sdk__explorer__header">
          {t("sdk.explorer.picker_caption")}
        </div>
        <Separator />
        {children}
      </GlobalExplorerProvider>
    </Auth>
  );
};

/**
 * Picker.
 */

export const getSdkPickerLayout = (page: React.ReactElement) => {
  return <SdkPickerLayout>{page}</SdkPickerLayout>;
};

export const SdkPickerLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(sessionStorage.getItem("sdk_token"));
  }, [token]);

  if (!token) {
    return <Spinner className="size-8" />;
  }

  return (
    <SdkContext.Provider value={{ token }}>
      <SdkLayout>{children}</SdkLayout>
    </SdkContext.Provider>
  );
};
