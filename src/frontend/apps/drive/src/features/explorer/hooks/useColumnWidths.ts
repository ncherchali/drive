// Largeurs des colonnes de données de la grille, redimensionnables au drag.
// Persistées en localStorage (par TYPE de colonne, global) : une largeur dépend
// de l'écran de l'utilisateur, pas de son compte → on ne touche pas au backend.
import { useCallback, useState } from "react";
import { ColumnType } from "../types/columns";

const STORAGE_KEY = "sahla-column-widths";
export const DEFAULT_COLUMN_WIDTH = 170;
const MIN_WIDTH = 90;
const MAX_WIDTH = 480;

type WidthMap = Partial<Record<ColumnType, number>>;

const read = (): WidthMap => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as WidthMap) : {};
  } catch {
    return {};
  }
};

const write = (widths: WidthMap) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widths));
  } catch {
    /* localStorage indisponible */
  }
};

export function useColumnWidths() {
  const [widths, setWidths] = useState<WidthMap>(() => read());

  const getWidth = useCallback(
    (type: ColumnType) => widths[type] ?? DEFAULT_COLUMN_WIDTH,
    [widths],
  );

  // Démarre un drag de redimensionnement depuis le bord d'un en-tête de colonne.
  const startResize = useCallback(
    (type: ColumnType, startX: number, startWidth: number) => {
      const onMove = (event: MouseEvent) => {
        const next = Math.min(
          MAX_WIDTH,
          Math.max(MIN_WIDTH, startWidth + (event.clientX - startX)),
        );
        setWidths((prev) => ({ ...prev, [type]: next }));
      };
      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        // Persiste l'état final (évite d'écrire à chaque pixel).
        setWidths((prev) => {
          write(prev);
          return prev;
        });
      };
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [],
  );

  return { getWidth, startResize };
}
