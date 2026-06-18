"""Content object type registry & behaviour resolution (E2.2 / ADR-0001 phase 1).

Layers a governed business type (`ContentObjectType`) on top of an Item's
structural `type`: validates assignment (the item's structural type must match
the type's `base`), records the act in the audit trail, and resolves the
optional behaviour proxy (a Django proxy model). Registry-in-data — types are
rows, never Python subclasses (no multi-table inheritance).
"""

from django.utils.module_loading import import_string

from core import models
from core.services import audit


class ContentTypeError(Exception):
    """Raised when a content type assignment is invalid."""


def get_type(key):
    """Return the active ``ContentObjectType`` for ``key``, or None."""
    if not key:
        return None
    return models.ContentObjectType.objects.filter(key=key, is_active=True).first()


def assign_content_type(item, type_key, actor=None):
    """Assign a governed content type to an item (validated) and audit it."""
    content_type = get_type(type_key)
    if content_type is None:
        raise ContentTypeError(f"Unknown or inactive content type '{type_key}'.")
    if item.type != content_type.base:
        raise ContentTypeError(
            f"Content type '{type_key}' requires base '{content_type.base}', "
            f"got item type '{item.type}'."
        )
    item.content_type = content_type.key
    item.save(update_fields=["content_type", "updated_at"])
    audit.record(
        "item.content_type",
        actor=actor,
        target=item,
        metadata={"content_type": content_type.key},
    )
    return item


def clear_content_type(item, actor=None):
    """Reset an item to a plain file/folder (no business type) and audit it."""
    item.content_type = None
    item.save(update_fields=["content_type", "updated_at"])
    audit.record(
        "item.content_type",
        actor=actor,
        target=item,
        metadata={"content_type": None},
    )
    return item


def proxy_for(item):
    """Return the behaviour proxy instance for an item, or the item itself.

    Resolves ``ContentObjectType.behavior_proxy`` (a dotted path to a Django
    proxy model) and re-wraps the already-loaded item as that proxy without an
    extra query.
    """
    content_type = get_type(item.content_type)
    if content_type is None or not content_type.behavior_proxy:
        return item
    proxy_model = import_string(content_type.behavior_proxy)
    proxy = proxy_model()
    proxy.__dict__.update(item.__dict__)
    return proxy
