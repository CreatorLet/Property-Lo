---
name: Route scroll restoration
description: PropertyLo navigation should reset the document position on route changes.
---

PropertyLo uses a shared route-change effect to reset the document to the top whenever the Wouter location changes.

**Why:** Preserving the previous page's scroll position made new pages open near their footer, creating a confusing and unpolished navigation experience.

**How to apply:** Keep the scroll reset mounted inside the router, and avoid replacing it with a one-off reset in individual pages unless a route intentionally needs anchor behavior.