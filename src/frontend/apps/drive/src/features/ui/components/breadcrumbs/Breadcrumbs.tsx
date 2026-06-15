import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import React, { ReactElement, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  Breadcrumb,
  BreadcrumbItem as DsBreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export type BreadcrumbItem = {
  content: ReactNode;
};

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  onBack?: () => void;
  displayBack?: boolean;
}

export const Breadcrumbs = ({
  items,
  onBack,
  displayBack = false,
}: BreadcrumbsProps) => {
  const { t } = useTranslation();

  // Fil d'Ariane DS : structure shadcn (nav/ol/li) + séparateur chevron lucide.
  // Les boutons (`.c__breadcrumbs__button`) sont conservés comme contenu et
  // repeints en liens DS (cf. ds-explorer-grid.css). La branche `displayBack`
  // ci-dessous (bouton retour) reste le seul cas non-DS.
  if (!displayBack) {
    return (
      <Breadcrumb data-testid="explorer-breadcrumbs">
        <BreadcrumbList>
          {items.map((item, index) => (
            <React.Fragment key={index}>
              {index > 0 && <BreadcrumbSeparator />}
              <DsBreadcrumbItem>
                {React.cloneElement(
                  item.content as ReactElement<HTMLDivElement>,
                  {
                    className: `${
                      (
                        (item.content as ReactElement<HTMLDivElement>)
                          .props as { className?: string }
                      ).className || ""
                    } ${index === items.length - 1 ? "active" : ""}`,
                  },
                )}
              </DsBreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  return (
    <div className="c__breadcrumbs" data-testid="explorer-breadcrumbs">
      {displayBack && (
        <Button
          variant="ghost"
          className="mr-t"
          onClick={onBack}
          disabled={items.length <= 1}
        >
          <ArrowLeft className="size-4" />
          {t("Précédent")}
        </Button>
      )}

      {items.map((item, index) => {
        return (
          <React.Fragment key={index}>
            {index > 0 && (
              <span className="material-icons c__breadcrumbs__separator">
                chevron_right
              </span>
            )}
            {React.cloneElement(item.content as ReactElement<HTMLDivElement>, {
              className: `${
                (
                  (item.content as ReactElement<HTMLDivElement>).props as {
                    className?: string;
                  }
                ).className || ""
              } ${index === items.length - 1 ? "active" : ""}`,
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
};
