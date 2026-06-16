import { Spinner } from "@/components/ui/spinner";
import Head from "next/head";
import Script from "next/script";
import { useApiConfig } from "./useApiConfig";
import { ApiConfig } from "@/features/drivers/types";
import { createContext, useContext } from "react";

export interface ConfigContextType {
  config: ApiConfig;
}

export const ConfigContext = createContext<ConfigContextType | undefined>(
  undefined,
);

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }
  return context;
};

export const ConfigProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: config } = useApiConfig();

  if (!config) {
    return (
      <div className="global-loader">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <ConfigContext.Provider value={{ config }}>
      {config.FRONTEND_CSS_URL && (
        <Head>
          <link rel="stylesheet" href={config.FRONTEND_CSS_URL} />
        </Head>
      )}
      {config.FRONTEND_JS_URL && <Script src={config.FRONTEND_JS_URL} />}
      {children}
    </ConfigContext.Provider>
  );
};
