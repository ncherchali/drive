// Console d'administration des politiques de rétention (E3.1).
// Réservée aux administrateurs (is_staff) ; le backend refuse les écritures
// des non-staff (403). Pages Router : pas de "use client".
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pencil, Plus, Timer, Trash2 } from "lucide-react";
import { getAdminLayout } from "@/features/admin/components/AdminLayout";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { ConfirmDeleteDialog } from "@/features/admin/components/ConfirmDeleteDialog";
import { useAuth } from "@/features/auth/Auth";
import { useRetentionPolicies } from "@/features/explorer/hooks/useQueries";
import { useMutationDeletePolicy } from "@/features/admin/hooks/useMutationsRetentionPolicies";
import { RetentionPolicyFormModal } from "@/features/admin/components/RetentionPolicyFormModal";
import { RetentionPolicy } from "@/features/drivers/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminRetentionPoliciesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: policies, isLoading } = useRetentionPolicies();
  const deletePolicy = useMutationDeletePolicy();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RetentionPolicy | null>(null);
  const [toDelete, setToDelete] = useState<RetentionPolicy | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (policy: RetentionPolicy) => {
    setEditing(policy);
    setFormOpen(true);
  };

  if (user && !user.is_staff) {
    return (
      <div className="mx-auto max-w-5xl p-8">
        <p className="text-muted-foreground">
          {t("admin.retention_policies.forbidden")}
        </p>
      </div>
    );
  }

  const rows = policies ?? [];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6 md:p-8">
      <AdminPageHeader
        title={t("admin.retention_policies.title")}
        description={t("admin.retention_policies.subtitle")}
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            {t("admin.retention_policies.create")}
          </Button>
        }
      />

      <div className="overflow-hidden rounded-lg border border-solid border-border bg-card">
        {isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">
            {t("admin.retention_policies.loading")}
          </p>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Timer className="size-6" />
            </div>
            <p className="text-sm text-muted-foreground">
              {t("admin.retention_policies.empty")}
            </p>
            <Button variant="secondary" onClick={openCreate}>
              <Plus className="size-4" />
              {t("admin.retention_policies.create")}
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.retention_policies.col_key")}</TableHead>
                <TableHead>{t("admin.retention_policies.col_name")}</TableHead>
                <TableHead>
                  {t("admin.retention_policies.col_duration")}
                </TableHead>
                <TableHead>{t("admin.retention_policies.col_basis")}</TableHead>
                <TableHead>
                  {t("admin.retention_policies.col_active")}
                </TableHead>
                <TableHead className="text-right">
                  {t("admin.retention_policies.col_actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((policy) => (
                <TableRow key={policy.key}>
                  <TableCell className="font-mono text-xs font-medium">
                    {policy.key}
                  </TableCell>
                  <TableCell className="font-medium">{policy.name}</TableCell>
                  <TableCell>
                    {t("admin.retention_policies.days", {
                      count: policy.duration_days,
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {t(`admin.retention_policies.basis_${policy.basis}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={policy.is_active ? "default" : "secondary"}>
                      {policy.is_active
                        ? t("admin.retention_policies.yes")
                        : t("admin.retention_policies.no")}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label={t("admin.retention_policies.edit")}
                      onClick={() => openEdit(policy)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      aria-label={t("admin.retention_policies.delete")}
                      onClick={() => setToDelete(policy)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <RetentionPolicyFormModal
        open={formOpen}
        editing={editing}
        onClose={() => setFormOpen(false)}
      />
      <ConfirmDeleteDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={t("admin.retention_policies.delete")}
        description={t("admin.retention_policies.confirm_delete", {
          key: toDelete?.key ?? "",
        })}
        confirmLabel={t("admin.retention_policies.delete")}
        cancelLabel={t("admin.retention_policies.form.cancel")}
        onConfirm={() => {
          if (toDelete) {
            deletePolicy.mutate(toDelete.key);
          }
          setToDelete(null);
        }}
      />
    </div>
  );
}

AdminRetentionPoliciesPage.getLayout = getAdminLayout;
