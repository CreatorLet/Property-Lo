---
name: Shared layout import checks
description: A caution for editing PropertyLo's shared navbar and footer component.
---

When removing icon imports from the shared layout, verify every remaining reference in both Navbar and Footer before restarting the workflow.

**Why:** Navbar-only cleanup can accidentally remove an icon still used by the Footer, causing a runtime crash on every route even when the frontend build passes.

**How to apply:** After changing `layout.tsx` imports, run a symbol search across the whole file and capture at least one public preview before delivery.