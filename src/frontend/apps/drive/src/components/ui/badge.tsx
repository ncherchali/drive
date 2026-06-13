// Primitive shadcn — Badge (cva + Slot). Pages Router : pas de "use client".
// Variantes alignées sur les tokens DS, dont les états métier EFSS (sync,
// chiffré) et l'accent IA (cf. src/styles/ds.css).
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

const badgeVariants = cva(
  cn(
    "inline-flex w-fit shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium",
    "[&_svg]:size-3 [&_svg]:shrink-0",
  ),
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground",
        outline: "border-border text-foreground",
        // États contextuels EFSS et IA.
        syncing: "border-transparent bg-syncing text-syncing-foreground",
        encrypted: "border-transparent bg-encrypted text-encrypted-foreground",
        ai: "border-transparent bg-ai-purple text-ai-purple-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.ComponentProps<"span">,
    VariantProps<typeof badgeVariants> {
  asChild?: boolean;
}

function Badge({ className, variant, asChild = false, ...props }: BadgeProps) {
  const Comp = asChild ? Slot : "span";
  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, className }))}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
