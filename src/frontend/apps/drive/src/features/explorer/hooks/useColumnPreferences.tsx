import { createContext, ReactNode, useCallback, useContext, useState } from "react";
import {
  ColumnPreferences,
  ColumnType,
  DEFAULT_COLUMN_PREFERENCES,
} from "../types/columns";
import { useAuth } from "@/features/auth/Auth";
import { getDriver } from "@/features/config/Config";

type ColumnPreferencesContextType = {
  prefs: ColumnPreferences;
  /** Ajoute la colonne si absente, la retire si présente. */
  toggleColumn: (type: ColumnType) => void;
  /** Remplace la liste ordonnée des colonnes. */
  setColumns: (columns: ColumnType[]) => void;
};

const ColumnPreferencesContext = createContext<
  ColumnPreferencesContextType | undefined
>(undefined);

export function ColumnPreferencesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { user, refreshUser } = useAuth();
  const driver = getDriver();

  const [prefs, setPrefsState] = useState<ColumnPreferences>(
    () => user?.column_preferences ?? DEFAULT_COLUMN_PREFERENCES,
  );

  const persist = useCallback(
    (next: ColumnPreferences) => {
      if (user) {
        driver
          .updateUser({ id: user.id, column_preferences: next })
          .then(() => {
            void refreshUser?.();
          });
      }
    },
    [user, driver, refreshUser],
  );

  const setColumns = useCallback(
    (columns: ColumnType[]) => {
      // Dédoublonne en conservant l'ordre (le backend le fait aussi, défensif).
      const unique = columns.filter((c, i) => columns.indexOf(c) === i);
      setPrefsState(() => {
        const next = { columns: unique };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const toggleColumn = useCallback(
    (type: ColumnType) => {
      setPrefsState((prev) => {
        const has = prev.columns.includes(type);
        const next = {
          columns: has
            ? prev.columns.filter((c) => c !== type)
            : [...prev.columns, type],
        };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  return (
    <ColumnPreferencesContext.Provider value={{ prefs, toggleColumn, setColumns }}>
      {children}
    </ColumnPreferencesContext.Provider>
  );
}

export function useColumnPreferences(): ColumnPreferencesContextType {
  const context = useContext(ColumnPreferencesContext);
  if (!context) {
    throw new Error(
      "useColumnPreferences must be used within a ColumnPreferencesProvider",
    );
  }
  return context;
}
