---
name: Favorites response shape
description: The API/client contract used by PropertyLo favorites screens.
---

The favorites GET endpoint returns `Listing[]` directly. Consumers must use the array itself (`favorites.length`, `favorites.map(...)`) rather than reading `favorites.listings`.

**Why:** The dashboard previously treated the response as an envelope, so saved listings appeared missing even though the API returned them.

**How to apply:** When changing favorites API or UI code, verify the generated client return type and update every affected dashboard/detail cache consumer together.