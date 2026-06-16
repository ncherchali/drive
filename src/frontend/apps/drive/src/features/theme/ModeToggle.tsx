// Bascule de thème du DS (clair / sombre / système). Pages Router : pas de
// "use client".
import * as React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useTheme, type ThemeMode } from "@/features/theme/ThemeProvider";

const OPTIONS: { mode: ThemeMode; label: string; icon: React.ReactNode }[] = [
  { mode: "light", label: "Clair", icon: <Sun /> },
  { mode: "dark", label: "Sombre", icon: <Moon /> },
  { mode: "system", label: "Système", icon: <Monitor /> },
];

export function ModeToggle({
  variant = "outline",
  size = "icon",
  modal,
}: {
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  modal?: boolean;
} = {}) {
  const { mode, setMode } = useTheme();
  return (
    <DropdownMenu modal={modal}>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} aria-label="Changer le thème">
          <Sun className="dark:hidden" aria-hidden />
          <Moon className="hidden dark:block" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.mode}
            onSelect={() => setMode(opt.mode)}
            className={cnActive(mode === opt.mode)}
          >
            {opt.icon} {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function cnActive(active: boolean) {
  return active ? "bg-accent text-accent-foreground" : undefined;
}
