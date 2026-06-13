// ThemeProvider du Design System Sahla.
// Possède le mode (light/dark/system), le persiste (localStorage), suit la
// préférence système et applique la classe `.dark` sur <html>. C'est la source
// de vérité du thème pour le DS (et l'état cible post-Cunningham).
// Pages Router : pas de "use client".
import * as React from "react";

export type ThemeMode = "light" | "dark" | "system";
type Resolved = "light" | "dark";

interface ThemeContextValue {
  mode: ThemeMode;
  resolvedTheme: Resolved;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = "sahla-ds-theme";

function systemPrefersDark() {
  return (
    typeof window !== "undefined" &&
    !!window.matchMedia?.("(prefers-color-scheme: dark)").matches
  );
}

export function ThemeProvider({
  children,
  defaultMode = "system",
}: {
  children: React.ReactNode;
  defaultMode?: ThemeMode;
}) {
  const [mode, setModeState] = React.useState<ThemeMode>(defaultMode);
  const [resolvedTheme, setResolvedTheme] = React.useState<Resolved>("light");

  // Hydratation depuis le stockage (client uniquement).
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
      if (stored === "light" || stored === "dark" || stored === "system") {
        setModeState(stored);
      }
    } catch {
      /* localStorage indisponible */
    }
  }, []);

  // Résolution + application de `.dark` sur <html> ; suit le système si besoin.
  React.useEffect(() => {
    const apply = () => {
      const resolved: Resolved =
        mode === "system" ? (systemPrefersDark() ? "dark" : "light") : mode;
      setResolvedTheme(resolved);
      document.documentElement.classList.toggle("dark", resolved === "dark");
    };
    apply();
    if (mode === "system" && window.matchMedia) {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
  }, [mode]);

  const setMode = React.useCallback((next: ThemeMode) => {
    setModeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* localStorage indisponible */
    }
  }, []);

  const value = React.useMemo(
    () => ({ mode, resolvedTheme, setMode }),
    [mode, resolvedTheme, setMode],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme doit être utilisé dans un <ThemeProvider>");
  }
  return ctx;
}

/**
 * Pont de coexistence : applique `.dark` selon un booléen externe.
 * Tant que Cunningham est en place, son thème reste la source de vérité ; ce
 * hook (utilisé par _app) reflète l'état sombre vers les composants DS. Il
 * remplace l'ancien useEffect inline. À retirer une fois Cunningham supprimé
 * (le ThemeProvider deviendra alors l'unique source).
 */
export function useSyncDarkClass(isDark: boolean) {
  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);
}
