"""Admin classes and registrations for core app."""

from django.contrib import admin
from django.contrib.auth import admin as auth_admin
from django.utils.translation import gettext_lazy as _

from lasuite.malware_detection import malware_detection

from core import models


@admin.register(models.User)
class UserAdmin(auth_admin.UserAdmin):
    """Admin class for the User model"""

    fieldsets = (
        (
            None,
            {
                "fields": (
                    "id",
                    "admin_email",
                    "password",
                )
            },
        ),
        (
            _("Personal info"),
            {
                "fields": (
                    "sub",
                    "email",
                    "full_name",
                    "short_name",
                    "language",
                    "timezone",
                )
            },
        ),
        (
            _("Permissions"),
            {
                "fields": (
                    "is_active",
                    "is_device",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                ),
            },
        ),
        (_("Important dates"), {"fields": ("created_at", "updated_at")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "password1", "password2"),
            },
        ),
    )
    list_display = (
        "id",
        "sub",
        "full_name",
        "admin_email",
        "email",
        "is_active",
        "is_staff",
        "is_superuser",
        "is_device",
        "created_at",
        "updated_at",
    )
    list_filter = ("is_staff", "is_superuser", "is_device", "is_active")
    ordering = (
        "is_active",
        "-is_superuser",
        "-is_staff",
        "-is_device",
        "-updated_at",
        "full_name",
    )
    readonly_fields = (
        "id",
        "sub",
        "email",
        "full_name",
        "short_name",
        "created_at",
        "updated_at",
    )
    search_fields = ("id", "sub", "admin_email", "email", "full_name")


class ItemAccessInline(admin.TabularInline):
    """Inline admin class for item accesses."""

    autocomplete_fields = ["user"]
    model = models.ItemAccess
    extra = 0


@admin.register(models.Item)
class ItemAdmin(admin.ModelAdmin):
    """item admin interface declaration."""

    fieldsets = (
        (
            None,
            {
                "fields": (
                    "id",
                    "title",
                    "filename",
                    "size",
                    "deleted_at",
                    "ancestors_deleted_at",
                    "malware_detection_info",
                )
            },
        ),
        (
            _("Permissions"),
            {
                "fields": (
                    "creator",
                    "link_reach",
                    "link_role",
                )
            },
        ),
        (
            _("Malware detection"),
            {"fields": ("upload_state",)},
        ),
        (
            _("Tree structure"),
            {
                "fields": (
                    "path",
                    "depth",
                    "numchild",
                )
            },
        ),
    )
    inlines = (ItemAccessInline,)
    list_display = (
        "id",
        "title",
        "type",
        "link_reach",
        "link_role",
        "upload_state",
        "created_at",
        "updated_at",
    )
    readonly_fields = (
        "creator",
        "depth",
        "id",
        "numchild",
        "path",
        "filename",
        "size",
        "deleted_at",
        "ancestors_deleted_at",
        "malware_detection_info",
    )
    search_fields = ("id", "title", "creator__email")
    list_filter = ("upload_state", "link_reach", "link_role")
    show_facets = admin.ShowFacets.ALWAYS
    actions = ("trigger_file_analysis",)

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        queryset = queryset.annotate_with_numchild()

        return queryset

    def trigger_file_analysis(self, request, queryset):
        """Reanalyse the file of the items."""

        for item in queryset:
            if item.type == models.ItemTypeChoices.FILE:
                malware_detection.analyse_file(item.file_key, item_id=item.id)

        self.message_user(request, "The files have been scheduled for a new analysis.")


@admin.register(models.Invitation)
class InvitationAdmin(admin.ModelAdmin):
    """Admin interface to handle invitations."""

    fields = (
        "email",
        "item",
        "role",
        "created_at",
        "issuer",
    )
    readonly_fields = (
        "created_at",
        "is_expired",
        "issuer",
    )
    list_display = (
        "email",
        "item",
        "created_at",
        "is_expired",
    )

    def save_model(self, request, obj, form, change):
        obj.issuer = request.user
        obj.save()


@admin.register(models.MetadataTemplate)
class MetadataTemplateAdmin(admin.ModelAdmin):
    """Admin console for governed metadata templates (E2.1).

    The schema lives in the `fields` JSON: a list of
    `{"key", "type"[, "required", "options"]}` (type in string/number/
    boolean/date/enum), validated on save by the model validator.
    """

    fields = ("key", "name", "fields", "creator", "created_at", "updated_at")
    readonly_fields = ("creator", "created_at", "updated_at")
    list_display = ("key", "name", "creator", "created_at")
    search_fields = ("key", "name")
    ordering = ("name",)

    def save_model(self, request, obj, form, change):
        if not change and obj.creator_id is None:
            obj.creator = request.user
        obj.save()


