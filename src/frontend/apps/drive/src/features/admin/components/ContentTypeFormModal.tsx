// Modale DS de création / édition d'un type de contenu (console admin, ADR-0001).
// Pages Router : pas de "use client".
//
// Le corps du formulaire est un sous-composant monté à l'ouverture (Radix
// démonte le contenu fermé) : l'état initial est dérivé des props en lazy init,
// sans effet de synchronisation.
import { useState } from "react";
import { useTranslation } from "react-i18next";
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
import { ContentObjectType, ItemType } from "@/features/drivers/types";
import { useMetadataTemplates } from "@/features/explorer/hooks/useQueries";
import {
  useMutationCreateContentType,
  useMutationUpdateContentType,
} from "../hooks/useMutationsContentTypes";

const NO_TEMPLATE = "__none__";

const csvToList = (value: string) =>
  value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
const listToCsv = (list?: string[]) => (list ?? []).join(", ");

export type ContentTypeFormModalProps = {
  open: boolean;
  onClose: () => void;
  editing: ContentObjectType | null;
};

const FormBody = ({
  editing,
  onClose,
}: {
  editing: ContentObjectType | null;
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  const { data: templates } = useMetadataTemplates();
  const createType = useMutationCreateContentType();
  const updateType = useMutationUpdateContentType();

  const [key, setKey] = useState(editing?.key ?? "");
  const [label, setLabel] = useState(editing?.label ?? "");
  const [base, setBase] = useState<ItemType>(editing?.base ?? ItemType.FOLDER);
  const [templateId, setTemplateId] = useState(
    editing?.metadata_template ?? NO_TEMPLATE,
  );
  const [requiredRoles, setRequiredRoles] = useState(
    listToCsv(editing?.required_roles),
  );
  const [allowedChildTypes, setAllowedChildTypes] = useState(
    listToCsv(editing?.allowed_child_types),
  );
  const [behaviorProxy, setBehaviorProxy] = useState(
    editing?.behavior_proxy ?? "",
  );
  const [isActive, setIsActive] = useState(editing?.is_active ?? true);
  const [description, setDescription] = useState(editing?.description ?? "");

  const isPending = createType.isPending || updateType.isPending;
  const tr = (k: string) => t(`admin.content_types.form.${k}`);

  const onSubmit = () => {
    if (!key.trim() || !label.trim()) {
      return;
    }
    const payload = {
      key: key.trim(),
      label: label.trim(),
      base,
      metadata_template: templateId !== NO_TEMPLATE ? templateId : null,
      behavior_proxy: behaviorProxy.trim(),
      allowed_child_types: csvToList(allowedChildTypes),
      required_roles: csvToList(requiredRoles),
      is_active: isActive,
      description: description.trim(),
    };
    const onSuccess = () => onClose();
    if (editing) {
      updateType.mutate({ key: editing.key, payload }, { onSuccess });
    } else {
      createType.mutate(payload, { onSuccess });
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
          <Label htmlFor="ct-key">{tr("key")} *</Label>
          <Input
            id="ct-key"
            value={key}
            disabled={!!editing}
            onChange={(event) => setKey(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ct-label">{tr("label")} *</Label>
          <Input
            id="ct-label"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ct-base">{tr("base")}</Label>
          <Select
            value={base}
            onValueChange={(value) => setBase(value as ItemType)}
          >
            <SelectTrigger id="ct-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ItemType.FOLDER}>folder</SelectItem>
              <SelectItem value={ItemType.FILE}>file</SelectItem>
              <SelectItem value={ItemType.RECORD}>record</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ct-template">{tr("template")}</Label>
          <Select value={templateId} onValueChange={setTemplateId}>
            <SelectTrigger id="ct-template">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_TEMPLATE}>{tr("no_template")}</SelectItem>
              {(templates ?? []).map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name} ({template.key})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ct-required">{tr("required_roles")}</Label>
          <Input
            id="ct-required"
            placeholder="formulaire, contrat"
            value={requiredRoles}
            onChange={(event) => setRequiredRoles(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ct-children">{tr("allowed_child_types")}</Label>
          <Input
            id="ct-children"
            value={allowedChildTypes}
            onChange={(event) => setAllowedChildTypes(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ct-proxy">{tr("behavior_proxy")}</Label>
          <Input
            id="ct-proxy"
            value={behaviorProxy}
            onChange={(event) => setBehaviorProxy(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ct-description">{tr("description")}</Label>
          <textarea
            id="ct-description"
            className="min-h-20 w-full rounded-md border border-solid border-border bg-transparent px-3 py-2 text-sm text-foreground"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="ct-active"
            checked={isActive}
            onCheckedChange={(checked) => setIsActive(!!checked)}
          />
          <Label htmlFor="ct-active">{tr("active")}</Label>
        </div>
      </div>

      <DialogFooter>
        <Button variant="secondary" onClick={onClose}>
          {tr("cancel")}
        </Button>
        <Button
          onClick={onSubmit}
          disabled={!key.trim() || !label.trim() || isPending}
        >
          {tr("submit")}
        </Button>
      </DialogFooter>
    </>
  );
};

export const ContentTypeFormModal = ({
  open,
  onClose,
  editing,
}: ContentTypeFormModalProps) => {
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
