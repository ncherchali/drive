// Feature flags frontend. Lit `config.FEATURES[name]` (exposé par le backend
// django-configurations, convention FEATURES_*) avec :
//  - une surcharge de DEV via localStorage (`sahla_ds_flags` = JSON), pratique
//    pour tester un flag sans backend ;
//  - un repli par défaut.
// Quand le backend ne renvoie pas encore le flag, le repli s'applique.
import { useConfig } from "@/features/config/ConfigProvider";

type FlagMap = Record<string, boolean>;

function devOverride(name: string): boolean | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem("sahla_ds_flags");
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as FlagMap;
    return typeof parsed[name] === "boolean" ? parsed[name] : undefined;
  } catch {
    return undefined;
  }
}

export function useFeatureFlag(name: string, fallback = false): boolean {
  const { config } = useConfig();
  const override = devOverride(name);
  if (override !== undefined) return override;
  const flags = (config as { FEATURES?: FlagMap }).FEATURES ?? {};
  return typeof flags[name] === "boolean" ? flags[name] : fallback;
}

/** Nom du flag pilotant la bascule des modales de confirmation vers le DS. */
export const FLAG_DS_CONFIRM_MODALS = "DS_CONFIRM_MODALS";
