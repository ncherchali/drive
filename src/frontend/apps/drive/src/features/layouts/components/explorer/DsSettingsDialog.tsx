// Modale « Paramètres » DS (accès depuis le footer de la sidebar).
// Réglages réels : apparence (thème clair/sombre/système) et langue. Le thème
// est piloté par le ThemeProvider DS (source unique : état + localStorage +
// classe `.dark`) via useTheme(). La langue via i18next. Pages Router : pas de
// "use client". Modale portalée → contenu marqué `.sahla-ds` (cf. dialog DS).
import * as React from "react";
import { useTranslation } from "react-i18next";
import { Monitor, Moon, Sun } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTheme, type ThemeMode } from "@/features/theme/ThemeProvider";
import { cn } from "@/utils/cn";

const LANGS = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
  { value: "ar", label: "العربية" },
];

const THEMES: { value: ThemeMode; icon: typeof Sun; key: string }[] = [
  { value: "light", icon: Sun, key: "settings.theme.light" },
  { value: "dark", icon: Moon, key: "settings.theme.dark" },
  { value: "system", icon: Monitor, key: "settings.theme.system" },
];

const THEME_LABELS: Record<ThemeMode, string> = {
  light: "Clair",
  dark: "Sombre",
  system: "Système",
};

export function DsSettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t, i18n } = useTranslation();
  const { mode, setMode } = useTheme();

  const onSelectTheme = (next: ThemeMode) => {
    setMode(next);
  };

  const currentLang = (i18n.language || "fr").split("-")[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("settings.title", "Paramètres")}</DialogTitle>
          <DialogDescription>
            {t("settings.description", "Apparence et langue de l'application.")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-1">
          {/* Thème */}
          <section>
            <p className="mb-2 text-sm font-medium text-foreground">
              {t("settings.theme.label", "Thème")}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {THEMES.map((th) => {
                const active = mode === th.value;
                const Icon = th.icon;
                return (
                  <Button
                    key={th.value}
                    type="button"
                    variant={active ? "secondary" : "outline"}
                    className={cn(
                      "h-auto flex-col gap-1.5 border-solid py-3",
                      active && "border-primary ring-1 ring-primary",
                    )}
                    onClick={() => onSelectTheme(th.value)}
                  >
                    <Icon className="size-5" />
                    <span className="text-xs">
                      {t(th.key, THEME_LABELS[th.value])}
                    </span>
                  </Button>
                );
              })}
            </div>
          </section>

          {/* Langue */}
          <section>
            <p className="mb-2 text-sm font-medium text-foreground">
              {t("settings.language.label", "Langue")}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {LANGS.map((lang) => {
                const active = currentLang === lang.value;
                return (
                  <Button
                    key={lang.value}
                    type="button"
                    variant={active ? "secondary" : "outline"}
                    className={cn(
                      "border-solid",
                      active && "border-primary ring-1 ring-primary",
                    )}
                    onClick={() => i18n.changeLanguage(lang.value)}
                  >
                    {lang.label}
                  </Button>
                );
              })}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
