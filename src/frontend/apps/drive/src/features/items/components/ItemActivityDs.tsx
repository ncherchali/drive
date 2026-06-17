// Onglet « Activité » du panneau de droite (A2-6).
// Pages Router : pas de "use client".
//
// Affiche le journal d'audit d'un item (GET /items/{id}/audit/) en liste DS
// verticale (adaptée au panneau étroit). Réservé aux managers (owner/admin) :
// l'onglet n'est monté que si `item.abilities.accesses_manage` est vrai, et le
// backend renvoie 403 sinon.
import { useTranslation } from "react-i18next";
import { Avatar } from "@/components/ui/avatar";
import { AuditEvent } from "@/features/drivers/types";
import { useItemAudit } from "@/features/explorer/hooks/useQueries";

export type ItemActivityDsProps = {
  itemId: string;
};

const formatDate = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });

export const ItemActivityDs = ({ itemId }: ItemActivityDsProps) => {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useItemAudit(itemId);

  const actorName = (event: AuditEvent) =>
    event.actor?.full_name ||
    event.actor?.short_name ||
    t(`explorer.rightPanel.activity.actor_type.${event.actor_type}`, {
      defaultValue: event.actor_type,
    });

  const actionLabel = (action: string) =>
    t(`explorer.rightPanel.activity.actions.${action}`, {
      defaultValue: action,
    });

  if (isLoading) {
    return (
      <p className="py-4 text-sm text-muted-foreground">
        {t("explorer.rightPanel.activity.loading")}
      </p>
    );
  }

  if (isError) {
    return (
      <p className="py-4 text-sm text-muted-foreground">
        {t("explorer.rightPanel.activity.error")}
      </p>
    );
  }

  const events = data?.results ?? [];

  if (events.length === 0) {
    return (
      <p className="py-4 text-sm text-muted-foreground">
        {t("explorer.rightPanel.activity.empty")}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3 py-2">
      {events.map((event) => (
        <li key={event.id} className="flex items-start gap-2 text-sm">
          <Avatar
            name={actorName(event)}
            className="mt-0.5 size-6 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-foreground">
              <span className="font-medium">{actorName(event)}</span>{" "}
              <span className="text-muted-foreground">
                {actionLabel(event.action)}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(event.created_at)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
};
