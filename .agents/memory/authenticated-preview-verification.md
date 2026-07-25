---
name: Authenticated preview verification
description: How to interpret dashboard screenshots from the PropertyLo preview.
---

The dashboard routes redirect unauthenticated preview sessions to the sign-in page. A screenshot of `/dashboard` alone does not verify dashboard-only UI unless the browser session has a valid stored user token.

**Why:** Static preview captures do not inherit the local API test session, so authenticated dashboard changes can be correct while screenshots still show sign-in.

**How to apply:** Verify dashboard-only changes through code/build checks and an authenticated browser session when available; do not treat an unauthenticated `/dashboard` screenshot as evidence that the dashboard UI is absent.