"""Retention & disposition service (E3.1 / RetentionService).

Layers governed retention POLICIES on top of the raw `retention_until` WORM
field (H1.6): a policy computes a deadline from a basis (creation date or a
governed metadata date field) + a duration, applied extend-only (never
shortened). Past the deadline AND absent any legal hold, items become eligible
for disposition. Thin orchestration over the fat Item core (the lock invariants
— retention/legal-hold — stay in the model).
"""

from datetime import date, datetime, time

from django.utils import timezone

from core import models
from core.services import audit

RetentionBasisChoices = models.RetentionBasisChoices


class RetentionError(Exception):
    """Raised when a retention policy cannot be computed or applied."""


def _basis_datetime(policy, item):
    """Resolve the policy's basis datetime for `item` (timezone-aware)."""
    if policy.basis == RetentionBasisChoices.CREATION:
        return item.created_at

    template_key = policy.metadata_template.key if policy.metadata_template else None
    if not template_key or not policy.metadata_field:
        raise RetentionError("Policy basis is metadata_date but no field is configured.")

    raw = (item.metadata or {}).get(template_key, {}).get(policy.metadata_field)
    if not raw:
        raise RetentionError(
            f"Item has no '{policy.metadata_field}' date under '{template_key}'."
        )
    try:
        basis_date = date.fromisoformat(raw)
    except (TypeError, ValueError) as exc:
        raise RetentionError(f"Invalid date value '{raw}'.") from exc
    return timezone.make_aware(datetime.combine(basis_date, time.min))


def compute_retention_until(policy, item):
    """Return the retention deadline `item` would get under `policy`."""
    return _basis_datetime(policy, item) + timezone.timedelta(days=policy.duration_days)


def set_retention(item, until, actor=None):
    """Set/extend an item's retention deadline (extend-only WORM) and audit it."""
    if item.retention_until and item.retention_until >= until:
        raise RetentionError("Retention can only be extended, not shortened.")
    item.retention_until = until
    item.save(update_fields=["retention_until", "updated_at"])
    audit.record(
        "item.retention_set",
        actor=actor,
        target=item,
        metadata={"retention_until": until.isoformat()},
    )
    return item


def apply_policy(item, policy, actor=None):
    """Compute and apply a retention policy to an item (extend-only) and audit it."""
    until = compute_retention_until(policy, item)
    set_retention(item, until, actor=actor)
    audit.record(
        "item.retention_policy_applied",
        actor=actor,
        target=item,
        metadata={"policy": policy.key, "retention_until": until.isoformat()},
    )
    return item


def disposition_candidates(queryset=None):
    """Return items eligible for disposition: retention expired, no legal hold.

    Soft-deleted items are excluded (already on their way out).
    """
    items = queryset if queryset is not None else models.Item.objects.all()
    held_ids = models.LegalHold.objects.filter(is_active=True).values("item_id")
    return items.filter(
        retention_until__isnull=False,
        retention_until__lte=timezone.now(),
        deleted_at__isnull=True,
    ).exclude(id__in=held_ids)
