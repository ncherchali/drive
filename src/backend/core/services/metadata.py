"""Governed metadata service (E2.1 / MetadataService — spine foundation #1).

Validates item metadata against a `MetadataTemplate` schema, applies instances
to items (stored in `Item.metadata` namespaced by the template key, JSONB + GIN),
cascades a template's values down a folder subtree (ltree), and queries items by
metadata. Thin, explicit service over the fat `Item`/ltree core.
"""

from datetime import date

from core import models
from core.services import audit


class MetadataValidationError(Exception):
    """Raised when metadata values do not match the template schema."""

    def __init__(self, errors):
        self.errors = errors
        super().__init__(str(errors))


def _is_valid_date(value):
    if not isinstance(value, str):
        return False
    try:
        date.fromisoformat(value)
    except ValueError:
        return False
    return True


def _check_type(field_type, value, options):
    """Return an error string if `value` does not match `field_type`, else None."""
    checks = {
        "string": (isinstance(value, str), "expected a string"),
        "number": (
            isinstance(value, (int, float)) and not isinstance(value, bool),
            "expected a number",
        ),
        "boolean": (isinstance(value, bool), "expected a boolean"),
        "date": (_is_valid_date(value), "expected an ISO date string"),
        "enum": (value in (options or []), "not an allowed option"),
    }
    if field_type not in checks:
        return f"unknown field type '{field_type}'"
    ok, error = checks[field_type]
    return None if ok else error


def validate_values(template, values):
    """Return a dict of field errors (empty when the values are valid)."""
    if not isinstance(values, dict):
        return {"__all__": "values must be an object"}

    fields = {field["key"]: field for field in template.fields}
    errors = {}

    for key in values:
        if key not in fields:
            errors[key] = "unknown field"

    for key, field in fields.items():
        if key not in values:
            if field.get("required"):
                errors[key] = "required"
            continue
        error = _check_type(field["type"], values[key], field.get("options"))
        if error:
            errors[key] = error

    return errors


def _store(item, template_key, values):
    metadata = dict(item.metadata or {})
    metadata[template_key] = values
    item.metadata = metadata


def apply_to_item(item, template, values, actor=None):
    """Validate and store a metadata instance on a single item."""
    errors = validate_values(template, values)
    if errors:
        raise MetadataValidationError(errors)
    _store(item, template.key, values)
    item.save(update_fields=["metadata", "updated_at"])
    audit.record(
        "metadata.apply",
        actor=actor,
        target=item,
        metadata={"template": template.key},
    )
    return item


def cascade_to_subtree(folder, template, values, actor=None):
    """Apply a metadata instance to a folder and all its descendants."""
    errors = validate_values(template, values)
    if errors:
        raise MetadataValidationError(errors)
    count = 0
    queryset = models.Item.objects.filter(path__descendants=folder.path)
    for item in queryset.iterator():
        _store(item, template.key, values)
        item.save(update_fields=["metadata", "updated_at"])
        count += 1
    audit.record(
        "metadata.cascade",
        actor=actor,
        target=folder,
        metadata={"template": template.key, "count": count},
    )
    return count


def query_items(template_key, equals):
    """Return items whose metadata under `template_key` contains `equals`."""
    return models.Item.objects.filter(
        **{f"metadata__{template_key}__contains": equals}
    )
