import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { DirectionProvider } from "@radix-ui/react-direction";

import { useConfig } from "@/features/config/ConfigProvider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { useReleaseNote } from "./useReleaseNote";

// Notes de version — Design System (anciennement ReleaseNoteModal d'ui-kit).
// Liste les étapes (icône + titre + description) dans un Dialog DS.
export const ReleaseNoteAuto = () => {
  const { config } = useConfig();
  const { t, i18n } = useTranslation();
  const dir = (i18n.dir?.() as "ltr" | "rtl" | undefined) ?? "ltr";
  const enabled = config?.FRONTEND_RELEASE_NOTE_ENABLED;
  const [isOpen, setIsOpen] = useState(false);
  const { shouldShow, mainTitle, steps, markAsSeen } = useReleaseNote();

  useEffect(() => {
    if (shouldShow) {
      setIsOpen(true);
    }
  }, [shouldShow]);

  const handleClose = async () => {
    setIsOpen(false);
    await markAsSeen();
  };

  if (!enabled) {
    return null;
  }

  if (!shouldShow && !isOpen) {
    return null;
  }

  return (
    <DirectionProvider dir={dir}>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) void handleClose();
        }}
      >
        <DialogContent className="sahla-ds" dir={dir}>
          <DialogHeader>
            <DialogTitle>{mainTitle}</DialogTitle>
            <DialogDescription className="sr-only">
              {t("release_notes.labels.app_name")}
            </DialogDescription>
          </DialogHeader>

          <ul className="flex flex-col gap-4">
            {steps.map((step, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center text-primary [&_svg]:size-5 [&_img]:size-5">
                  {step.icon}
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{step.title}</p>
                  {step.description && (
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <DialogFooter className="items-center sm:justify-between">
            <a
              href="https://docs.numerique.gouv.fr/docs/46085eec-8fd9-4466-98db-b8a40fb545fd/"
              target="_blank"
              rel="noreferrer"
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              {t("release_notes.labels.see_whats_new")}
            </a>
            <Button onClick={handleClose}>
              {t("release_notes.labels.close", "OK")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DirectionProvider>
  );
};
