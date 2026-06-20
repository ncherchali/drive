// Console d'administration du registre des types de contenu (ADR-0001).
// Réservée aux administrateurs (is_staff) ; le backend refuse les écritures
// des non-staff de toute façon (403). Pages Router : pas de "use client".
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Boxes, Pencil, Plus, Trash2 } from "lucide-react";
import { getAdminLayout } from "@/features/admin/components/AdminLayout";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { ConfirmDeleteDialog } from "@/features/admin/components/ConfirmDeleteDialog";
import { useAuth } from "@/features/auth/Auth";
import { useContentObjectTypes } from "@/features/explorer/hooks/useQueries";
import { useMutationDeleteContentType } from "@/features/admin/hooks/useMutationsContentTypes";
import { ContentTypeFormModal } from "@/features/admin/components/ContentTypeFormModal";
import { ContentObjectType } from "@/features/drivers/types";
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

export default function AdminContentTypesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: types, isLoading } = useContentObjectTypes();
  const deleteType = useMutationDeleteContentType();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ContentObjectType | null>(null);
  const [toDelete, setToDelete] = useState<ContentObjectType | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (type: ContentObjectType) => {
    setEditing(type);
    setFormOpen(true);
  };

  if (user && !user.is_staff) {
    return (
      <div className="mx-auto max-w-5xl p-8">
        <p className="text-muted-foreground">
          {t("admin.content_types.forbidden")}
        </p>
      </div>
    );
  }

  const rows = types ?? [];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6 md:p-8">
      <AdminPageHeader
        title={t("admin.content_types.title")}
        description={t("admin.content_types.subtitle")}
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            {t("admin.content_types.create")}
          </Button>
        }
      />

      <div className="overflow-hidden rounded-lg border border-solid border-border bg-card">
        {isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">
            {t("admin.content_types.loading")}
          </p>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Boxes className="size-6" />
            </div>
            <p className="text-sm text-muted-foreground">
              {t("admin.content_types.empty")}
            </p>
            <Button variant="secondary" onClick={openCreate}>
              <Plus className="size-4" />
              {t("admin.content_types.create")}
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.content_types.col_key")}</TableHead>
                <TableHead>{t("admin.content_types.col_label")}</TableHead>
                <TableHead>{t("admin.content_types.col_base")}</TableHead>
                <TableHead>{t("admin.content_types.col_template")}</TableHead>
                <TableHead>{t("admin.content_types.col_active")}</TableHead>
                <TableHead className="text-right">
                  {t("admin.content_types.col_actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((type) => (
                <TableRow key={type.key}>
                  <TableCell className="font-mono text-xs font-medium">
                    {type.key}
                  </TableCell>
                  <TableCell className="font-medium">{type.label}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{type.base}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {type.template_key ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={type.is_active ? "default" : "secondary"}>
                      {type.is_active
                        ? t("admin.content_types.yes")
                        : t("admin.content_types.no")}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label={t("admin.content_types.edit")}
                      onClick={() => openEdit(type)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      aria-label={t("admin.content_types.delete")}
                      onClick={() => setToDelete(type)}
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

      <ContentTypeFormModal
        open={formOpen}
        editing={editing}
        onClose={() => setFormOpen(false)}
      />
      <ConfirmDeleteDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={t("admin.content_types.delete")}
        description={t("admin.content_types.confirm_delete", {
          key: toDelete?.key ?? "",
        })}
        confirmLabel={t("admin.content_types.delete")}
        cancelLabel={t("admin.content_types.form.cancel")}
        onConfirm={() => {
          if (toDelete) {
            deleteType.mutate(toDelete.key);
          }
          setToDelete(null);
        }}
      />
    </div>
  );
}

AdminContentTypesPage.getLayout = getAdminLayout;
