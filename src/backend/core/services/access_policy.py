"""Effective access resolution for composite content objects (ADR-0001 §5.4, passe 4).

Accessing a composite does NOT grant access to its parts: each part keeps its own
`ItemAccess`. This service resolves the EFFECTIVE access a user has on a composite
= the most restrictive combination across the composite itself and every item it
assembles (its `part_of` manifest). Read-only; thin orchestration over the fat
Item/ItemAccess core and the ContentRelation graph (relations service).
"""

from lasuite.drf.models.choices import RoleChoices

from core.services import relations


def least_privileged(roles):
    """Return the least-privileged role among `roles`.

    Returns None as soon as any role is None (no access to that resource) — the
    intersection rule: a chain is only as accessible as its weakest link.
    """
    materialized = list(roles)
    if not materialized or any(role is None for role in materialized):
        return None
    return min(materialized, key=RoleChoices.get_priority)


def resolve_effective_access(composite, user):
    """Resolve a user's effective access on a composite and its assembled parts.

    Returns a dict with the user's own role on the composite, a per-part
    breakdown (role + accessibility), the effective (most restrictive) role and
    whether the composite is fully accessible (composite + all parts readable).
    """
    own_role = composite.get_role(user)

    parts = []
    part_roles = []
    for relation in relations.manifest(composite):
        part = relation.to_item
        role = part.get_role(user)
        parts.append(
            {
                "item_id": str(part.id),
                "title": part.title,
                "manifest_role": relation.role,
                "role": role,
                "accessible": role is not None,
            }
        )
        part_roles.append(role)

    inaccessible = [part["item_id"] for part in parts if not part["accessible"]]

    return {
        "own_role": own_role,
        "parts": parts,
        "effective_role": least_privileged([own_role, *part_roles]),
        "fully_accessible": own_role is not None and not inaccessible,
        "inaccessible_part_ids": inaccessible,
    }
