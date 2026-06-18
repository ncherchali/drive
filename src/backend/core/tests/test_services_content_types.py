"""Tests for the content object type service (E2.2 / ADR-0001 phase 1)."""

import pytest

from core import factories, models
from core.services import content_types

pytestmark = pytest.mark.django_db


def test_workspace_type_is_seeded_by_migration():
    """The built-in WORKSPACE type and its template ship with the migration."""
    content_type = content_types.get_type("workspace")
    assert content_type is not None
    assert content_type.base == models.ItemTypeChoices.FOLDER
    assert content_type.behavior_proxy == "core.models.Workspace"
    assert content_type.metadata_template is not None


def test_get_type_returns_none_for_unknown_blank_or_inactive():
    inactive = factories.ContentObjectTypeFactory(is_active=False)
    assert content_types.get_type("does-not-exist") is None
    assert content_types.get_type("") is None
    assert content_types.get_type(None) is None
    assert content_types.get_type(inactive.key) is None


def test_assign_content_type_sets_key_and_audits():
    folder = factories.ItemFactory(type=models.ItemTypeChoices.FOLDER)

    content_types.assign_content_type(folder, "workspace")

    folder.refresh_from_db()
    assert folder.content_type == "workspace"
    assert models.AuditEvent.objects.filter(
        action="item.content_type", target_uuid=folder.id
    ).exists()


def test_assign_content_type_rejects_base_mismatch():
    """A FILE cannot take a FOLDER-based content type."""
    file_item = factories.ItemFactory(type=models.ItemTypeChoices.FILE)

    with pytest.raises(content_types.ContentTypeError):
        content_types.assign_content_type(file_item, "workspace")


def test_assign_content_type_rejects_unknown_type():
    folder = factories.ItemFactory(type=models.ItemTypeChoices.FOLDER)

    with pytest.raises(content_types.ContentTypeError):
        content_types.assign_content_type(folder, "ghost")


def test_clear_content_type_resets_to_plain_folder():
    folder = factories.ItemFactory(type=models.ItemTypeChoices.FOLDER)
    content_types.assign_content_type(folder, "workspace")

    content_types.clear_content_type(folder)

    folder.refresh_from_db()
    assert folder.content_type is None


def test_proxy_for_returns_workspace_instance():
    folder = factories.ItemFactory(type=models.ItemTypeChoices.FOLDER)
    content_types.assign_content_type(folder, "workspace")

    proxy = content_types.proxy_for(folder)

    assert isinstance(proxy, models.Workspace)
    assert proxy.id == folder.id


def test_proxy_for_returns_item_when_no_proxy():
    plain = factories.ItemFactory(type=models.ItemTypeChoices.FOLDER)
    assert content_types.proxy_for(plain) is plain


def test_workspace_manager_scopes_to_workspace_content_type():
    workspace_folder = factories.ItemFactory(type=models.ItemTypeChoices.FOLDER)
    content_types.assign_content_type(workspace_folder, "workspace")
    factories.ItemFactory(type=models.ItemTypeChoices.FOLDER)  # plain folder

    ids = set(models.Workspace.objects.values_list("id", flat=True))
    assert workspace_folder.id in ids
    assert all(
        models.Item.objects.get(id=i).content_type == "workspace" for i in ids
    )


def test_workspace_branding_reads_metadata_namespace():
    workspace = models.Workspace(metadata={"workspace": {"branding": "teal"}})
    assert workspace.branding == "teal"
