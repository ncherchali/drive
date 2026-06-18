// Modale DS « Nouvel enregistrement » (ADR-0001 phase 4 : objet RECORD).
// Pages Router : pas de "use client".
//
// Crée un objet structuré (sans octets) sous le dossier courant. On peut le
// typer (ContentObjectType de base RECORD) et remplir les champs de son
// template (E2.1) en un seul acte gouverné (endpoint records).
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/router";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ItemType, TemplateField } from "@/features/drivers/types";
import { useContentObjectTypes } from "@/features/explorer/hooks/useQueries";
import { useMutationCreateRecord } from "@/features/explorer/hooks/useMutations";
import { useSetSelectedItems } from "../../stores/selectionStore";

const NO_TYPE = "__none__";

export type ExplorerCreateRecordModalDsProps = {
  isOpen: boolean;
  onClose: () => void;
  parentId?: string;
  redirectAfterCreate?: boolean;
};

export const ExplorerCreateRecordModalDs = ({
  isOpen,
  onClose,
  parentId,
  redirectAfterCreate,
}: ExplorerCreateRecordModalDsProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const setSelectedItems = useSetSelectedItems();
  const createRecord = useMutationCreateRecord();
  const { data: types } = useContentObjectTypes();

  const [title, setTitle] = useState("");
  const [typeKey, setTypeKey] = useState(NO_TYPE);
  const [values, setValues] = useState<Record<string, unknown>>({});

  const recordTypes = (types ?? []).filter(
    (type) => type.base === ItemType.RECORD && type.is_active,
  );
  const selectedType = recordTypes.find((type) => type.key === typeKey);

  const reset = () => {
    setTitle("");
    setTypeKey(NO_TYPE);
    setValues({});
  };

  const close = () => {
    reset();
    onClose();
  };

  const setField = (key: string, value: unknown) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const onSubmit = () => {
    if (!parentId || !title.trim()) {
      return;
    }
    const contentType = typeKey !== NO_TYPE ? typeKey : undefined;
    const cleaned: Record<string, unknown> = {};
    for (const field of selectedType?.template_fields ?? []) {
      const value = values[field.key];
      if (value !== undefined && value !== "") {
        cleaned[field.key] = value;
      }
    }
    const metadata =
      contentType && Object.keys(cleaned).length ? cleaned : undefined;

    createRecord.mutate(
      { parentId, title: title.trim(), content_type: contentType, metadata },
      {
        onSuccess: (createdItem) => {
          close();
          if (redirectAfterCreate && createdItem?.id) {
            router.push(`/explorer/items/${createdItem.id}`);
            setSelectedItems([createdItem]);
          }
        },
      },
    );
  };

  const renderField = (field: TemplateField) => {
    const value = values[field.key];
    const label = field.key + (field.required ? " *" : "");
    if (field.type === "boolean") {
      return (
        <div key={field.key} className="flex items-center gap-2">
          <Checkbox
            id={`record-field-${field.key}`}
            checked={!!value}
            onCheckedChange={(checked) => setField(field.key, !!checked)}
          />
          <Label htmlFor={`record-field-${field.key}`}>{label}</Label>
        </div>
      );
    }
    return (
      <div key={field.key} className="flex flex-col gap-1.5">
        <Label htmlFor={`record-field-${field.key}`}>{label}</Label>
        {field.type === "enum" ? (
          <Select
            value={(value as string) ?? ""}
            onValueChange={(v) => setField(field.key, v)}
          >
            <SelectTrigger id={`record-field-${field.key}`}>
              <SelectValue placeholder="…" />
            </SelectTrigger>
            <SelectContent>
              {(field.options ?? []).map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            id={`record-field-${field.key}`}
            type={
              field.type === "number"
                ? "number"
                : field.type === "date"
                  ? "date"
                  : "text"
            }
            value={value === undefined || value === null ? "" : String(value)}
            onChange={(event) =>
              setField(
                field.key,
                field.type === "number"
                  ? event.target.value === ""
                    ? undefined
                    : Number(event.target.value)
                  : event.target.value,
              )
            }
          />
        )}
      </div>
    );
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          close();
        }
      }}
    >
      <DialogContent className="sahla-ds">
        <DialogHeader>
          <DialogTitle>
            {t("explorer.actions.createRecord.modal.title")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="record-title">
              {t("explorer.actions.createRecord.modal.label")}
            </Label>
            <Input
              id="record-title"
              data-testid="create-record-input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="record-type">
              {t("explorer.actions.createRecord.modal.type")}
            </Label>
            <Select
              value={typeKey}
              onValueChange={(value) => {
                setTypeKey(value);
                setValues({});
              }}
            >
              <SelectTrigger id="record-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_TYPE}>
                  {t("explorer.actions.createRecord.modal.no_type")}
                </SelectItem>
                {recordTypes.map((type) => (
                  <SelectItem key={type.key} value={type.key}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(selectedType?.template_fields ?? []).map((field) =>
            renderField(field),
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={close}>
            {t("explorer.actions.createRecord.modal.cancel")}
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!title.trim() || createRecord.isPending}
          >
            {t("explorer.actions.createRecord.modal.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
