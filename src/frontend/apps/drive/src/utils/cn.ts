import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Fusionne des classes conditionnelles + dédoublonne les conflits Tailwind.
 * (Équivalent du `cn` de shadcn ; placé sous `src/utils` car `lib/` est
 * gitignored dans ce repo.)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
