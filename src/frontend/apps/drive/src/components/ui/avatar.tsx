// Primitive DS — Avatar (image avec repli initiales). Léger, sans dépendance.
import * as React from "react";
import { cn } from "@/utils/cn";

function getInitials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export interface AvatarProps extends React.ComponentProps<"span"> {
  src?: string | null;
  name?: string;
}

function Avatar({ src, name, className, ...props }: AvatarProps) {
  const [errored, setErrored] = React.useState(false);
  const showImage = src && !errored;
  return (
    <span
      data-slot="avatar"
      className={cn(
        "relative flex size-8 shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-medium text-muted-foreground",
        className,
      )}
      {...props}
    >
      {showImage ? (
        <img
          src={src}
          alt=""
          className="size-full object-cover"
          onError={() => setErrored(true)}
        />
      ) : (
        getInitials(name)
      )}
    </span>
  );
}

export { Avatar };
