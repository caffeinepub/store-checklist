# Specification

## Summary
**Goal:** Restore stable frontend-to-backend connectivity and remove the reappearing caffeine.ai footer attribution.

**Planned changes:**
- Fix the frontend connection flow so it can reliably create the backend actor, reach a stable connected state, and successfully call the backend health endpoint (ping/pong).
- Restore the post–Internet Identity login flow so navigation to `/checklist` works and the caller profile query loads without connection failures.
- Add/adjust a clear, user-friendly Retry-based error state for cases where the backend is actually unreachable (no full page reload required).
- Remove the “Built with caffeine.ai” attribution from the footer across all routes and ensure no awkward leftover spacing.
- Ensure any user-visible backend connectivity errors are short, user-friendly English messages (no raw stack traces in the UI).

**User-visible outcome:** Users can log in with Internet Identity, the app connects to the backend without a persistent “Connecting…” state, `/checklist` loads successfully, backend outages show a clear English error with a Retry option, and the footer no longer shows any caffeine.ai attribution.
