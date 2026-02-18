# Specification

## Summary
**Goal:** Fix the admin authentication/authorization flow so an admin can log in with Internet Identity and successfully access the Admin Dashboard without permission errors, while keeping admin data protected fromanalysis.

**Planned changes.text:**
- Align backend admin authorization checks with a reliable admin bootstrap/assignment mechanism so at least one admin principal canfinal be established and verified.
- Ensure backend exposes a clear “is current caller an admin” query that matches the authorization enforced by admin-only methods.
- Update frontend admin login so admin access is tied to the authenticated Internet Identity principal (not sessionStorage-only credentials).
- Gate /admin routes and admin data queries until an authenticated session is active and admin authorization has been confirmed.
- Improve Admin Dashboard error handling to distinguish permission vs connectivity issues, provide clear recovery actions, and ensure Retry retries the correct step without looping.

**User-visible outcome:** After signing in with Internet Identity as an authorized admin, the Admin Dashboard loads submissions successfully; non-admin users see a clear message indicating lack of permission and can return to login/re-authenticate without exposing admin-only data.
