// Primitive DS — Spinner (indicateur de chargement accessible).
import * as React from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/utils/cn";

export interface SpinnerProps extends React.ComponentProps<"svg"> {
  /** Libellé annoncé aux lecteurs d'écran. */
  label?: string;
}

function Spinner({ className, label = "Chargement…", ...props }: SpinnerProps) {
  return (
    <LoaderCircle
      data-slot="spinner"
      role="status"
      aria-label={label}
      className={cn("size-4 animate-spin text-muted-foreground", className)}
      {...props}
    />
  );
}

export { Spinner };
