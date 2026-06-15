// Service de modales IMPÉRATIVES — Design System (remplace useModals().
// confirmationModal / messageModal de @gouvfr-lasuite/cunningham-react).
// Un provider global expose, via useDsModals(), des fonctions promise-based qui
// ouvrent une AlertDialog DS et résolvent à la décision. Pages Router : pas de
// "use client".
import * as React from "react";
import { DirectionProvider } from "@radix-ui/react-direction";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

type ConfirmOptions = {
  title?: React.ReactNode;
  children?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
};
type MessageOptions = {
  title?: React.ReactNode;
  children?: React.ReactNode;
  okLabel?: string;
};

export type DsModalsApi = {
  /** Confirmation : résout "yes" si confirmé, null si annulé/fermé. */
  confirmationModal: (options: ConfirmOptions) => Promise<"yes" | null>;
  /** Message informatif : résout quand l'utilisateur ferme. */
  messageModal: (options: MessageOptions) => Promise<void>;
};

type ActiveModal =
  | {
      kind: "confirm";
      options: ConfirmOptions;
      resolve: (value: "yes" | null) => void;
    }
  | { kind: "message"; options: MessageOptions; resolve: () => void }
  | null;

const DsModalsContext = React.createContext<DsModalsApi | null>(null);

export const useDsModals = (): DsModalsApi => {
  const ctx = React.useContext(DsModalsContext);
  if (!ctx) {
    throw new Error("useDsModals doit être utilisé dans un <DsModalsProvider>");
  }
  return ctx;
};

export const DsModalsProvider = ({
  children,
}: {
  children?: React.ReactNode;
}) => {
  const { t, i18n } = useTranslation();
  const dir = (i18n.dir?.() as "ltr" | "rtl" | undefined) ?? "ltr";
  const [active, setActive] = React.useState<ActiveModal>(null);

  const confirmationModal = React.useCallback(
    (options: ConfirmOptions) =>
      new Promise<"yes" | null>((resolve) => {
        setActive({ kind: "confirm", options, resolve });
      }),
    [],
  );
  const messageModal = React.useCallback(
    (options: MessageOptions) =>
      new Promise<void>((resolve) => {
        setActive({ kind: "message", options, resolve });
      }),
    [],
  );

  const api = React.useMemo(
    () => ({ confirmationModal, messageModal }),
    [confirmationModal, messageModal],
  );

  const settle = (value: "yes" | null) => {
    if (!active) return;
    if (active.kind === "confirm") active.resolve(value);
    else active.resolve();
    setActive(null);
  };

  return (
    <DsModalsContext.Provider value={api}>
      {children}
      <DirectionProvider dir={dir}>
        <AlertDialog
          open={active !== null}
          onOpenChange={(open) => {
            // Fermeture (Échap / clic extérieur) = annulation.
            if (!open) settle(null);
          }}
        >
          {active && (
            <AlertDialogContent dir={dir}>
              <AlertDialogHeader>
                {active.options.title && (
                  <AlertDialogTitle>{active.options.title}</AlertDialogTitle>
                )}
                {active.options.children && (
                  <AlertDialogDescription>
                    {active.options.children}
                  </AlertDialogDescription>
                )}
              </AlertDialogHeader>
              <AlertDialogFooter>
                {active.kind === "confirm" && (
                  <AlertDialogCancel onClick={() => settle(null)}>
                    {active.options.cancelLabel ?? t("modal.cancel", "Annuler")}
                  </AlertDialogCancel>
                )}
                <AlertDialogAction onClick={() => settle("yes")}>
                  {active.kind === "confirm"
                    ? (active.options.confirmLabel ??
                      t("modal.confirm", "Confirmer"))
                    : ((active.options as MessageOptions).okLabel ??
                      t("modal.ok", "OK"))}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          )}
        </AlertDialog>
      </DirectionProvider>
    </DsModalsContext.Provider>
  );
};
