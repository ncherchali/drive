"""Minimal in-process circuit breaker for outbound ports (E4.1).

After `failure_threshold` consecutive failures the breaker OPENS and fast-fails
calls for `reset_timeout` seconds, then allows a single trial (half-open). A
success closes it. State is per-instance (one per worker via the cached
provider) — a best-effort breaker; a cluster-wide one belongs in the infra layer.
"""

import time


class CircuitOpenError(Exception):
    """Raised when the breaker is open (fast-fail, no downstream call)."""


class CircuitBreaker:
    """Wrap calls to a flaky dependency with a consecutive-failure breaker."""

    def __init__(self, failure_threshold=5, reset_timeout=30.0):
        self.failure_threshold = failure_threshold
        self.reset_timeout = reset_timeout
        self._failures = 0
        self._opened_at = None

    def call(self, func):
        """Run `func`; fast-fail while open; trip after enough failures."""
        if self._opened_at is not None:
            if time.monotonic() - self._opened_at < self.reset_timeout:
                raise CircuitOpenError("Circuit is open.")
            # Reset timeout elapsed → allow one half-open trial below.

        try:
            result = func()
        except Exception:
            self._failures += 1
            if self._failures >= self.failure_threshold:
                self._opened_at = time.monotonic()
            raise

        self._failures = 0
        self._opened_at = None
        return result
