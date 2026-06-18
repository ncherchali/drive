"""Security-hardening middleware (H1.5).

Adds response headers Django's SecurityMiddleware does not set natively:
Permissions-Policy and an opt-in Content-Security-Policy. (Referrer-Policy,
X-Content-Type-Options and Cross-Origin-Opener-Policy are handled by Django via
the SECURE_* settings.) Values are read per request so `override_settings` works
in tests; headers already present on a response are left untouched (`setdefault`).
"""

from django.conf import settings


class SecurityHeadersMiddleware:
    """Set extra security headers on every response."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        permissions_policy = getattr(settings, "SECURITY_PERMISSIONS_POLICY", "")
        if permissions_policy:
            response.setdefault("Permissions-Policy", permissions_policy)

        csp = getattr(settings, "SECURITY_CONTENT_SECURITY_POLICY", "")
        if csp:
            response.setdefault("Content-Security-Policy", csp)

        return response
