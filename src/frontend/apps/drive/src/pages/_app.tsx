import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { ThemeProvider } from "@/features/theme/ThemeProvider";
import type { NextPage } from "next";
import type { AppProps } from "next/app";
import { ContextMenuProvider } from "@/components/ds-context-menu";
import { DsModalsProvider } from "@/components/ds-modals";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  MutationCache,
  Query,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import "../styles/globals.scss";
import "../styles/tailwind.css";
import "../features/i18n/initI18n";
import {
  addToast,
  ToasterItem,
} from "@/features/ui/components/toaster/Toaster";
import { APIError, errorToString } from "@/features/api/APIError";
import Head from "next/head";
import { useTranslation } from "react-i18next";
import { AnalyticsProvider } from "@/features/analytics/AnalyticsProvider";
import { ConfigProvider } from "@/features/config/ConfigProvider";
import {
  removeQuotes,
  useCunninghamTheme,
} from "@/features/ui/cunningham/useCunninghamTheme";
import { ResponsiveDivs } from "@/features/ui/components/responsive/ResponsiveDivs";
import { FeedbackFooterMobile } from "@/features/feedback/Feedback";
import { useRouter } from "next/router";

export type NextPageWithLayout<P = object, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};
const onError = (error: Error, query: unknown) => {
  if ((query as Query).meta?.noGlobalError) {
    return;
  }

  // Don't show toast for 401/403 errors because the app handles them by
  // redirecting to the 401/403 page. So we don't want to show a toast before
  // the redirect, it would feels buggy.
  if (error instanceof APIError) {
    if (error.code === 401) {
      return;
    }
    if (error.code === 403 && !(query as Query).meta?.showErrorOn403) {
      return;
    }
  }

  addToast(
    <ToasterItem type="error">
      <span>{errorToString(error)}</span>
    </ToasterItem>,
  );
};

const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error, variables, context, mutation) => {
      onError(error, mutation);
    },
  }),
  queryCache: new QueryCache({
    onError: (error, query) => onError(error, query),
  }),
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

export interface AppContextType {
  theme: string;
  setTheme: (theme: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppContextProvider");
  }
  return context;
};

export default function MyApp({
  Component,
  pageProps,
  router,
}: AppPropsWithLayout) {
  const [theme, setTheme] = useState<string>("sahla-light");

  return (
    <AppContext.Provider value={{ theme, setTheme }}>
      <MyAppInner Component={Component} pageProps={pageProps} router={router} />
    </AppContext.Provider>
  );
}

const MyAppInner = ({ Component, pageProps }: AppPropsWithLayout) => {
  // Use the layout defined at the page level, if available
  const getLayout = Component.getLayout ?? ((page) => page);
  const { t } = useTranslation();
  const { theme } = useAppContext();
  const router = useRouter();
  const themeTokens = useCunninghamTheme();

  // Thème de marque : applique la classe de tokens (`cunningham-theme--<theme>`,
  // pilotée par la config) sur <html>. Remplace l'injection de tokens que faisait
  // le CunninghamProvider (déposé) ; alimente les `--c--*` encore référencés par
  // quelques SCSS/composants (migrés vers @theme au lot 13b). Le mode clair/sombre
  // est lui géré par le ThemeProvider DS (classe `.dark`), source unique.
  useEffect(() => {
    const el = document.documentElement;
    el.classList.forEach((cls) => {
      if (cls.startsWith("cunningham-theme--")) {
        el.classList.remove(cls);
      }
    });
    el.classList.add(`cunningham-theme--${theme}`);
  }, [theme]);

  const isSdk = useMemo(
    () => router.pathname.startsWith("/sdk"),
    [router.pathname],
  );

  return (
    <>
      <Head>
        <title>{t("app_title")}</title>
        <link
          rel="icon"
          href={removeQuotes(themeTokens.components.favicon.src)}
          type={
            removeQuotes(themeTokens.components.favicon.src).endsWith(".svg")
              ? "image/svg+xml"
              : "image/png"
          }
        />
        {/* Inter (police de base LTR du DS, remplace les @font-face d'ui-kit) +
            Cairo (interface arabe RTL — cf. --font-cairo). */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Cairo:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ConfigProvider>
            <AnalyticsProvider>
              <ContextMenuProvider>
                <DsModalsProvider>
                  {getLayout(<Component {...pageProps} />)}
                </DsModalsProvider>
              </ContextMenuProvider>
              <ResponsiveDivs />
              {!isSdk && <FeedbackFooterMobile />}
            </AnalyticsProvider>
          </ConfigProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === "development" && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </>
  );
};
