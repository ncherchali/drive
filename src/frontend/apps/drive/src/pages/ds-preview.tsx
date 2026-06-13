// Page de démonstration du Design System Sahla (shadcn/Radix + Tailwind v4).
// Route : /ds-preview. Page de DEV/preview — à retirer avant prod.
//
// Tout est rendu dans un wrapper `class="sahla-ds"` (reset preflight scopé) ;
// le mode sombre est piloté LOCALEMENT par la classe `.dark` sur ce même
// wrapper (les variants `dark:` ciblent un ancêtre `.dark`, et les tokens
// sémantiques basculent via redéfinition des variables CSS). Auto-suffisant :
// n'interfère pas avec le pont `.dark` global de _app.tsx.
import * as React from "react";
import { Moon, Sun, Folder } from "lucide-react";
import { cn } from "@/utils/cn";
import { FileRow, type FileItem, type FileRowAction } from "@/components/files/file-row";
import { AiPromptInput } from "@/components/ai/ai-prompt-input";

const SAMPLE_FILES: FileItem[] = [
  {
    id: "1",
    name: "Contrats clients 2026",
    type: "folder",
    updatedAt: "2026-05-28",
    syncState: "synced",
  },
  {
    id: "2",
    name: "Rapport_financier_Q2.xlsx",
    type: "file",
    size: 248_000,
    updatedAt: "2026-06-11",
    syncState: "syncing",
  },
  {
    id: "3",
    name: "Statuts_juridiques_signés.pdf",
    type: "file",
    size: 1_280_000,
    updatedAt: "2026-06-02",
    syncState: "synced",
    encrypted: true,
  },
  {
    id: "4",
    name: "Présentation_board.pptx",
    type: "file",
    size: 7_540_000,
    updatedAt: "2026-06-13",
    syncState: "error",
  },
  {
    id: "5",
    name: "Archives RH",
    type: "folder",
    updatedAt: "2026-04-19",
    syncState: "idle",
    encrypted: true,
  },
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
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

export default function DsPreviewPage() {
  const [isDark, setIsDark] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>("3");
  const [lastAction, setLastAction] = React.useState<string>("—");

  const [isStreaming, setIsStreaming] = React.useState(false);
  const [log, setLog] = React.useState<string[]>([]);
  const timeoutRef = React.useRef<number | null>(null);

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
    <div
      className={cn(
        "sahla-ds min-h-screen bg-background text-foreground",
        isDark && "dark",
      )}
    >
      <div className="mx-auto max-w-5xl space-y-12 p-6 sm:p-10">
        {/* En-tête */}
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Sahla Design System
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Aperçu shadcn/Radix + Tailwind v4 · scopé sous{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                .sahla-ds
              </code>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsDark((v) => !v)}
            aria-pressed={isDark}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2",
              "text-sm font-medium transition-colors hover:bg-accent",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            {isDark ? "Clair" : "Sombre"}
          </button>
        </header>

        {/* Tokens */}
        <Section
          title="Tokens"
          description="Marque, états contextuels EFSS et accent IA."
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {SWATCHES.map((s) => (
              <div
                key={s.name}
                className={cn(
                  "flex h-20 flex-col justify-end rounded-lg p-3",
                  s.className,
                  s.fg,
                )}
              >
                <span className="text-xs font-medium">{s.name}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Explorateur — FileRow */}
        <Section
          title="Explorateur de fichiers — FileRow"
          description="Survolez une ligne pour révéler le menu d'actions. Sync animée, badge chiffré, sélection."
        >
          <div
            role="grid"
            aria-label="Fichiers de démonstration"
            className="rounded-xl border border-border bg-card p-2"
          >
            {SAMPLE_FILES.map((item) => (
              <FileRow
                key={item.id}
                item={item}
                selected={selectedId === item.id}
                onOpen={(it) => setSelectedId(it.id)}
                onAction={handleAction}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Dernière action :{" "}
            <span className="font-medium text-foreground">{lastAction}</span>
          </p>
        </Section>

        {/* Grille — utilitaire file-grid */}
        <Section
          title="Grille de dossiers — @utility file-grid"
          description="Grille auto-ajustée (auto-fill, minmax 11rem)."
        >
          <div className="file-grid">
            {SAMPLE_FILES.filter((f) => f.type === "folder")
              .concat(SAMPLE_FILES.filter((f) => f.type === "folder"))
              .map((item, i) => (
                <div
                  key={`${item.id}-${i}`}
                  className={cn(
                    "flex flex-col gap-3 rounded-xl border border-border bg-card p-4",
                    "transition-colors hover:border-primary/40 hover:bg-accent/40",
                  )}
                >
                  <Folder className="size-7 text-primary" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Dossier</p>
                  </div>
                </div>
              ))}
          </div>
        </Section>

        {/* IA — AiPromptInput */}
        <Section
          title="Action IA — AiPromptInput"
          description="Actions rapides, halo ai-purple en focus, bascule envoi/stop pendant le streaming."
        >
          <AiPromptInput
            contextLabel="Statuts_juridiques_signés.pdf"
            isStreaming={isStreaming}
            onSubmit={handleSubmit}
            onStop={handleStop}
          />
          {log.length > 0 && (
            <ul className="space-y-1.5">
              {log.map((p, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm text-foreground"
                >
                  <span className="text-ai-purple">›</span>
                  <span className="min-w-0 flex-1">{p}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <footer className="border-t border-border pt-6 text-xs text-muted-foreground">
          Page de prévisualisation — composants montés hors de tout contexte
          Cunningham.
        </footer>
      </div>
    </div>
  );
}
