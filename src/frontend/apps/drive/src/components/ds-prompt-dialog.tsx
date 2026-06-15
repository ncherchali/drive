// Dialogue de saisie réutilisable du DS (au-dessus de Dialog Radix).
// Pages Router : pas de "use client".
//
// Formulaire mono-champ (créer dossier/workspace, renommer…). Comme
// DsConfirmDialog : le contenu est portalé vers <body> (hors `.sahla-ds`), on
// pose donc le reset scopé + `dir` dessus, et DirectionProvider (contexte React)
// traverse le portail pour aligner Radix en RTL.
//
// L'état du champ vit dans un sous-composant monté UNIQUEMENT à l'ouverture
// (Radix ne rend le contenu que `open`), ce qui réinitialise la valeur à chaque
// ouverture sans setState dans un effet.
import * as React from "react";
import { DirectionProvider } from "@radix-ui/react-direction";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface DsPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  label: string;
  defaultValue?: string;
  submitLabel: string;
  cancelLabel: string;
  onSubmit: (value: string) => void | Promise<void>;
  /** Sélectionne le contenu du champ au focus (renommage). Défaut : false. */
  selectOnFocus?: boolean;
  inputTestId?: string;
  /** Désactive la validation pendant la mutation. */
  submitting?: boolean;
}

function PromptForm({
  label,
  defaultValue = "",
  submitLabel,
  cancelLabel,
  onSubmit,
  onCancel,
  selectOnFocus,
  inputTestId,
  submitting,
}: Omit<DsPromptDialogProps, "open" | "onOpenChange" | "title"> & {
  onCancel: () => void;
}) {
  const [value, setValue] = React.useState(defaultValue);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const labelId = React.useId();

  // Focus (et sélection éventuelle) au montage = à l'ouverture du dialogue.
  React.useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    if (selectOnFocus) {
      el.select();
    }
  }, [selectOnFocus]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    void onSubmit(trimmed);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Label htmlFor={labelId}>{label}</Label>
      <Input
        id={labelId}
        ref={inputRef}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        data-testid={inputTestId}
        autoComplete="off"
      />
      <DialogFooter className="pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button type="submit" disabled={submitting || value.trim() === ""}>
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function DsPromptDialog({
  open,
  onOpenChange,
  title,
  ...formProps
}: DsPromptDialogProps) {
  const { i18n } = useTranslation();
  const dir = (i18n.dir?.() as "ltr" | "rtl" | undefined) ?? "ltr";

  return (
    <DirectionProvider dir={dir}>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent dir={dir}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {/* Description a11y (sr-only) : le libellé du champ décrit la saisie
                attendue ; évite le warning Radix « Missing Description ». */}
            <DialogDescription className="sr-only">
              {formProps.label}
            </DialogDescription>
          </DialogHeader>
          {/* Monté uniquement à l'ouverture → valeur réinitialisée à chaque fois. */}
          <PromptForm {...formProps} onCancel={() => onOpenChange(false)} />
        </DialogContent>
      </Dialog>
    </DirectionProvider>
  );
}
