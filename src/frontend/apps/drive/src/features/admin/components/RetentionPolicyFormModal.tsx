// Modale DS de création / édition d'une politique de rétention (console admin, E3.1).
// La base « metadata_date » révèle le choix du template + le champ date.
// Pages Router : pas de "use client".
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
import { RetentionBasis, RetentionPolicy } from "@/features/drivers/types";
import { useMetadataTemplates } from "@/features/explorer/hooks/useQueries";
import {
  useMutationCreatePolicy,
  useMutationUpdatePolicy,
} from "../hooks/useMutationsRetentionPolicies";

const NO_TEMPLATE = "__none__";

export type RetentionPolicyFormModalProps = {
  open: boolean;
  onClose: () => void;
  editing: RetentionPolicy | null;
};

const FormBody = ({
  editing,
  onClose,
}: {
  editing: RetentionPolicy | null;
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  const { data: templates } = useMetadataTemplates();
  const createPolicy = useMutationCreatePolicy();
  const updatePolicy = useMutationUpdatePolicy();

  const [key, setKey] = useState(editing?.key ?? "");
  const [name, setName] = useState(editing?.name ?? "");
  const [durationDays, setDurationDays] = useState(
    String(editing?.duration_days ?? ""),
  );
  const [basis, setBasis] = useState<RetentionBasis>(
    editing?.basis ?? "creation",
  );
  const [templateId, setTemplateId] = useState(
    editing?.metadata_template ?? NO_TEMPLATE,
  );
  const [metadataField, setMetadataField] = useState(
    editing?.metadata_field ?? "",
  );
  const [isActive, setIsActive] = useState(editing?.is_active ?? true);
  const [description, setDescription] = useState(editing?.description ?? "");

  const isPending = createPolicy.isPending || updatePolicy.isPending;
  const tr = (k: string) => t(`admin.retention_policies.form.${k}`);
  const days = Number(durationDays);
  const valid = key.trim() && name.trim() && days > 0;

  const onSubmit = () => {
    if (!valid) {
      return;
    }
    const payload = {
      key: key.trim(),
      name: name.trim(),
      duration_days: days,
      basis,
      metadata_template:
        basis === "metadata_date" && templateId !== NO_TEMPLATE
          ? templateId
          : null,
      metadata_field: basis === "metadata_date" ? metadataField.trim() : "",
      is_active: isActive,
      description: description.trim(),
    };
    const onSuccess = () => onClose();
    if (editing) {
      updatePolicy.mutate({ key: editing.key, payload }, { onSuccess });
    } else {
      createPolicy.mutate(payload, { onSuccess });
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
          <Label htmlFor="rp-key">{tr("key")} *</Label>
          <Input
            id="rp-key"
            value={key}
            disabled={!!editing}
            onChange={(event) => setKey(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rp-name">{tr("name")} *</Label>
          <Input
            id="rp-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rp-duration">{tr("duration_days")} *</Label>
          <Input
            id="rp-duration"
            type="number"
            min={1}
            value={durationDays}
            onChange={(event) => setDurationDays(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rp-basis">{tr("basis")}</Label>
          <Select
            value={basis}
            onValueChange={(value) => setBasis(value as RetentionBasis)}
          >
            <SelectTrigger id="rp-basis">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="creation">{tr("basis_creation")}</SelectItem>
              <SelectItem value="metadata_date">
                {tr("basis_metadata")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {basis === "metadata_date" && (
          <>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rp-template">{tr("template")}</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger id="rp-template">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_TEMPLATE}>
                    {tr("no_template")}
                  </SelectItem>
                  {(templates ?? []).map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} ({template.key})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rp-field">{tr("metadata_field")}</Label>
              <Input
                id="rp-field"
                placeholder="end_date"
                value={metadataField}
                onChange={(event) => setMetadataField(event.target.value)}
              />
            </div>
          </>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rp-description">{tr("description")}</Label>
          <textarea
            id="rp-description"
            className="min-h-20 w-full rounded-md border border-solid border-border bg-transparent px-3 py-2 text-sm text-foreground"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="rp-active"
            checked={isActive}
            onCheckedChange={(checked) => setIsActive(!!checked)}
          />
          <Label htmlFor="rp-active">{tr("active")}</Label>
        </div>
      </div>

      <DialogFooter>
        <Button variant="secondary" onClick={onClose}>
          {tr("cancel")}
        </Button>
        <Button onClick={onSubmit} disabled={!valid || isPending}>
          {tr("submit")}
        </Button>
      </DialogFooter>
    </>
  );
};

export const RetentionPolicyFormModal = ({
  open,
  onClose,
  editing,
}: RetentionPolicyFormModalProps) => {
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
