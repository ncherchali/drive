// Visionneuse de fichiers native — Design System (remplace le `FilePreview` de
// l'ui-kit DINUM, dépose totale, lot 9). Overlay plein écran : viewers natifs
// (image / PDF via iframe / vidéo / audio HTML5), repli « non pris en charge »
// avec téléchargement, avertissement « suspect », carrousel (flèches + clavier),
// en-tête (titre, actions, fermeture) et panneau latéral (infos).
//
// Pages Router : pas de "use client". Le conteneur porte `.sahla-ds .dark`
// (thème sombre de la visionneuse) pour des tokens corrects hors sous-arbre DS.
import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileWarning,
  FileQuestion,
  PanelRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import {
  getExtensionFromName,
  getMimeCategory,
  MimeCategory,
} from "@/features/explorer/utils/fileTypes";
import type { FilePreviewType } from "./filePreviewType";

export type DsFilePreviewProps = {
  isOpen: boolean;
  onClose?: () => void;
  files?: FilePreviewType[];
  openedFileId?: string;
  headerRightContent?: React.ReactNode;
  sidebarContent?: React.ReactNode;
  onChangeFile?: (file?: FilePreviewType) => void;
  onFileOpen?: (file: FilePreviewType) => void;
  handleDownloadFile?: (file?: FilePreviewType) => void;
  onOpenInEditor?: (file: FilePreviewType) => void;
};

export const DsFilePreview = ({
  isOpen,
  onClose,
  files = [],
  openedFileId,
  headerRightContent,
  sidebarContent,
  onChangeFile,
  onFileOpen,
  handleDownloadFile,
  onOpenInEditor,
}: DsFilePreviewProps) => {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const index = Math.max(
    0,
    files.findIndex((file) => file.id === openedFileId),
  );
  const current: FilePreviewType | undefined = files[index];

  // Analytics : signale l'ouverture du fichier courant.
  const lastOpened = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (isOpen && current && lastOpened.current !== current.id) {
      lastOpened.current = current.id;
      onFileOpen?.(current);
    }
    if (!isOpen) {
      lastOpened.current = null;
    }
  }, [isOpen, current, onFileOpen]);

  const goTo = React.useCallback(
    (delta: number) => {
      if (files.length < 2) return;
      const next = (index + delta + files.length) % files.length;
      onChangeFile?.(files[next]);
    },
    [files, index, onChangeFile],
  );

  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
      else if (e.key === "ArrowLeft") goTo(-1);
      else if (e.key === "ArrowRight") goTo(1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose, goTo]);

  if (!isOpen || !current) {
    return null;
  }

  return (
    <div
      className="sahla-ds dark fixed inset-0 z-50 flex flex-col bg-background text-foreground"
      role="dialog"
      aria-modal="true"
      aria-label={current.title}
    >
      {/* En-tête */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-solid border-border px-3">
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {current.title}
        </span>
        <div className="flex items-center gap-1">
          {headerRightContent}
          {current.is_wopi_supported && onOpenInEditor && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => onOpenInEditor(current)}
            >
              <ExternalLink className="size-4" />
              {t("explorer.preview.open_in_editor", "Ouvrir dans l'éditeur")}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("explorer.preview.download", "Télécharger")}
            onClick={() => handleDownloadFile?.(current)}
          >
            <Download className="size-4" />
          </Button>
          {sidebarContent && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("explorer.preview.toggle_info", "Informations")}
              className={cn(sidebarOpen && "text-foreground")}
              onClick={() => setSidebarOpen((open) => !open)}
            >
              <PanelRight className="size-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("explorer.preview.close", "Fermer")}
            onClick={() => onClose?.()}
          >
            <X className="size-4" />
          </Button>
        </div>
      </header>

      {/* Corps : viewer + navigation + panneau latéral */}
      <div className="flex min-h-0 flex-1">
        <div className="relative flex min-w-0 flex-1 items-center justify-center overflow-auto bg-muted/30">
          {files.length > 1 && (
            <Button
              variant="secondary"
              size="icon"
              aria-label={t("explorer.preview.previous", "Précédent")}
              className="absolute start-3 top-1/2 z-10 -translate-y-1/2 rounded-full shadow"
              onClick={() => goTo(-1)}
            >
              <ChevronLeft className="size-5" />
            </Button>
          )}
          <PreviewViewer file={current} />
          {files.length > 1 && (
            <Button
              variant="secondary"
              size="icon"
              aria-label={t("explorer.preview.next", "Suivant")}
              className="absolute end-3 top-1/2 z-10 -translate-y-1/2 rounded-full shadow"
              onClick={() => goTo(1)}
            >
              <ChevronRight className="size-5" />
            </Button>
          )}
        </div>

        {sidebarContent && sidebarOpen && (
          <aside className="w-72 shrink-0 overflow-y-auto border-s border-solid border-border bg-background p-4">
            {sidebarContent}
          </aside>
        )}
      </div>
    </div>
  );
};

/** Rend le contenu adapté à la catégorie de fichier. */
const PreviewViewer = ({ file }: { file: FilePreviewType }) => {
  const { t } = useTranslation();
  const src = file.url_preview || file.url;

  if (file.isSuspicious) {
    return (
      <PreviewMessage
        icon={<FileWarning className="size-12" aria-hidden />}
        message={t(
          "explorer.preview.suspicious",
          "Ce fichier est suspect et ne peut pas être prévisualisé.",
        )}
      />
    );
  }

  const category = getMimeCategory(
    file.mimetype,
    getExtensionFromName(file.title),
  );

  switch (category) {
    case MimeCategory.IMAGE:
      return (
        <img
          src={src}
          alt={file.title}
          className="max-h-full max-w-full object-contain"
        />
      );
    case MimeCategory.PDF:
      return (
        <iframe
          src={src}
          title={file.title}
          className="h-full w-full border-0 bg-white"
        />
      );
    case MimeCategory.VIDEO:
      return (
        <video
          src={file.url}
          controls
          className="max-h-full max-w-full"
          aria-label={file.title}
        />
      );
    case MimeCategory.AUDIO:
      return <audio src={file.url} controls aria-label={file.title} />;
    default:
      return (
        <PreviewMessage
          icon={<FileQuestion className="size-12" aria-hidden />}
          message={t(
            "explorer.preview.not_supported",
            "L'aperçu n'est pas disponible pour ce type de fichier.",
          )}
        />
      );
  }
};

const PreviewMessage = ({
  icon,
  message,
}: {
  icon: React.ReactNode;
  message: string;
}) => (
  <div className="flex flex-col items-center gap-3 p-8 text-center text-muted-foreground">
    {icon}
    <p className="max-w-sm text-sm">{message}</p>
  </div>
);
