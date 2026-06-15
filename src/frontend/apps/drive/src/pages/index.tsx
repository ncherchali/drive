import { GlobalLayout } from "@/features/layouts/components/global/GlobalLayout";
import Head from "next/head";
import { useTranslation } from "react-i18next";
import { login, useAuth } from "@/features/auth/Auth";
import { useEffect, useState } from "react";
import banner from "@/assets/home/banner.png";
import { HeaderRight } from "@/features/layouts/components/header/Header";
import {
  addToast,
  Toaster,
  ToasterItem,
} from "@/features/ui/components/toaster/Toaster";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { useConfig } from "@/features/config/ConfigProvider";
import { useThemeCustomization } from "@/hooks/useThemeCustomization";
import { Feedback } from "@/features/feedback/Feedback";
import { useRedirectAfterLogin } from "@/hooks/useRedirectAfterLogin";

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
  const footerCustomization = useThemeCustomization("footer");
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
    <HomePageLayout>
      <Head>
        <title>{t("app_title")}</title>
        <meta name="description" content={t("app_description")} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          rel="icon"
          href="/assets/sahla_favicon.svg"
          type="image/svg+xml"
        />
      </Head>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 py-12">
        <section className="flex flex-col items-center gap-10 md:flex-row md:justify-between">
          <div className="flex max-w-md flex-col items-start gap-5">
            <div className="drive__logo-icon" />
            <h2 className="text-3xl font-bold leading-tight text-foreground">
              {t("home.title")}
            </h2>
            <p className="text-base text-muted-foreground">
              {t("home.subtitle")}
            </p>
            <div className="flex w-full flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="w-full sm:w-auto"
                onClick={() => login()}
              >
                {t("home.main_button")}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto"
                asChild
              >
                <a
                  href={config?.FRONTEND_MORE_LINK}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t("home.more")}
                </a>
              </Button>
            </div>
          </div>
          <img
            src={banner.src}
            alt=""
            className="w-full max-w-md rounded-xl md:max-w-lg"
            decoding="async"
          />
        </section>
      </div>

      <HomeFooter {...footerCustomization} />
    </HomePageLayout>
  );
};

type FooterLink = { label: string; href: string };

type HomeFooterProps = {
  externalLinks?: readonly FooterLink[];
  legalLinks?: readonly FooterLink[];
  license?: { label: string; link: FooterLink };
  logo?: { src: string; width?: string; height?: string; alt: string };
};

/** Pied de page de la landing — natif DS (remplace le `Footer` d'ui-kit). */
const HomeFooter = ({
  externalLinks,
  legalLinks,
  license,
  logo,
}: HomeFooterProps) => {
  return (
    <footer className="mt-auto border-t border-solid border-border bg-muted/30">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-6 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {logo?.src ? (
            <img
              src={logo.src}
              alt={logo.alt}
              width={logo.width}
              height={logo.height}
              decoding="async"
            />
          ) : (
            <div className="drive__header__logo" />
          )}
          {externalLinks && externalLinks.length > 0 && (
            <div className="flex flex-wrap items-center gap-4">
              {externalLinks.map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  <span>{label}</span>
                  <ExternalLink className="size-3.5" aria-hidden />
                </a>
              ))}
            </div>
          )}
        </div>

        {legalLinks && legalLinks.length > 0 && (
          <div className="flex flex-wrap items-center gap-4 border-t border-solid border-border pt-4">
            {legalLinks.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {label}
              </a>
            ))}
          </div>
        )}

        {license && (
          <p className="text-xs text-muted-foreground">
            {license.label}{" "}
            <a
              href={license.link.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 hover:text-foreground"
            >
              <span>{license.link.label}</span>
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
          </p>
        )}
      </div>
    </footer>
  );
};

const HomePageLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AppHeader className="justify-between">
        <div className="flex items-center gap-2">
          <div className="drive__header__logo" />
          <Feedback />
        </div>
        <div className="ms-auto flex items-center gap-2">
          <HeaderRight />
        </div>
      </AppHeader>
      {children}
      <Toaster />
    </div>
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
