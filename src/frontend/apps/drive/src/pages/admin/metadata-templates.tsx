// Console d'administration des templates de métadonnées (E2.1).
// Réservée aux administrateurs (is_staff) ; le backend refuse les écritures
// des non-staff (403). Pages Router : pas de "use client".
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { getSimpleLayout } from "@/features/layouts/components/simple/SimpleLayout";
import { useAuth } from "@/features/auth/Auth";
import { useMetadataTemplates } from "@/features/explorer/hooks/useQueries";
import { useMutationDeleteTemplate } from "@/features/admin/hooks/useMutationsMetadataTemplates";
import { MetadataTemplateFormModal } from "@/features/admin/components/MetadataTemplateFormModal";
import { AdminNav } from "@/features/admin/components/AdminNav";
import { MetadataTemplate } from "@/features/drivers/types";
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

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (template: MetadataTemplate) => {
    setEditing(template);
    setFormOpen(true);
  };
  const onDelete = (template: MetadataTemplate) => {
    if (
      window.confirm(
        t("admin.metadata_templates.confirm_delete", { key: template.key }),
      )
    ) {
      deleteTemplate.mutate(template.key);
    }
  };

  if (user && !user.is_staff) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <p className="text-muted-foreground">
          {t("admin.metadata_templates.forbidden")}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <AdminNav />
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-foreground">
          {t("admin.metadata_templates.title")}
        </h1>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          {t("admin.metadata_templates.create")}
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">
          {t("admin.metadata_templates.loading")}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("admin.metadata_templates.col_key")}</TableHead>
              <TableHead>{t("admin.metadata_templates.col_name")}</TableHead>
              <TableHead>{t("admin.metadata_templates.col_fields")}</TableHead>
              <TableHead className="text-right">
                {t("admin.metadata_templates.col_actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(templates ?? []).map((template) => (
              <TableRow key={template.key}>
                <TableCell className="font-medium">{template.key}</TableCell>
                <TableCell>{template.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {(template.fields ?? [])
                    .map((field) => field.key)
                    .join(", ") || "—"}
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
                    className="size-8"
                    aria-label={t("admin.metadata_templates.delete")}
                    onClick={() => onDelete(template)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <MetadataTemplateFormModal
        open={formOpen}
        editing={editing}
        onClose={() => setFormOpen(false)}
      />
    </div>
  );
}

AdminMetadataTemplatesPage.getLayout = getSimpleLayout;
