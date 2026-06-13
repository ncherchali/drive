// Galerie du Design System Sahla (shadcn/Radix + Tailwind v4).
// Route : /ds-preview. Page de DEV/preview — à retirer avant prod.
//
// Le contenu est monté dans <DsProvider> (reset scopé `.sahla-ds` + direction
// LTR/RTL + contexte Tooltip). Bascules locales clair/sombre (`.dark`) et
// LTR/RTL pour valider tous les composants. Servie hors providers _app
// (cf. _app.tsx) → visible sans backend.
import * as React from "react";
import {
  Moon,
  Sun,
  Folder,
  Sparkles,
  Trash2,
  Info,
  Download,
  ArrowLeftRight,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { DsProvider } from "@/components/ds-provider";
import {
  FileRow,
  type FileItem,
  type FileRowAction,
} from "@/components/files/file-row";
import { AiPromptInput } from "@/components/ai/ai-prompt-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

const SAMPLE_FILES: FileItem[] = [
  { id: "1", name: "Contrats clients 2026", type: "folder", updatedAt: "2026-05-28", syncState: "synced" },
  { id: "2", name: "Rapport_financier_Q2.xlsx", type: "file", size: 248_000, updatedAt: "2026-06-11", syncState: "syncing" },
  { id: "3", name: "Statuts_juridiques_signés.pdf", type: "file", size: 1_280_000, updatedAt: "2026-06-02", syncState: "synced", encrypted: true },
  { id: "4", name: "Présentation_board.pptx", type: "file", size: 7_540_000, updatedAt: "2026-06-13", syncState: "error" },
  { id: "5", name: "Archives RH", type: "folder", updatedAt: "2026-04-19", syncState: "idle", encrypted: true },
];

const SWATCHES: { name: string; className: string; fg?: string }[] = [
  { name: "brand-primary", className: "bg-brand-primary", fg: "text-brand-primary-foreground" },
  { name: "brand-dark", className: "bg-brand-dark", fg: "text-white" },
  { name: "syncing", className: "bg-syncing", fg: "text-syncing-foreground" },
  { name: "encrypted", className: "bg-encrypted", fg: "text-encrypted-foreground" },
  { name: "ai-purple", className: "bg-ai-purple", fg: "text-ai-purple-foreground" },
  { name: "sidebar", className: "bg-sidebar border border-sidebar-border", fg: "text-sidebar-foreground" },
  { name: "muted", className: "bg-muted", fg: "text-muted-foreground" },
  { name: "accent", className: "bg-accent", fg: "text-accent-foreground" },
  { name: "destructive", className: "bg-destructive", fg: "text-destructive-foreground" },
];

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export default function DsPreviewPage() {
  const [isDark, setIsDark] = React.useState(false);
  const [dir, setDir] = React.useState<"ltr" | "rtl">("ltr");
  const [selectedId, setSelectedId] = React.useState<string | null>("3");
  const [lastAction, setLastAction] = React.useState<string>("—");
  const [checked, setChecked] = React.useState<Set<string>>(new Set(["3"]));
  const [encryptOn, setEncryptOn] = React.useState(true);

  const [isStreaming, setIsStreaming] = React.useState(false);
  const [log, setLog] = React.useState<string[]>([]);
  const timeoutRef = React.useRef<number | null>(null);

  const toggleChecked = (id: string, value: boolean) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (value) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleAction = (action: FileRowAction, item: FileItem) => {
    if (action === "open") setSelectedId(item.id);
    setLastAction(`${action} → ${item.name}`);
  };

  const handleSubmit = (prompt: string) => {
    setLog((l) => [prompt, ...l].slice(0, 5));
    setIsStreaming(true);
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setIsStreaming(false), 1800);
  };

  const handleStop = () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    setIsStreaming(false);
  };

  return (
    <DsProvider
      dir={dir}
      className={cn(
        "min-h-screen bg-background text-foreground",
        isDark && "dark",
      )}
    >
      <div className="mx-auto max-w-5xl space-y-12 p-6 sm:p-10">
        {/* En-tête */}
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Sahla Design System</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              shadcn/Radix + Tailwind v4 · <code className="rounded bg-muted px-1 py-0.5 text-xs">.sahla-ds</code> · {dir.toUpperCase()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDir((d) => (d === "ltr" ? "rtl" : "ltr"))}
              aria-label="Basculer la direction du texte"
            >
              <ArrowLeftRight /> {dir === "ltr" ? "RTL" : "LTR"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDark((v) => !v)}
              aria-pressed={isDark}
            >
              {isDark ? <Sun /> : <Moon />}
              {isDark ? "Clair" : "Sombre"}
            </Button>
          </div>
        </header>

        {/* Tokens */}
        <Section title="Tokens" description="Marque, états contextuels EFSS et accent IA.">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {SWATCHES.map((s) => (
              <div key={s.name} className={cn("flex h-20 flex-col justify-end rounded-lg p-3", s.className, s.fg)}>
                <span className="text-xs font-medium">{s.name}</span>
              </div>
            ))}
          </div>
        </Section>

        <Separator />

        {/* Explorateur — FileRow */}
        <Section
          title="Explorateur de fichiers — FileRow"
          description="Survolez une ligne : la case de sélection et le menu d'actions apparaissent. Sync animée, badge chiffré."
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{checked.size} élément(s) sélectionné(s)</span>
            <Button variant="outline" size="sm" disabled={checked.size === 0} onClick={() => setChecked(new Set())}>
              <Trash2 /> Tout désélectionner
            </Button>
          </div>
          <div role="grid" aria-label="Fichiers de démonstration" className="rounded-xl border border-border bg-card p-2">
            {SAMPLE_FILES.map((item) => (
              <FileRow
                key={item.id}
                item={item}
                selectable
                selected={checked.has(item.id)}
                onSelectedChange={(c, it) => toggleChecked(it.id, c)}
                onOpen={(it) => setSelectedId(it.id)}
                onAction={handleAction}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Dernière ouverture : <span className="font-medium text-foreground">{SAMPLE_FILES.find((f) => f.id === selectedId)?.name ?? "—"}</span>{" "}
            · Dernière action : <span className="font-medium text-foreground">{lastAction}</span>
          </p>
        </Section>

        <Separator />

        {/* Kit — Button / Dialog / AlertDialog / Tooltip / ContextMenu */}
        <Section title="Kit — Boutons, modales, menus" description="Variantes de boutons (dont IA), Dialog, AlertDialog de confirmation, Tooltip, menu contextuel (clic droit).">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Principal</Button>
            <Button variant="secondary">Secondaire</Button>
            <Button variant="outline">Contour</Button>
            <Button variant="ghost">Fantôme</Button>
            <Button variant="ai"><Sparkles /> Analyser</Button>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Informations"><Info /></Button>
              </TooltipTrigger>
              <TooltipContent>Infobulle accessible (Radix)</TooltipContent>
            </Tooltip>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ai"><Sparkles /> Workflow IA</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Lancer un workflow IA</DialogTitle>
                  <DialogDescription>Modale Radix avec focus-trap et fermeture clavier (Échap).</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild><Button variant="outline">Annuler</Button></DialogClose>
                  <DialogClose asChild><Button variant="ai"><Sparkles /> Lancer</Button></DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive"><Trash2 /> Supprimer…</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer ce fichier ?</AlertDialogTitle>
                  <AlertDialogDescription>Cette action est irréversible. Le fichier sera déplacé dans la corbeille.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Supprimer</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <ContextMenu>
            <ContextMenuTrigger asChild>
              <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-sm text-muted-foreground">
                Clic droit ici pour le menu contextuel
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuLabel>Actions</ContextMenuLabel>
              <ContextMenuItem><Download /> Télécharger</ContextMenuItem>
              <ContextMenuItem><Sparkles className="text-ai-purple" /> Analyser avec l’IA</ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem variant="destructive"><Trash2 /> Supprimer</ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </Section>

        <Separator />

        {/* Formulaires — Input / Select / Switch / Label */}
        <Section title="Formulaires — Input, Select, Switch" description="Champs accessibles (Label lié), tri par Select (Radix), interrupteur.">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="fname">Nom du fichier</Label>
              <Input id="fname" placeholder="rapport_q2.pdf" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sort">Trier par</Label>
              <Select defaultValue="recent">
                <SelectTrigger id="sort" className="w-full"><SelectValue placeholder="Choisir…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Plus récents</SelectItem>
                  <SelectItem value="name">Nom (A→Z)</SelectItem>
                  <SelectItem value="size">Taille</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch id="enc" checked={encryptOn} onCheckedChange={setEncryptOn} />
            <Label htmlFor="enc">Chiffrement de bout en bout {encryptOn ? "activé" : "désactivé"}</Label>
          </div>
        </Section>

        <Separator />

        {/* Grille — file-grid */}
        <Section title="Grille de dossiers — @utility file-grid" description="Grille auto-ajustée (auto-fill, minmax 11rem).">
          <div className="file-grid">
            {SAMPLE_FILES.filter((f) => f.type === "folder")
              .concat(SAMPLE_FILES.filter((f) => f.type === "folder"))
              .map((item, i) => (
                <div key={`${item.id}-${i}`} className={cn("flex flex-col gap-3 rounded-xl border border-border bg-card p-4", "transition-colors hover:border-primary/40 hover:bg-accent/40")}>
                  <Folder className="size-7 text-primary" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Dossier</p>
                  </div>
                </div>
              ))}
          </div>
        </Section>

        <Separator />

        {/* IA — AiPromptInput */}
        <Section title="Action IA — AiPromptInput" description="Actions rapides, halo ai-purple en focus, bascule envoi/stop pendant le streaming.">
          <AiPromptInput contextLabel="Statuts_juridiques_signés.pdf" isStreaming={isStreaming} onSubmit={handleSubmit} onStop={handleStop} />
          {log.length > 0 && (
            <ul className="space-y-1.5">
              {log.map((p, i) => (
                <li key={i} className="flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm text-foreground">
                  <span className="text-ai-purple">›</span>
                  <span className="min-w-0 flex-1">{p}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <footer className="border-t border-border pt-6 text-xs text-muted-foreground">
          Page de prévisualisation — composants montés hors de tout contexte Cunningham.
        </footer>
      </div>
    </DsProvider>
  );
}