@admin.register(models.ContentObjectType)
class ContentObjectTypeAdmin(admin.ModelAdmin):
    """Admin console for the content object type registry (E2.2 / ADR-0001).

    Types are defined as data here (base + metadata template + behaviour proxy
    + containment rules) — never as Python subclasses.
    """

    fields = (
        "key",
        "label",
        "base",
        "metadata_template",
        "behavior_proxy",
        "allowed_child_types",
        "is_active",
        "description",
        "creator",
        "created_at",
        "updated_at",
    )
    readonly_fields = ("creator", "created_at", "updated_at")
    list_display = ("key", "label", "base", "is_active", "created_at")
    list_filter = ("base", "is_active")
    search_fields = ("key", "label", "description")
    ordering = ("label",)

    def save_model(self, request, obj, form, change):
        if not change and obj.creator_id is None:
            obj.creator = request.user
        obj.save()


@admin.register(models.ContentRelation)
class ContentRelationAdmin(admin.ModelAdmin):
    """Admin console for the content composition/reference graph (E2.2)."""

    fields = (
        "from_item",
        "to_item",
        "relation_type",
        "role",
        "order",
        "pinned_version",
        "creator",
        "created_at",
    )
    readonly_fields = ("from_item", "to_item", "creator", "created_at")
    list_display = (
        "from_item",
        "relation_type",
        "to_item",
        "role",
        "order",
        "created_at",
    )
    list_filter = ("relation_type",)
    search_fields = ("from_item__title", "to_item__title", "role")

    def has_add_permission(self, request):
        return False


@admin.register(models.SignatureRequest)
class SignatureRequestAdmin(admin.ModelAdmin):
    """Read-only view over e-signature requests (H1.8)."""

    fields = (
        "item",
        "signer_email",
        "status",
        "external_id",
        "signed_at",
        "creator",
        "created_at",
    )
    readonly_fields = fields
    list_display = ("item", "signer_email", "status", "signed_at", "created_at")
    list_filter = ("status",)
    search_fields = ("item__title", "signer_email", "external_id")

    def has_add_permission(self, request):
        return False


@admin.register(models.DataRoom)
class DataRoomAdmin(admin.ModelAdmin):
    """Admin console for data rooms (H1 / secured folders)."""

    fields = (
        "item",
        "allow_download",
        "watermark_enabled",
        "creator",
        "created_at",
    )
    readonly_fields = ("item", "creator", "created_at")
    list_display = ("item", "allow_download", "watermark_enabled", "created_at")
    list_filter = ("allow_download", "watermark_enabled")
    search_fields = ("item__title",)


@admin.register(models.LegalHold)
class LegalHoldAdmin(admin.ModelAdmin):
    """Admin console for legal holds (H1.6 / Coffre)."""

    fields = ("item", "name", "reason", "is_active", "creator", "created_at")
    readonly_fields = ("item", "creator", "created_at")
    list_display = ("item", "name", "is_active", "creator", "created_at")
    list_filter = ("is_active",)
    search_fields = ("item__title", "name", "reason")


@admin.register(models.ShareLink)
class ShareLinkAdmin(admin.ModelAdmin):
    """Read-only view over advanced share links (H1.3)."""

    fields = (
        "item",
        "token",
        "role",
        "expires_at",
        "max_downloads",
        "download_count",
        "creator",
        "created_at",
    )
    readonly_fields = fields
    list_display = ("item", "role", "expires_at", "download_count", "created_at")
    list_filter = ("role",)
    search_fields = ("item__title", "token")

    def has_add_permission(self, request):
        return False


@admin.register(models.AuditEvent)
class AuditEventAdmin(admin.ModelAdmin):
    """Strictly read-only audit log (H1.5).

    The audit trail is append-only and tamper-evident (hash chain); the admin
    must never create, edit or delete entries — only consult them.
    """

    fields = (
        "created_at",
        "action",
        "actor",
        "actor_type",
        "target",
        "target_uuid",
        "target_type",
        "path_snapshot",
        "metadata",
        "prev_hash",
        "entry_hash",
    )
    readonly_fields = fields
    list_display = ("created_at", "action", "actor_type", "actor", "target_type")
    list_filter = ("action", "actor_type", "target_type")
    search_fields = ("action", "target_uuid", "actor__email")
    date_hierarchy = "created_at"

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
