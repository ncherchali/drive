"""Smoke tests for the Django admin registrations of E2/H1 models.

Focus on the audit log invariant: the admin must never let anyone create,
edit or delete audit entries (append-only / tamper-evident).
"""

from django.contrib.admin.sites import site
from django.test import RequestFactory
from django.urls import reverse

import pytest
from rest_framework.test import APIClient

from core import factories, models
from core.admin import AuditEventAdmin

pytestmark = pytest.mark.django_db


@pytest.mark.parametrize(
    "model",
    [
        models.MetadataTemplate,
        models.ContentObjectType,
        models.ContentRelation,
        models.MetadataProposal,
        models.RetentionPolicy,
        models.SignatureRequest,
        models.DataRoom,
        models.LegalHold,
        models.ShareLink,
        models.AuditEvent,
    ],
)
def test_admin_changelist_config_is_valid(model):
    """Each model is registered and its changelist queryset/config resolves.

    Renders the changelist instance (which validates `list_display`,
    `list_filter`, ordering, …) without hitting the static-file manifest that
    full HTML rendering would require in the Test configuration.
    """
    assert model in site._registry  # pylint: disable=protected-access
    model_admin = site._registry[model]  # pylint: disable=protected-access

    request = RequestFactory().get("/admin/")
    request.user = factories.UserFactory(is_staff=True, is_superuser=True)

    changelist = model_admin.get_changelist_instance(request)
    # Forcing the queryset to evaluate exercises annotations/ordering.
    assert list(changelist.get_queryset(request)[:1]) is not None
    assert model_admin.get_list_display(request)


def test_audit_event_admin_is_strictly_read_only():
    """The audit log can never be mutated through the admin."""
    admin = AuditEventAdmin(models.AuditEvent, site)
    assert admin.has_add_permission(request=None) is False
    assert admin.has_change_permission(request=None) is False
    assert admin.has_delete_permission(request=None) is False


def test_metadata_template_admin_sets_creator_on_create():
    """Creating a template via the admin stamps the current user as creator."""
    admin = factories.UserFactory(is_staff=True, is_superuser=True)
    client = APIClient()
    client.force_login(admin)

    url = reverse("admin:core_metadatatemplate_add")
    response = client.post(
        url,
        {
            "key": "contract",
            "name": "Contract",
            "fields": '[{"key": "owner", "type": "string"}]',
        },
    )

    assert response.status_code == 302
    template = models.MetadataTemplate.objects.get(key="contract")
    assert template.creator == admin
