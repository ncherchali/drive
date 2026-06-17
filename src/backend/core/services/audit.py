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

import logging

from django.contrib.auth.models import AnonymousUser

from core import models

logger = logging.getLogger(__name__)


def _resolve_actor(actor):
    """Return a ``(user_or_None, actor_type)`` tuple from a raw actor value."""
    if isinstance(actor, models.User):
        return actor, models.AuditActorTypeChoices.USER
    if isinstance(actor, AnonymousUser):
        return None, models.AuditActorTypeChoices.ANONYMOUS
    return None, models.AuditActorTypeChoices.SYSTEM


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

    try:
        return models.AuditEvent.objects.create(
            action=action,
            actor=resolved_actor,
            actor_type=actor_type,
            target=target_item,
            target_uuid=target_id,
            target_type=target_type or "",
            path_snapshot=path_snapshot or "",
            metadata=metadata or {},
        )
    except Exception:  # pylint: disable=broad-except
        logger.exception("Failed to record audit event '%s'", action)
        if not fail_silently:
            raise
        return None
