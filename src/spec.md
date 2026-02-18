# Specification

## Summary
**Goal:** Remove all Caffeine.ai footer branding from the app.

**Planned changes:**
- Update `frontend/src/components/AppLayout.tsx` to stop rendering the “Built with … caffeine.ai” text and remove the `https://caffeine.ai/` hyperlink from the footer.
- Adjust footer/layout spacing in `AppLayout.tsx` so the UI remains visually consistent after the branding is removed.

**User-visible outcome:** The app footer no longer shows any “Built with” text or caffeine.ai branding/link, and the layout does not have an awkward empty footer area.
