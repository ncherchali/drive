// Page de supervision (H1.9) : métriques clés pour le staff.
// L'endpoint metrics/summary/ est staff-only (403 sinon → message d'erreur).
import { useTranslation } from "react-i18next";
import { useMetricsSummary } from "@/features/explorer/hooks/useQueries";
import { getSimpleLayout } from "@/features/layouts/components/simple/SimpleLayout";

const StatCard = ({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) => (
  <div className="flex flex-col gap-1 rounded-md border border-solid border-border bg-card p-4">
    <span className="text-2xl font-semibold text-foreground">{value}</span>
    <span className="text-sm text-muted-foreground">{label}</span>
  </div>
);

export default function SupervisionPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useMetricsSummary();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <h1 className="text-xl font-semibold text-foreground">
        {t("supervision.title")}
      </h1>

      {isLoading && (
        <p className="text-sm text-muted-foreground">
          {t("supervision.loading")}
        </p>
      )}
      {isError && (
        <p className="text-sm text-destructive">{t("supervision.error")}</p>
      )}

      {data && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard label={t("supervision.items")} value={data.items_total} />
          <StatCard label={t("supervision.users")} value={data.users_total} />
          <StatCard
            label={t("supervision.audit_events")}
            value={data.audit_events_total}
          />
          <StatCard
            label={t("supervision.legal_holds")}
            value={data.legal_holds_active_total}
          />
          <StatCard
            label={t("supervision.data_rooms")}
            value={data.data_rooms_total}
          />
          {data.celery_queue_length !== undefined && (
            <StatCard
              label={t("supervision.celery_queue")}
              value={data.celery_queue_length}
            />
          )}
        </div>
      )}
    </div>
  );
}

SupervisionPage.getLayout = getSimpleLayout;
