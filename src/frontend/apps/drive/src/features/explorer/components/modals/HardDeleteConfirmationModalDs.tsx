// Version Design System (shadcn/Radix) de la confirmation de suppression
// définitive — pilote de substitution Cunningham → DS (cf. useFeatureFlag).
//
// Particularité : AlertDialog (Radix) portale vers <body>, hors de tout wrapper
// `.sahla-ds`. On pose donc le reset scopé `.sahla-ds` ET la direction
// directement sur le contenu portalé ; le DirectionProvider (contexte React)
// traverse le portail pour aligner Radix sur la locale.
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

export interface HardDeleteConfirmationModalDsProps {
  isOpen: boolean;
  onClose: () => void;
  onDecide: (decision: "yes" | null) => void;
  count?: number;
}

export function HardDeleteConfirmationModalDs({
  isOpen,
  onClose,
  onDecide,
  count = 1,
}: HardDeleteConfirmationModalDsProps) {
  const { t, i18n } = useTranslation();
  const dir = (i18n.dir?.() as "ltr" | "rtl" | undefined) ?? "ltr";

  return (
    <DirectionProvider dir={dir}>
      <AlertDialog
        open={isOpen}
        // Fermeture par Échap / clic extérieur : on ferme sans décision.
        // La décision est portée uniquement par les boutons (un seul appel).
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <AlertDialogContent className="sahla-ds" dir={dir}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("explorer.trash.hard_delete.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("explorer.trash.hard_delete.content", { count })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => onDecide(null)}>
              {t("explorer.trash.hard_delete.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDecide("yes")}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("explorer.trash.hard_delete.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DirectionProvider>
  );
}
