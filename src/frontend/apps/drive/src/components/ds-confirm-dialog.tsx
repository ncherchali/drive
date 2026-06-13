// Dialogue de confirmation réutilisable du DS (au-dessus d'AlertDialog Radix).
// Encapsule le pattern portail : AlertDialog portale vers <body>, hors de tout
// `.sahla-ds` → on pose le reset scopé + `dir` sur le contenu portalé, et le
// DirectionProvider (contexte React) traverse le portail pour aligner Radix.
//
// La décision est portée par les boutons (onConfirm/onCancel) ; `onOpenChange`
// ne gère que la fermeture (Échap / clic extérieur / après action) → pas de
// double déclenchement.
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
import { cn } from "@/utils/cn";

export interface DsConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description: React.ReactNode;
  cancelLabel: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel?: () => void;
  /** Bouton de confirmation en style destructif (rouge). Défaut : true. */
  destructive?: boolean;
}

export function DsConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  cancelLabel,
  confirmLabel,
  onConfirm,
  onCancel,
  destructive = true,
}: DsConfirmDialogProps) {
  const { i18n } = useTranslation();
  const dir = (i18n.dir?.() as "ltr" | "rtl" | undefined) ?? "ltr";

  return (
    <DirectionProvider dir={dir}>
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent className="sahla-ds" dir={dir}>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onCancel}>
              {cancelLabel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirm}
              className={cn(
                destructive &&
                  "bg-destructive text-destructive-foreground hover:bg-destructive/90",
              )}
            >
              {confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DirectionProvider>
  );
}
