# Specification

## Summary
**Goal:** Add simple client-side filters to the Admin Dashboard submissions table so admins can narrow results by store name and submitted date without changing any other dashboard behavior.

**Planned changes:**
- Add Store Name and Date filter controls above the submissions table in `frontend/src/pages/AdminDashboard.tsx` (English labels).
- Implement client-side filtering of the already-loaded submissions list: case-insensitive match on `entry.storeName`, and date match for entries whose timestamp falls on the selected local calendar date.
- Add a clear/reset action to remove filters and return to the original newest-first list as currently displayed.

**User-visible outcome:** Admins can filter the submissions table by store name and/or a specific submitted date, and can clear filters to see the full unfiltered list exactly as before.
