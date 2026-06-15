import { useAuth } from "@/features/auth/Auth";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown } from "lucide-react";
import { ExplorerSearchButton } from "@/features/explorer/components/app-view/ExplorerSearchButton";
import { getDriver } from "@/features/config/Config";
import { Item } from "@/features/drivers/types";
import { ItemFilters } from "@/features/drivers/Driver";
import { useIsMinimalLayout } from "@/utils/useLayout";
import { Feedback } from "@/features/feedback/Feedback";
import { UserProfile } from "@/features/ui/components/user/UserProfile";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export const HeaderIcon = () => {
  return (
    <div className="drive__header__left">
      <div className="drive__header__logo" />
      <Feedback />
    </div>
  );
};

export const LANGUAGES = [
  {
    label: "Français",
    value: "fr-fr",
    shortLabel: "FR",
  },
  {
    label: "English",
    value: "en-us",
    shortLabel: "EN",
  },
  {
    label: "Nederlands",
    value: "nl-nl",
    shortLabel: "NL",
  },
  {
    label: "Deutsch",
    value: "de-de",
    shortLabel: "DE",
  },
  {
    label: "العربية",
    value: "ar",
    shortLabel: "ع",
  },
];

export const HeaderRight = ({
  displaySearch,
  currentItem,
}: {
  displaySearch?: boolean;
  currentItem?: Item;
}) => {
  const { user } = useAuth();
  const isMinimalLayout = useIsMinimalLayout();
  const isMobile = useIsMobile();

  const defaultFilters: ItemFilters = useMemo(() => {
    const workspaceId = currentItem?.parents?.[0]?.id ?? currentItem?.id;

    if (isMinimalLayout) {
      return {
        workspace: workspaceId,
      };
    }
    return {};
  }, [currentItem, isMinimalLayout]);

  return (
    <>
      {user && displaySearch && (
        <ExplorerSearchButton defaultFilters={defaultFilters} />
      )}

      {!isMobile && <UserProfile />}
    </>
  );
};

/** Sélecteur de langue (dropdown DS) — anciennement LanguagePicker d'ui-kit. */
export const LanguagePickerUserMenu = () => {
  const { i18n } = useTranslation();
  const { user, refreshUser } = useAuth();
  const driver = getDriver();
  const [selectedLanguage, setSelectedLanguage] = useState(user?.language);

  // On force la langue en minuscules car django utilise "en-us", pas "en-US".
  const onChange = (value: string) => {
    setSelectedLanguage(value);
    i18n.changeLanguage(value).catch((err) => {
      console.error("Error changing language", err);
    });
    if (user) {
      // La langue s'applique côté client via i18n ci-dessus. La persistance
      // backend peut échouer si le serveur n'autorise pas cette langue (ses
      // choix User.language viennent de settings.LANGUAGES) — ne pas crasher.
      driver
        .updateUser({ language: value, id: user.id })
        .then(() => {
          void refreshUser?.();
        })
        .catch((err) => {
          console.error("Could not persist language to backend", err);
        });
    }
  };

  const current =
    LANGUAGES.find((l) => l.value === selectedLanguage)?.shortLabel ?? "FR";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-foreground outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
        >
          {current}
          <ChevronDown className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        {LANGUAGES.map((language) => (
          <DropdownMenuItem
            key={language.value}
            onSelect={() => onChange(language.value)}
          >
            <span className="flex-1">{language.label}</span>
            {language.value === selectedLanguage && (
              <Check className="ms-auto size-4" aria-hidden />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
