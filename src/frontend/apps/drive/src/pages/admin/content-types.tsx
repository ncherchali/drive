// Console d'administration du registre des types de contenu (ADR-0001).
// Réservée aux administrateurs (is_staff) ; le backend refuse les écritures
// des non-staff de toute façon (403). Pages Router : pas de "use client".
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { getSimpleLayout } from "@/features/layouts/components/simple/SimpleLayout";
import { useAuth } from "@/features/auth/Auth";
import { useContentObjectTypes } from "@/features/explorer/hooks/useQueries";
import { useMutationDeleteContentType } from "@/features/admin/hooks/useMutationsContentTypes";
import { ContentTypeFormModal } from "@/features/admin/components/ContentTypeFormModal";
import { ContentObjectType } from "@/features/drivers/types";
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

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (type: ContentObjectType) => {
    setEditing(type);
    setFormOpen(true);
  };
  const onDelete = (type: ContentObjectType) => {
    if (
      window.confirm(t("admin.content_types.confirm_delete", { key: type.key }))
    ) {
      deleteType.mutate(type.key);
    }
  };

  if (user && !user.is_staff) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <p className="text-muted-foreground">
          {t("admin.content_types.forbidden")}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-foreground">
          {t("admin.content_types.title")}
        </h1>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          {t("admin.content_types.create")}
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">
          {t("admin.content_types.loading")}
        </p>
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
            {(types ?? []).map((type) => (
              <TableRow key={type.key}>
                <TableCell className="font-medium">{type.key}</TableCell>
                <TableCell>{type.label}</TableCell>
                <TableCell>{type.base}</TableCell>
                <TableCell className="text-muted-foreground">
                  {type.template_key ?? "—"}
                </TableCell>
                <TableCell>
                  {type.is_active
                    ? t("admin.content_types.yes")
                    : t("admin.content_types.no")}
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
                    className="size-8"
                    aria-label={t("admin.content_types.delete")}
                    onClick={() => onDelete(type)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ContentTypeFormModal
        open={formOpen}
        editing={editing}
        onClose={() => setFormOpen(false)}
      />
    </div>
  );
}

AdminContentTypesPage.getLayout = getSimpleLayout;
