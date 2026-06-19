"""Authentication Backends for the Drive core app."""

import logging

from django.conf import settings
from django.core.exceptions import SuspiciousOperation

from lasuite.oidc_login.backends import (
    OIDCAuthenticationBackend as LaSuiteOIDCAuthenticationBackend,
)

from core.authentication.exceptions import UserCannotAccessApp
from core.entitlements import get_entitlements_backend
from core.models import DuplicateEmailError

logger = logging.getLogger(__name__)


class OIDCAuthenticationBackend(LaSuiteOIDCAuthenticationBackend):
    """Custom OpenID Connect (OIDC) Authentication Backend.

    This class overrides the default OIDC Authentication Backend to accommodate differences
    in the User and Identity models, and handles signed and/or encrypted UserInfo response.
    """

    @staticmethod
    def _extract_roles(user_info):
        """Collect role/group names from the usual Keycloak claim locations."""
        roles = set()
        realm_access = user_info.get("realm_access") or {}
        roles.update(realm_access.get("roles") or [])
        for access in (user_info.get("resource_access") or {}).values():
            roles.update((access or {}).get("roles") or [])
        for claim in ("roles", "groups"):
            value = user_info.get(claim)
            if isinstance(value, (list, tuple)):
                roles.update(value)
        # Keycloak group paths are prefixed with "/" (e.g. "/admins").
        return {str(role).lstrip("/") for role in roles}

    def get_extra_claims(self, user_info):
        """
        Return extra claims from user_info.

        Args:
          user_info (dict): The user information dictionary.

        Returns:
          dict: A dictionary of extra claims.
        """

        # We need to add the claims that we want to store so that they are
        # available in the post_get_or_create_user method.
        claims_to_store = {claim: user_info.get(claim) for claim in settings.OIDC_STORE_CLAIMS}
        extra_claims = {
            "full_name": self.compute_full_name(user_info),
            "short_name": user_info.get(settings.OIDC_USERINFO_SHORTNAME_FIELD),
            "claims": claims_to_store,
        }

        # Map Keycloak roles/groups to Django's is_staff (admin areas). Active
        # only when OIDC_STAFF_ROLES is configured; otherwise is_staff is left
        # untouched (managed manually).
        staff_roles = set(settings.OIDC_STAFF_ROLES or [])
        if staff_roles:
            extra_claims["is_staff"] = bool(self._extract_roles(user_info) & staff_roles)

        return extra_claims

    def post_get_or_create_user(self, user, claims, is_new_user):
        """Enforce the Keycloak → is_staff mapping authoritatively.

        `update_user_if_needed` only applies truthy claims, so it cannot revoke
        is_staff. Here we set the exact desired value (granting AND revoking),
        while never downgrading a superuser.
        """
        super().post_get_or_create_user(user, claims, is_new_user)
        if "is_staff" not in claims or user.is_superuser:
            return
        desired = bool(claims["is_staff"])
        if user.is_staff != desired:
            user.is_staff = desired
            user.save(update_fields=["is_staff"])
            logger.info(
                "OIDC staff mapping: set is_staff=%s for user %s", desired, user.pk
            )

    def get_existing_user(self, sub, email):
        """Fetch existing user by sub or email."""

        try:
            return self.UserModel.objects.get_user_by_sub_or_email(sub, email)
        except DuplicateEmailError as err:
            raise SuspiciousOperation(err.message) from err

    def get_or_create_user(self, access_token, id_token, payload):
        user = super().get_or_create_user(access_token, id_token, payload)
        entitlement_backend = get_entitlements_backend()
        result = entitlement_backend.can_access(user)
        if not result["result"]:
            raise UserCannotAccessApp(result.get("message", "User does not have access to the app"))
        return user
