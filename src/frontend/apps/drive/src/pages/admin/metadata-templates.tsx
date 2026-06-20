// Console d'administration des templates de métadonnées (E2.1).
// Réservée aux administrateurs (is_staff) ; le backend refuse les écritures
// des non-staff (403). Pages Router : pas de "use client".
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FileSliders, Pencil, Plus, Trash2 } from "lucide-react";
import { getAdminLayout } from "@/features/admin/components/AdminLayout";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { ConfirmDeleteDialog } from "@/features/admin/components/ConfirmDeleteDialog";
import { useAuth } from "@/features/auth/Auth";
import { useMetadataTemplates } from "@/features/explorer/hooks/useQueries";
import { useMutationDeleteTemplate } from "@/features/admin/hooks/useMutationsMetadataTemplates";
import { MetadataTemplateFormModal } from "@/features/admin/components/MetadataTemplateFormModal";
import { MetadataTemplate } from "@/features/drivers/types";
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

export default function AdminMetadataTemplatesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: templates, isLoading } = useMetadataTemplates();
  const deleteTemplate = useMutationDeleteTemplate();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MetadataTemplate | null>(null);
  const [toDelete, setToDelete] = useState<MetadataTemplate | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (template: MetadataTemplate) => {
    setEditing(template);
    setFormOpen(true);
  };

  if (user && !user.is_staff) {
    return (
      <div className="mx-auto max-w-5xl p-8">
        <p className="text-muted-foreground">
          {t("admin.metadata_templates.forbidden")}
        </p>
      </div>
    );
  }

  const rows = templates ?? [];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6 md:p-8">
      <AdminPageHeader
        title={t("admin.metadata_templates.title")}
        description={t("admin.metadata_templates.subtitle")}
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            {t("admin.metadata_templates.create")}
          </Button>
        }
      />

      <div className="overflow-hidden rounded-lg border border-solid border-border bg-card">
        {isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">
            {t("admin.metadata_templates.loading")}
          </p>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <FileSliders className="size-6" />
            </div>
            <p className="text-sm text-muted-foreground">
              {t("admin.metadata_templates.empty")}
            </p>
            <Button variant="secondary" onClick={openCreate}>
              <Plus className="size-4" />
              {t("admin.metadata_templates.create")}
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.metadata_templates.col_key")}</TableHead>
                <TableHead>{t("admin.metadata_templates.col_name")}</TableHead>
                <TableHead>
                  {t("admin.metadata_templates.col_fields")}
                </TableHead>
                <TableHead className="text-right">
                  {t("admin.metadata_templates.col_actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((template) => (
                <TableRow key={template.key}>
                  <TableCell className="font-mono text-xs font-medium">
                    {template.key}
                  </TableCell>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(template.fields ?? []).length === 0 ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        (template.fields ?? []).map((field) => (
                          <Badge key={field.key} variant="outline">
                            {field.key}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label={t("admin.metadata_templates.edit")}
                      onClick={() => openEdit(template)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      aria-label={t("admin.metadata_templates.delete")}
                      onClick={() => setToDelete(template)}
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

      <MetadataTemplateFormModal
        open={formOpen}
        editing={editing}
        onClose={() => setFormOpen(false)}
      />
      <ConfirmDeleteDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={t("admin.metadata_templates.delete")}
        description={t("admin.metadata_templates.confirm_delete", {
          key: toDelete?.key ?? "",
        })}
        confirmLabel={t("admin.metadata_templates.delete")}
        cancelLabel={t("admin.metadata_templates.form.cancel")}
        onConfirm={() => {
          if (toDelete) {
            deleteTemplate.mutate(toDelete.key);
          }
          setToDelete(null);
        }}
      />
    </div>
  );
}

AdminMetadataTemplatesPage.getLayout = getAdminLayout;
