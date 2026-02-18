# Specification

## Summary
**Goal:** Make Admin/Admin admin login reliably authorize backend admin data access and keep admin pages working across refreshes.

**Planned changes:**
- Update the backend Motoko actor to add credential-based admin query entry points that accept (userId, password), validate at least "Admin"/"Admin", and return the same admin data as the current principal-protected admin queries.
- Ensure backend admin credential validation returns a clear Unauthorized-style error for invalid credentials, while leaving existing user flows (profile + checklist submission) unchanged and still permission-checked.
- Update the frontend admin data-fetching to use the stored admin session credentials (sessionStorage) to call the new credential-based backend admin methods for the Admin Dashboard and Admin Submission Detail.
- Make the admin login form credential handling robust to leading/trailing whitespace while keeping existing English required/invalid credential error messages.
- Improve admin page behavior across refresh/actor initialization: keep stored admin session intact, wait for actor readiness before fetching, and avoid misreporting backend unavailability as a credential problem.

**User-visible outcome:** Logging in with User ID "Admin" and Password "Admin" consistently loads /admin and /admin/submission/$entryId without Unauthorized errors or incorrect redirects, including after refresh, while invalid/missing credentials show clear English errors and normal user flows remain unchanged.
