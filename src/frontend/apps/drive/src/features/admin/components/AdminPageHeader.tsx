// En-tête de page de la console admin : titre (h1) + description + action.
// Hiérarchie visuelle claire (rules visual-hierarchy / heading-hierarchy).
import * as React from "react";

export type AdminPageHeaderProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

export const AdminPageHeader = ({
  title,
  description,
  action,
}: AdminPageHeaderProps) => {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="max-w-prose text-sm text-muted-foreground">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
};
