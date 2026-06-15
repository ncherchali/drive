import { ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { DirectionProvider } from "@radix-ui/react-direction";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type EntitlementDisclaimerModalProps = {
  title: ReactNode;
  description: ReactNode;
};

// Modale d'avertissement d'entitlement — Design System (anciennement Modal
// cunningham). Ouverte par défaut, fermée par le bouton (ou Échap / clic ext.).
export const EntitlementDisclaimerModal = ({
  title,
  description,
}: EntitlementDisclaimerModalProps) => {
  const { t, i18n } = useTranslation();
  const dir = (i18n.dir?.() as "ltr" | "rtl" | undefined) ?? "ltr";
  const [open, setOpen] = useState(true);

  return (
    <DirectionProvider dir={dir}>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sahla-ds" dir={dir}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription asChild>
              <div>{description}</div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setOpen(false)}>
              {t("entitlements.disclaimers.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DirectionProvider>
  );
};
