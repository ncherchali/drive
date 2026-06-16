import { GlobalLayout } from "@/features/layouts/components/global/GlobalLayout";
import Head from "next/head";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/auth/Auth";
import { useEffect, useState } from "react";
import {
  addToast,
  Toaster,
  ToasterItem,
} from "@/features/ui/components/toaster/Toaster";
import { useConfig } from "@/features/config/ConfigProvider";
import { useRedirectAfterLogin } from "@/hooks/useRedirectAfterLogin";
import { HomeHero } from "@/features/home/HomeHero";

export default function HomePage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  useRedirectAfterLogin();

  useEffect(() => {
    const failure = new URLSearchParams(window.location.search).get(
      "auth_error"
    );
    if (failure === "alpha") {
      addToast(
        <ToasterItem type="error">
          <span className="material-icons">science</span>
          <span>{t("authentication.error.alpha")}</span>
        </ToasterItem>
      );
    }
    if (failure === "user_cannot_access_app") {
      addToast(
        <ToasterItem type="error">
          <span className="material-icons">lock</span>
          <span>{t("authentication.error.user_cannot_access_app")}</span>
        </ToasterItem>
      );
    }
  }, []);

  if (user) {
    return null;
  }

  return <HomePageContent />;
}

/**
 * If the FRONTEND_EXTERNAL_HOME_URL is set, we redirect to it.
 * Otherwise, we display the home page.
 *
 * Redirection to FRONTEND_EXTERNAL_HOME_URL is done in this component
 * to avoid conflicts with the useEffect and redirection logic in the HomePage component.
 *
 * HomePage: if there is a user, redirect to the explorer.
 * HomePageContent: if the FRONTEND_EXTERNAL_HOME_URL is set, we redirect to it.
 *                  Otherwise, we display the home page.
 */
const HomePageContent = () => {
  const { t } = useTranslation();
  const { config } = useConfig();
  const [redirectFailed, setRedirectFailed] = useState(false);

  useEffect(() => {
    const checkSiteAndRedirect = async () => {
      if (!config?.FRONTEND_EXTERNAL_HOME_URL) {
        return;
      }
      try {
        // Make sure the site is reachable before redirecting. Resilience.
        await fetch(config.FRONTEND_EXTERNAL_HOME_URL, {
          method: "HEAD", // Use HEAD to avoid downloading the full page
          mode: "no-cors", // Needed for cross-origin requests
        });
        window.location.replace(config.FRONTEND_EXTERNAL_HOME_URL);
      } catch (error) {
        console.warn("Site is not reachable:", error);
        setRedirectFailed(true);
      }
    };

    checkSiteAndRedirect();
  }, [config?.FRONTEND_EXTERNAL_HOME_URL]);

  if (config?.FRONTEND_EXTERNAL_HOME_URL && !redirectFailed) {
    return null;
  }

  return (
    <>
      <Head>
        <title>{t("app_title")}</title>
        <meta name="description" content={t("app_description")} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/assets/sahla_favicon.svg" type="image/svg+xml" />
      </Head>

      <HomeHero />
      <Toaster />
    </>
  );
};

/**
 * Only context stuff, containing Auth, etc ...
 * Do not include any interface related component here as if there is
 * an external home url defined, we do not want blinking effects happening
 * before redirection.
 */
HomePage.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <div className="drive__home drive__home--feedback">
      <GlobalLayout>{page}</GlobalLayout>
    </div>
  );
};
