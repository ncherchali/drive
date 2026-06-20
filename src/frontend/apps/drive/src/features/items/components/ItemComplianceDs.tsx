// Onglet « Conformité » du panneau de droite (H1.6 / Coffre).
// Pages Router : pas de "use client".
//
// Rétention (deadline extend-only) + legal holds : un item verrouillé ne peut
// être supprimé. Réservé aux managers (l'onglet n'est monté que pour eux).
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Lock, ShieldAlert, ShieldCheck, Timer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClassificationLevel, LegalHold } from "@/features/drivers/types";
import {
  useItemClassification,
  useItemLegalHolds,
  useItemRetention,
  useRetentionPolicies,
} from "@/features/explorer/hooks/useQueries";
import {
  useMutationApplyRetentionPolicy,
  useMutationPlaceLegalHold,
  useMutationReleaseLegalHold,
  useMutationSetClassification,
  useMutationSetRetention,
} from "@/features/explorer/hooks/useMutationsCompliance";

const CLASSIFICATION_LEVELS: ClassificationLevel[] = [
  "public",
  "internal",
  "confidential",
  "secret",
];
const NO_LEVEL = "__none__";

export type ItemComplianceDsProps = {
  itemId: string;
};

export const ItemComplianceDs = ({ itemId }: ItemComplianceDsProps) => {
  const { t } = useTranslation();
  const { data: retention } = useItemRetention(itemId);
  const { data: holds } = useItemLegalHolds(itemId);
  const { data: classification } = useItemClassification(itemId);
  const { data: policies } = useRetentionPolicies();
  const setRetention = useMutationSetRetention();
  const placeHold = useMutationPlaceLegalHold();
  const releaseHold = useMutationReleaseLegalHold();
  const setClassification = useMutationSetClassification();
  const applyPolicy = useMutationApplyRetentionPolicy();

  const [durationDays, setDurationDays] = useState("");
  const [reason, setReason] = useState("");
  const [policyKey, setPolicyKey] = useState("");

  const activePolicies = (policies ?? []).filter((policy) => policy.is_active);
  const effectiveLevel = classification?.effective_classification ?? null;

  const handleSetClassification = (value: string) => {
    setClassification.mutate({
      itemId,
      level: value === NO_LEVEL ? null : (value as ClassificationLevel),
    });
  };

  const handleApplyPolicy = () => {
    if (!policyKey) {
      return;
    }
    applyPolicy.mutate(
      { itemId, policyKey },
      { onSuccess: () => setPolicyKey("") },
    );
  };

  const activeHolds = (holds ?? []).filter((hold: LegalHold) => hold.is_active);
  const retentionUntil = retention?.retention_until ?? null;

  const handleSetRetention = () => {
    const days = Number(durationDays);
    if (!days || days < 1) {
      return;
    }
    setRetention.mutate(
      { itemId, durationDays: days },
      { onSuccess: () => setDurationDays("") },
    );
  };

  const handlePlaceHold = () => {
    placeHold.mutate(
      { itemId, reason: reason || "" },
      { onSuccess: () => setReason("") },
    );
  };

  return (
    <div className="flex flex-col gap-5 py-2 text-sm">
      {/* Classification (p6) */}
      <section className="flex flex-col gap-2">
        <h3 className="flex items-center gap-2 font-medium text-foreground">
          <ShieldAlert className="size-4" />
          {t("explorer.rightPanel.compliance.classification")}
        </h3>
        {effectiveLevel &&
          effectiveLevel !== classification?.classification && (
            <p className="text-muted-foreground">
              {t("explorer.rightPanel.compliance.effective_classification")}{" "}
              <Badge variant="secondary">
                {t(`explorer.rightPanel.compliance.level.${effectiveLevel}`)}
              </Badge>
            </p>
          )}
        <Select
          value={classification?.classification ?? NO_LEVEL}
          onValueChange={handleSetClassification}
        >
          <SelectTrigger id="classification-level">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_LEVEL}>
              {t("explorer.rightPanel.compliance.unclassified")}
            </SelectItem>
            {CLASSIFICATION_LEVELS.map((level) => (
              <SelectItem key={level} value={level}>
                {t(`explorer.rightPanel.compliance.level.${level}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      {/* Retention */}
      <section className="flex flex-col gap-2 border-t border-solid border-border pt-3">
        <h3 className="flex items-center gap-2 font-medium text-foreground">
          <ShieldCheck className="size-4" />
          {t("explorer.rightPanel.compliance.retention")}
        </h3>
        <p className="text-muted-foreground">
          {retentionUntil
            ? t("explorer.rightPanel.compliance.retention_until", {
                date: new Date(retentionUntil).toLocaleDateString(),
              })
            : t("explorer.rightPanel.compliance.no_retention")}
        </p>
        <div className="flex items-end gap-2">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="retention-days">
              {t("explorer.rightPanel.compliance.duration_days")}
            </Label>
            <Input
              id="retention-days"
              type="number"
              min={1}
              value={durationDays}
              onChange={(event) => setDurationDays(event.target.value)}
            />
          </div>
          <Button
            onClick={handleSetRetention}
            disabled={setRetention.isPending}
          >
            {t("explorer.rightPanel.compliance.apply")}
          </Button>
        </div>

        {/* Retention policy (E3.1) */}
        {activePolicies.length > 0 && (
          <div className="flex items-end gap-2 pt-1">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="retention-policy">
                <Timer className="mr-1 inline size-3.5" />
                {t("explorer.rightPanel.compliance.policy")}
              </Label>
              <Select value={policyKey} onValueChange={setPolicyKey}>
                <SelectTrigger id="retention-policy">
                  <SelectValue
                    placeholder={t(
                      "explorer.rightPanel.compliance.policy_choose",
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {activePolicies.map((policy) => (
                    <SelectItem key={policy.key} value={policy.key}>
                      {policy.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="secondary"
              onClick={handleApplyPolicy}
              disabled={!policyKey || applyPolicy.isPending}
            >
              {t("explorer.rightPanel.compliance.apply_policy")}
            </Button>
          </div>
        )}
      </section>

      {/* Legal holds */}
      <section className="flex flex-col gap-2 border-t border-solid border-border pt-3">
        <h3 className="flex items-center gap-2 font-medium text-foreground">
          <Lock className="size-4" />
          {t("explorer.rightPanel.compliance.legal_holds")}
        </h3>

        {activeHolds.length === 0 ? (
          <p className="text-muted-foreground">
            {t("explorer.rightPanel.compliance.no_hold")}
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {activeHolds.map((hold: LegalHold) => (
              <li
                key={hold.id}
                className="flex items-center gap-2 rounded-md border border-solid border-border p-2"
              >
                <span className="min-w-0 flex-1 truncate">
                  {hold.reason || hold.name || hold.id}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0"
                  onClick={() =>
                    releaseHold.mutate({ itemId, holdId: hold.id })
                  }
                  aria-label={t("explorer.rightPanel.compliance.release")}
                >
                  <X className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-end gap-2">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="hold-reason">
              {t("explorer.rightPanel.compliance.reason")}
            </Label>
            <Input
              id="hold-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </div>
          <Button onClick={handlePlaceHold} disabled={placeHold.isPending}>
            {t("explorer.rightPanel.compliance.place_hold")}
          </Button>
        </div>
      </section>
    </div>
  );
};
