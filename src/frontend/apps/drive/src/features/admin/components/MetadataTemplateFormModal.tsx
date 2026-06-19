// Modale DS de création / édition d'un template de métadonnées (console admin).
// Inclut un éditeur de champs dynamique (clé, type, requis, options d'enum).
// Pages Router : pas de "use client".
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2 } from "lucide-react";
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
import { MetadataTemplate, TemplateField } from "@/features/drivers/types";
import {
  useMutationCreateTemplate,
  useMutationUpdateTemplate,
} from "../hooks/useMutationsMetadataTemplates";

const FIELD_TYPES: TemplateField["type"][] = [
  "string",
  "number",
  "boolean",
  "date",
  "enum",
];

const csvToList = (value: string) =>
  value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

export type MetadataTemplateFormModalProps = {
  open: boolean;
  onClose: () => void;
  editing: MetadataTemplate | null;
};

const FormBody = ({
  editing,
  onClose,
}: {
  editing: MetadataTemplate | null;
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  const createTemplate = useMutationCreateTemplate();
  const updateTemplate = useMutationUpdateTemplate();

  const [key, setKey] = useState(editing?.key ?? "");
  const [name, setName] = useState(editing?.name ?? "");
  const [fields, setFields] = useState<TemplateField[]>(
    editing?.fields ? editing.fields.map((field) => ({ ...field })) : [],
  );

  const isPending = createTemplate.isPending || updateTemplate.isPending;
  const tr = (k: string) => t(`admin.metadata_templates.form.${k}`);

  const updateField = (index: number, partial: Partial<TemplateField>) =>
    setFields((prev) =>
      prev.map((field, idx) =>
        idx === index ? { ...field, ...partial } : field,
      ),
    );
  const addField = () =>
    setFields((prev) => [...prev, { key: "", type: "string" }]);
  const removeField = (index: number) =>
    setFields((prev) => prev.filter((_, idx) => idx !== index));

  const onSubmit = () => {
    if (!key.trim() || !name.trim()) {
      return;
    }
    const cleanFields = fields
      .filter((field) => field.key.trim())
      .map((field) => {
        const out: TemplateField = {
          key: field.key.trim(),
          type: field.type,
        };
        if (field.required) {
          out.required = true;
        }
        if (field.type === "enum" && field.options?.length) {
          out.options = field.options;
        }
        return out;
      });
    const payload = { key: key.trim(), name: name.trim(), fields: cleanFields };
    const onSuccess = () => onClose();
    if (editing) {
      updateTemplate.mutate({ key: editing.key, payload }, { onSuccess });
    } else {
      createTemplate.mutate(payload, { onSuccess });
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {editing ? tr("title_edit") : tr("title_new")}
        </DialogTitle>
      </DialogHeader>

      <div className="flex flex-col gap-4 py-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tpl-key">{tr("key")} *</Label>
          <Input
            id="tpl-key"
            value={key}
            disabled={!!editing}
            onChange={(event) => setKey(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tpl-name">{tr("name")} *</Label>
          <Input
            id="tpl-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label>{tr("fields")}</Label>
            <Button variant="secondary" size="sm" onClick={addField}>
              <Plus className="size-4" />
              {tr("add_field")}
            </Button>
          </div>

          {fields.length === 0 ? (
            <p className="text-sm text-muted-foreground">{tr("no_field")}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {fields.map((field, index) => (
                <li
                  key={index}
                  className="flex flex-col gap-2 rounded-md border border-solid border-border p-2"
                >
                  <div className="flex items-center gap-2">
                    <Input
                      className="flex-1"
                      placeholder={tr("field_key")}
                      value={field.key}
                      onChange={(event) =>
                        updateField(index, { key: event.target.value })
                      }
                    />
                    <Select
                      value={field.type}
                      onValueChange={(value) =>
                        updateField(index, {
                          type: value as TemplateField["type"],
                        })
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0"
                      aria-label={tr("remove_field")}
                      onClick={() => removeField(index)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Checkbox
                        checked={!!field.required}
                        onCheckedChange={(checked) =>
                          updateField(index, { required: !!checked })
                        }
                      />
                      {tr("required")}
                    </label>
                    {field.type === "enum" && (
                      <Input
                        className="flex-1"
                        placeholder={tr("options")}
                        value={(field.options ?? []).join(", ")}
                        onChange={(event) =>
                          updateField(index, {
                            options: csvToList(event.target.value),
                          })
                        }
                      />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <DialogFooter>
        <Button variant="secondary" onClick={onClose}>
          {tr("cancel")}
        </Button>
        <Button
          onClick={onSubmit}
          disabled={!key.trim() || !name.trim() || isPending}
        >
          {tr("submit")}
        </Button>
      </DialogFooter>
    </>
  );
};

export const MetadataTemplateFormModal = ({
  open,
  onClose,
  editing,
}: MetadataTemplateFormModalProps) => {
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) {
          onClose();
        }
      }}
    >
      <DialogContent className="sahla-ds max-h-[90vh] overflow-y-auto">
        {open && <FormBody editing={editing} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
};
