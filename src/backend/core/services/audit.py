"""Sovereign audit trail service.

Single, explicit entry point — :func:`record` — used across the codebase to
append immutable :class:`core.models.AuditEvent` rows. Recording is **explicit**
(no Django signals) so each audit point is a reviewed call site carrying
accurate business context.

By default :func:`record` is *fail-closed* and writes synchronously: called
inside the caller's database transaction, it commits atomically with the audited
operation (a poor-man's transactional outbox — if the operation commits, its
audit row commits too; if auditing fails, the operation rolls back rather than
leaving an un-audited mutation). Non-critical or read-side capture (e.g. media
downloads, story A2-5) may pass ``fail_silently=True`` to avoid breaking the
caller; resilient async shipping (outbox/DLQ) is layered on later without
changing this call surface.
"""

import hashlib
import json
import logging

from django.conf import settings
from django.contrib.auth.models import AnonymousUser
from django.db import connection, transaction

from core import models

logger = logging.getLogger(__name__)

# Fixed key for the advisory lock that serializes hash-chain appends (A2-7).
_AUDIT_CHAIN_LOCK = 0xA0D17
# prev_hash value of the very first (genesis) chained event.
_GENESIS = ""


def _resolve_actor(actor):
    """Return a ``(user_or_None, actor_type)`` tuple from a raw actor value."""
    if isinstance(actor, models.User):
        return actor, models.AuditActorTypeChoices.USER
    if isinstance(actor, AnonymousUser):
        return None, models.AuditActorTypeChoices.ANONYMOUS
    return None, models.AuditActorTypeChoices.SYSTEM


def _entry_hash(event, prev_hash):
    """SHA-256 over the event's stable content chained to ``prev_hash``.

    ``created_at`` is DB-assigned (auto_now_add) and therefore excluded; the
    UUID id keeps each entry unique, and every other meaningful field is
    covered, so any content alteration breaks the chain.
    """
    payload = json.dumps(
        {
            "id": str(event.id),
            "actor_id": str(event.actor_id) if event.actor_id else None,
            "actor_type": event.actor_type,
            "action": event.action,
            "target_uuid": str(event.target_uuid) if event.target_uuid else None,
            "target_type": event.target_type,
            "path_snapshot": event.path_snapshot,
            "metadata": event.metadata,
        },
        sort_keys=True,
        default=str,
    )
    return hashlib.sha256(f"{prev_hash}:{payload}".encode()).hexdigest()


def _event_payload(event):
    """Self-contained, JSON-serializable snapshot of an audit event (outbox)."""
    return {
        "id": str(event.id),
        "action": event.action,
        "actor_id": str(event.actor_id) if event.actor_id else None,
        "actor_type": event.actor_type,
        "target_uuid": str(event.target_uuid) if event.target_uuid else None,
        "target_type": event.target_type,
        "path_snapshot": event.path_snapshot,
        "metadata": event.metadata,
        "created_at": event.created_at.isoformat() if event.created_at else None,
    }


def _enqueue_outbox(event):
    """Write a transactional outbox row for `event` when the feature is on.

    Runs inside the caller's transaction (same as the event), guaranteeing the
    outbox row commits atomically with the audited operation — zero event loss.
    """
    if not getattr(settings, "FEATURES_AUDIT_OUTBOX", False):
        return
    models.AuditOutboxEntry.objects.create(
        audit_event_id=event.id,
        payload=_event_payload(event),
    )


def _append_chained(event):
    """Append ``event`` to the hash chain under a serializing advisory lock."""
    with transaction.atomic():
        with connection.cursor() as cursor:
            cursor.execute("SELECT pg_advisory_xact_lock(%s)", [_AUDIT_CHAIN_LOCK])
        last = (
            models.AuditEvent.objects.exclude(entry_hash__isnull=True)
            .order_by("-created_at", "-id")
            .first()
        )
        event.prev_hash = last.entry_hash if last else _GENESIS
        event.entry_hash = _entry_hash(event, event.prev_hash)
        event.save()
    return event


# pylint: disable-next=too-many-arguments
def record(  # noqa: PLR0913
    action,
    *,
    actor=None,
    actor_type=None,
    target=None,
    target_type=None,
    path_snapshot=None,
    metadata=None,
    fail_silently=False,
):
    """Append an immutable audit event.

    Args:
        action (str): Dotted action key, e.g. ``"item.create"``.
        actor: The :class:`~core.models.User` behind the action, an
            ``AnonymousUser``, or ``None`` for a system action.
        actor_type: Explicit :class:`~core.models.AuditActorTypeChoices` value;
            inferred from ``actor`` when omitted.
        target: The targeted object. When it is an :class:`~core.models.Item`,
            ``target``/``target_id``/``path_snapshot`` are filled automatically;
            other models only populate the denormalized fields.
        target_type (str): Denormalized target kind; inferred from ``target``.
        path_snapshot (str): ltree path snapshot; inferred for items.
        metadata (dict): Extra structured context.
        fail_silently (bool): When ``True``, log and swallow write failures
            instead of raising (use for non-critical / read-side capture).

    Returns:
        The created :class:`~core.models.AuditEvent`, or ``None`` if the write
        failed and ``fail_silently`` is ``True``.
    """
    resolved_actor, inferred_type = _resolve_actor(actor)
    if actor_type is None:
        actor_type = inferred_type

    target_item = target if isinstance(target, models.Item) else None
    target_id = getattr(target, "pk", None) if target is not None else None

    if target is not None and target_type is None:
        target_type = target.__class__.__name__.lower()

    if path_snapshot is None and target_item is not None and target_item.path:
        path_snapshot = str(target_item.path)

    event = models.AuditEvent(
        action=action,
        actor=resolved_actor,
        actor_type=actor_type,
        target=target_item,
        target_uuid=target_id,
        target_type=target_type or "",
        path_snapshot=path_snapshot or "",
        metadata=metadata or {},
    )

    try:
        if getattr(settings, "FEATURES_AUDIT_TAMPER_EVIDENT", False):
            _append_chained(event)
        else:
            event.save()
        _enqueue_outbox(event)
        return event
    except Exception:  # pylint: disable=broad-except
        logger.exception("Failed to record audit event '%s'", action)
        if not fail_silently:
            raise
        return None


def verify_chain(events=None):
    """Verify the tamper-evident hash chain (A2-7).

    Walks the chain by following ``prev_hash`` → ``entry_hash`` links (order
    independent of timestamps), recomputing each hash. Returns
    ``(is_valid, problems)``: an altered event fails its hash recomputation, a
    removed event breaks a link, and a fork yields more than one successor.
    Only chained events (``entry_hash`` set) are considered.
    """
    queryset = (
        events
        if events is not None
        else models.AuditEvent.objects.exclude(entry_hash__isnull=True)
    )
    chained = list(queryset)
    if not chained:
        return True, []

    problems = []
    by_prev = {}
    for event in chained:
        if _entry_hash(event, event.prev_hash or _GENESIS) != event.entry_hash:
            problems.append(f"hash mismatch for event {event.id}")
        by_prev.setdefault(event.prev_hash or _GENESIS, []).append(event)

    walked = 0
    cursor_hash = _GENESIS
    while cursor_hash in by_prev:
        successors = by_prev[cursor_hash]
        if len(successors) > 1:
            problems.append(f"chain fork after hash {cursor_hash[:12]}…")
        walked += 1
        cursor_hash = successors[0].entry_hash
        if walked > len(chained):  # safety against an unexpected cycle
            break

    if walked != len(chained):
        problems.append(
            f"chain reaches {walked}/{len(chained)} events (missing/removed link)"
        )

    return (not problems), problems
