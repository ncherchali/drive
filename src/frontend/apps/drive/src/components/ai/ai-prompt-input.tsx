// Composant DS — barre d'action IA dédiée à un document.
// Pages Router : pas de "use client" (en App Router, l'ajouter en tête).
import * as React from "react";
import {
  Sparkles,
  ArrowUp,
  Square,
  ScanText,
  Languages,
  FileText,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/utils/cn";

export interface QuickAction {
  id: string;
  label: string;
  prompt: string;
  icon?: LucideIcon;
}

export interface AiPromptInputProps {
  /** Document/objet ciblé par les actions IA. */
  contextLabel?: string;
  quickActions?: QuickAction[];
  isStreaming?: boolean;
  disabled?: boolean;
  placeholder?: string;
  onSubmit: (prompt: string) => void;
  onStop?: () => void;
  className?: string;
}

const DEFAULT_ACTIONS: QuickAction[] = [
  {
    id: "summarize",
    label: "Résumer",
    prompt: "Résume ce document de façon concise.",
    icon: FileText,
  },
  {
    id: "metadata",
    label: "Extraire les métadonnées",
    prompt: "Extrais les métadonnées clés de ce document.",
    icon: ScanText,
  },
  {
    id: "translate",
    label: "Traduire",
    prompt: "Traduis ce document en français.",
    icon: Languages,
  },
];

export function AiPromptInput({
  contextLabel,
  quickActions = DEFAULT_ACTIONS,
  isStreaming = false,
  disabled = false,
  placeholder = "Demandez à l’IA d’agir sur ce document…",
  onSubmit,
  onStop,
  className,
}: AiPromptInputProps) {
  const [value, setValue] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const autoGrow = React.useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, []);

  const submit = (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed || disabled || isStreaming) return;
    onSubmit(trimmed);
    setValue("");
    requestAnimationFrame(autoGrow);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Entrée = envoyer ; Maj+Entrée = nouvelle ligne.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit(value);
    }
  };

  const canSubmit = value.trim().length > 0 && !disabled;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(value);
      }}
      aria-busy={isStreaming}
      className={cn(
        "group/ai relative rounded-xl border border-border bg-card p-2",
        // dégradé subtil + halo IA en focus, sobre au repos
        "bg-gradient-to-b from-ai-purple-soft/40 to-transparent dark:from-ai-purple/10",
        "transition-shadow duration-200 focus-within:ai-ring",
        disabled && "pointer-events-none opacity-60",
        className,
      )}
    >
      {/* En-tête contextuel */}
      <div className="flex items-center gap-2 px-2 pb-1.5 pt-1">
        <Sparkles
          className={cn("size-4 text-ai-purple", isStreaming && "animate-ai-pulse")}
          aria-hidden
        />
        <span className="text-xs font-medium text-muted-foreground">
          Assistant IA
          {contextLabel && (
            <>
              {" · "}
              <span className="text-foreground">{contextLabel}</span>
            </>
          )}
        </span>
      </div>

      {/* Actions rapides (workflows pré-définis) */}
      {quickActions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-2 pb-2">
          {quickActions.map((action) => {
            const ActionIcon = action.icon;
            return (
              <button
                key={action.id}
                type="button"
                disabled={disabled || isStreaming}
                onClick={() => submit(action.prompt)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border border-border/70 px-2.5 py-1",
                  "text-xs font-medium text-muted-foreground",
                  // Accent IA porté par la bordure + le fond (AA-safe) ; le
                  // libellé reste lisible (foreground), ai-purple n'est pas
                  // utilisé comme couleur de texte sur surface.
                  "transition-colors hover:border-ai-purple/50 hover:bg-ai-purple/10 hover:text-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ai-purple/50",
                  "disabled:pointer-events-none disabled:opacity-50",
                )}
              >
                {ActionIcon && <ActionIcon className="size-3.5" aria-hidden />}
                {action.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Zone de saisie + envoi */}
      <div className="flex items-end gap-2 rounded-lg bg-background/60 p-1.5">
        <label htmlFor="ai-prompt" className="sr-only">
          Votre instruction pour l’IA
        </label>
        <textarea
          id="ai-prompt"
          ref={textareaRef}
          rows={1}
          value={value}
          disabled={disabled || isStreaming}
          placeholder={placeholder}
          aria-describedby="ai-prompt-hint"
          onChange={(e) => {
            setValue(e.target.value);
            autoGrow();
          }}
          onKeyDown={handleKeyDown}
          className={cn(
            "max-h-[200px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-foreground",
            "placeholder:text-muted-foreground focus:outline-none",
            "disabled:cursor-not-allowed",
          )}
        />

        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            aria-label="Arrêter la génération"
            className={cn(
              "inline-flex size-9 shrink-0 items-center justify-center rounded-lg",
              "bg-ai-purple/15 text-ai-purple transition-colors hover:bg-ai-purple/25",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ai-purple/50",
            )}
          >
            <Square className="size-4 fill-current" aria-hidden />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!canSubmit}
            aria-label="Envoyer l’instruction"
            className={cn(
              "inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-ai-purple-foreground",
              "bg-ai-purple shadow-sm transition-all hover:brightness-110",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ai-purple/60",
              "disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none",
            )}
          >
            <ArrowUp className="size-4" aria-hidden />
          </button>
        )}
      </div>

      {/* Aide + statut streaming (annoncé aux lecteurs d'écran) */}
      <div className="flex items-center justify-between px-2 pb-0.5 pt-1.5">
        <p id="ai-prompt-hint" className="text-[11px] text-muted-foreground">
          Entrée pour envoyer · Maj+Entrée pour un saut de ligne
        </p>
        <span
          role="status"
          aria-live="polite"
          className="text-[11px] text-ai-purple"
        >
          {isStreaming ? "Génération en cours…" : ""}
        </span>
      </div>
    </form>
  );
}
