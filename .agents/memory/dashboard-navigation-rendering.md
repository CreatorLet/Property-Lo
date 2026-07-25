---
name: Dashboard navigation rendering
description: The rendering contract for the PropertyLo user dashboard navigation.
---

The user dashboard navigation must be explicitly rendered inside `DashboardLayout` after the page content. Defining the navigation component without mounting it leaves authenticated dashboard pages with no visible menu.

**Why:** A previous layout change moved the navigation out of the visible render tree, making the requested bottom menu appear absent even though its component and styles existed.

**How to apply:** When changing dashboard structure, verify both the navigation component definition and its rendered placement in the layout, including authenticated desktop and mobile states.