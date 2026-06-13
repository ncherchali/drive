// Primitive de layout DS — barre d'en-tête de l'application.
import * as React from "react";
import { cn } from "@/utils/cn";

function AppHeader({ className, ...props }: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="app-header"
      className={cn(
        "box-border flex h-14 shrink-0 items-center gap-3 border-b border-solid border-border bg-background px-4",
        className,
      )}
      {...props}
    />
  );
}

function AppHeaderTitle({ className, ...props }: React.ComponentProps<"h1">) {
  return (
    <h1
      data-slot="app-header-title"
      className={cn("truncate text-sm font-semibold text-foreground", className)}
      {...props}
    />
  );
}

export { AppHeader, AppHeaderTitle };
