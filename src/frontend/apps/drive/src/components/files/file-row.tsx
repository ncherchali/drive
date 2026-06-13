// Composant DS — ligne fichier/dossier de l'explorateur EFSS.
// Pages Router : pas de "use client" (en App Router, l'ajouter en tête).
import * as React from "react";
import {
  Folder,
  FileText,
  MoreVertical,
  ShieldCheck,
  LoaderCircle,
  CloudCheck,
  CloudAlert,
  Download,
  Share2,
  PenLine,
  Trash2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export type SyncState = "idle" | "syncing" | "synced" | "error";

export interface FileItem {
  id: string;
  name: string;
  type: "file" | "folder";
  size?: number;
  updatedAt: string | Date;
  syncState?: SyncState;
  encrypted?: boolean;
  mimeLabel?: string;
}

export type FileRowAction =
  | "open"
  | "ai"
  | "download"
  | "share"
  | "rename"
  | "delete";

export interface FileRowProps
  extends Omit<React.ComponentProps<"div">, "onSelect"> {
  item: FileItem;
  selected?: boolean;
  /** Affiche une case à cocher de sélection en tête de ligne. */
  selectable?: boolean;
  onOpen?: (item: FileItem) => void;
  onSelectedChange?: (checked: boolean, item: FileItem) => void;
  onAction?: (action: FileRowAction, item: FileItem) => void;
}

const numberFmt = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });
function formatBytes(bytes?: number) {
  if (bytes == null) return "—";
  if (bytes === 0) return "0 o";
  const units = ["o", "Ko", "Mo", "Go", "To"];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  return `${numberFmt.format(bytes / 1024 ** i)} ${units[i]}`;
}

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});
function formatDate(d: string | Date) {
  return dateFmt.format(typeof d === "string" ? new Date(d) : d);
}

/** Pastille de statut de synchronisation (animation discrète, texte SR). */
function SyncIndicator({ state }: { state: SyncState }) {
  if (state === "syncing") {
    return (
      <span className="inline-flex items-center text-syncing" aria-live="polite">
        <LoaderCircle className="size-4 animate-spin" aria-hidden />
        <span className="sr-only">Synchronisation en cours</span>
      </span>
    );
  }
  if (state === "synced") {
    return (
      <span className="inline-flex items-center text-muted-foreground">
        <CloudCheck className="size-4" aria-hidden />
        <span className="sr-only">Synchronisé</span>
      </span>
    );
  }
  if (state === "error") {
    return (
      <span
        className="inline-flex items-center text-destructive"
        aria-live="polite"
      >
        <CloudAlert className="size-4" aria-hidden />
        <span className="sr-only">Échec de synchronisation</span>
      </span>
    );
  }
  return null;
}

export function FileRow({
  item,
  selected = false,
  selectable = false,
  onOpen,
  onSelectedChange,
  onAction,
  className,
  ...props
}: FileRowProps) {
  const Icon = item.type === "folder" ? Folder : FileText;
  const syncState = item.syncState ?? "idle";

  const handleOpen = () => {
    onOpen?.(item);
    onAction?.("open", item);
  };

  return (
    <div
      role="row"
      aria-selected={selected}
      data-state={selected ? "selected" : undefined}
      className={cn(
        "group/row relative flex items-center gap-3 rounded-lg px-3 py-2",
        "transition-colors duration-150",
        "hover:bg-accent/60",
        "focus-within:bg-accent/60 focus-within:ring-1 focus-within:ring-ring/40",
        "data-[state=selected]:bg-accent data-[state=selected]:ring-1 data-[state=selected]:ring-primary/30",
        className,
      )}
      {...props}
    >
      {/* Case à cocher de sélection (optionnelle) */}
      {selectable && (
        <span role="gridcell" className="shrink-0">
          <Checkbox
            checked={selected}
            onCheckedChange={(c) => onSelectedChange?.(c === true, item)}
            aria-label={`Sélectionner ${item.name}`}
            className={cn(
              "transition-opacity",
              selected
                ? "opacity-100"
                : "opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100",
            )}
          />
        </span>
      )}

      {/* Icône type */}
      <span role="gridcell" className="shrink-0">
        <Icon
          className={cn(
            "size-5",
            item.type === "folder" ? "text-primary" : "text-muted-foreground",
          )}
          aria-hidden
        />
      </span>

      {/* Nom (action d'ouverture) + badges */}
      <span role="gridcell" className="flex min-w-0 flex-1 items-center gap-2">
        <button
          type="button"
          onClick={handleOpen}
          className={cn(
            "truncate rounded-sm text-start text-sm font-medium text-foreground outline-none",
            "hover:text-primary focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          {item.name}
        </button>

        {item.encrypted && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5",
              "bg-encrypted/10 text-[11px] font-medium text-encrypted",
            )}
            title="Chiffré de bout en bout"
          >
            <ShieldCheck className="size-3" aria-hidden />
            <span className="sr-only">Chiffré de bout en bout</span>
          </span>
        )}
      </span>

      {/* Sync */}
      <span role="gridcell" className="hidden shrink-0 sm:inline-flex">
        <SyncIndicator state={syncState} />
      </span>

      {/* Métadonnées */}
      <span
        role="gridcell"
        className="hidden w-20 shrink-0 text-end text-xs tabular-nums text-muted-foreground md:block"
      >
        {item.type === "folder" ? "—" : formatBytes(item.size)}
      </span>
      <span
        role="gridcell"
        className="hidden w-28 shrink-0 text-end text-xs text-muted-foreground lg:block"
      >
        {formatDate(item.updatedAt)}
      </span>

      {/* Menu contextuel — révélation progressive au survol/focus */}
      <span role="gridcell" className="shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`Actions pour ${item.name}`}
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-md text-muted-foreground outline-none",
              "opacity-0 transition-opacity duration-150",
              "group-hover/row:opacity-100 focus-visible:opacity-100",
              "data-[state=open]:bg-accent data-[state=open]:opacity-100",
              "hover:bg-accent hover:text-foreground",
              "focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <MoreVertical className="size-4" aria-hidden />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => onAction?.("ai", item)}>
              <Sparkles className="text-ai-purple" /> Analyser avec l’IA
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onAction?.("download", item)}>
              <Download /> Télécharger
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAction?.("share", item)}>
              <Share2 /> Partager
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAction?.("rename", item)}>
              <PenLine /> Renommer
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => onAction?.("delete", item)}
            >
              <Trash2 /> Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </span>
    </div>
  );
}
