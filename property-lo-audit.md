# PropertyLo Website Audit

**Audit date:** 2026-07-22  
**Scope:** Uploaded archive `attached_assets/property-lov1_1784764688745.zip`, unpacked to `artifacts/property-lo`, plus its API, database schema, OpenAPI contract, and shared generated clients.

## Executive summary

PropertyLo has a coherent real-estate marketplace structure: public browsing, listing detail pages, favorites, user messaging, support chat, admin management, OTP signup, password reset, image uploads, and a contact form. The frontend has a consistent visual system and uses loading/empty states in the main browsing flows.

The archive is **not runnable as extracted**. The frontend workflow fails because Vite is not installed/linked, and the API workflow fails because five declared server dependencies cannot be resolved. No visual browser audit was possible until dependencies are installed.

The most important product and security issues are:

1. **Authentication tokens are stored in `localStorage`**, increasing the impact of any frontend XSS.
2. **Suspended users remain authorized when they already have a valid JWT**, because protected requests do not re-check current account status.
3. **Password requirements disagree** between the frontend and backend, so the UI accepts passwords that the API rejects.
4. **Several visible links point to routes that do not exist**, including “List a Property”, About, Terms, Privacy, and the user’s listing management page.
5. **Shortlets are presented throughout the UI but are not represented consistently in the database/API contract**, and the API accepts unchecked arbitrary listing values.
6. **Listing and image endpoints lack strong validation, bounded pagination, and strict upload controls.**

## Findings by priority

### High priority

#### H1 — The extracted site cannot start

**Evidence**

- `artifacts/property-lo` fails with `vite: not found`.
- `artifacts/api-server` fails to resolve `helmet`, `express-rate-limit`, `@supabase/supabase-js`, `bcryptjs`, and `jsonwebtoken`.
- The dependencies are declared in `artifacts/property-lo/package.json` and `artifacts/api-server/package.json`, but the required package links are absent in the extracted app packages.

**Impact**

The website and API cannot be previewed or deployed from the current extracted state. This also prevented a browser-level visual and interaction audit.

**Recommendation**

Install the workspace dependencies from the archived lockfile, then run the frontend and API typechecks/builds again. Treat any generated or lockfile changes as part of the import process.

#### H2 — Long-lived JWTs are stored in `localStorage`

**Evidence**

- `artifacts/property-lo/src/hooks/use-auth.ts:13-19, 27-31`
- `artifacts/property-lo/src/App.tsx:129-132`
- `artifacts/api-server/src/lib/auth.ts:12-17`

Tokens are stored under `propertylo_token`, used as a bearer token, and issued for 30 days.

**Impact**

Any successful script injection in the frontend can read the token and impersonate the user for up to 30 days. There is also no refresh/revocation mechanism.

**Recommendation**

Prefer an httpOnly, secure, same-site session cookie managed by the chosen authentication provider. If bearer tokens must remain, shorten their lifetime, add refresh/revocation support, and make sure all user-generated/displayed content has a strict XSS boundary.

#### H3 — Suspended accounts keep working until token expiry

**Evidence**

- `artifacts/api-server/src/middleware/requireAuth.ts:13-24` only verifies the JWT.
- `artifacts/api-server/src/routes/auth.ts:162-163, 193-195` checks suspension only during sign-in.

**Impact**

An admin can suspend a user, but that user’s existing 30-day token continues to authorize protected operations such as chats, favorites, profile changes, and listing changes.

**Recommendation**

During authentication middleware, load the current user status or use a revocation/version claim. Reject suspended/deleted users on every protected request. Add tests for “suspend an already signed-in user”.

#### H4 — Password rules are inconsistent

**Evidence**

- Signup UI allows 6 characters: `artifacts/property-lo/src/pages/signup.tsx:12-16`
- Signup API requires 8 characters: `artifacts/api-server/src/routes/auth.ts:37-38`
- Reset UI allows 6 characters: `artifacts/property-lo/src/pages/reset-password.tsx:12-18`
- Reset API requires 8 characters: `artifacts/api-server/src/routes/auth.ts:251-253`

**Impact**

Users can complete client-side validation and then receive a server error after submitting.

**Recommendation**

Define the password policy once and use the same minimum in the UI, OpenAPI schema, and server validation. Add confirmation and strength guidance consistently to signup, reset, and password-change forms.

#### H5 — OTP delivery failures are reported as success

**Evidence**

- `artifacts/api-server/src/lib/email.ts:7-10` starts a fetch without awaiting it and ignores all errors.
- Signup and resend return success immediately after calling it: `artifacts/api-server/src/routes/auth.ts:58-60, 140-142`.

**Impact**

The UI tells users to check their email even when delivery failed. The OTP is sent through an external URL query string, which also creates avoidable exposure in service/proxy logs.

**Recommendation**

Use a managed email integration/provider, await delivery, handle failures explicitly, and avoid placing verification codes in URLs. Keep OTP values hashed at rest, limit attempts, and expire/delete them after use.

### Medium priority

#### M1 — Multiple visible links route to missing pages

**Evidence**

- `artifacts/property-lo/src/components/layout.tsx:54-58, 162-165` links to `/dashboard/my-listings`.
- `artifacts/property-lo/src/components/layout.tsx:219-222` links to `/about`, `/terms`, and `/privacy`.
- `artifacts/property-lo/src/App.tsx:78-121` has no routes for those paths.

**Impact**

Users can click prominent navigation and footer links and land on the generic not-found page. The “List a Property” call to action is especially problematic because it implies a core capability that is not available to regular users.

**Recommendation**

Either implement the pages/routes or remove/replace the links. Add a route inventory test that compares every internal link with a registered route.

#### M2 — Shortlet support is inconsistent and unchecked

**Evidence**

- The UI offers shortlet filtering and creation: `artifacts/property-lo/src/pages/listings.tsx:75-79`, `artifacts/property-lo/src/pages/admin/create-listing.tsx:267-271`.
- The database schema declares the TypeScript purpose values as only `sale` and `rent`: `lib/db/src/schema/listings.ts:8-10`.
- Listing routes cast user input directly into the database model without runtime enum validation: `artifacts/api-server/src/routes/listings.ts:120-148, 169-176`.

**Impact**

The product communicates a supported listing type that the source-of-truth model does not consistently define. Direct API callers can also persist arbitrary `type`, `purpose`, and `status` values.

**Recommendation**

Choose one supported domain model, update the DB/API/OpenAPI/UI together, and validate all enum fields at the server boundary. If shortlets are supported, add them explicitly to the contract and ensure stats, admin filters, price units, and analytics handle them.

#### M3 — Public listing reads are unbounded

**Evidence**

- `artifacts/api-server/src/routes/listings.ts:37-64` applies `limit` only when supplied and otherwise returns every matching listing.
- The supplied `limit` is not capped or validated.

**Impact**

As listings and embedded/base64 images grow, a public request can create very large database and response payloads. A caller can also request an excessive limit or malformed numeric value.

**Recommendation**

Add server-enforced maximum page size, cursor/offset pagination, total/next-page metadata, and stable ordering. Never rely on the client to provide a safe limit.

#### M4 — Image uploads are insufficiently constrained

**Evidence**

- The API accepts up to 50 MB JSON bodies for listings: `artifacts/api-server/src/app.ts:79-88`.
- `processImages` accepts any `data:` URI and passes non-data strings through: `artifacts/api-server/src/lib/storage.ts:13-25, 43-53`.
- There is no server-side image count, decoded byte, MIME allowlist, or content validation in `artifacts/api-server/src/routes/listings.ts:120-148`.
- If storage is unavailable, the original base64 is retained in the database: `artifacts/api-server/src/lib/storage.ts:4-6, 27-29`.

**Impact**

Large or non-image payloads can inflate database rows and API responses. Storage failures silently degrade into database-stored base64, which can create a serious performance problem.

**Recommendation**

Validate MIME types and decoded size server-side, cap image count and total request size, decode and inspect image content, reject unsupported formats, and fail clearly when object storage is unavailable instead of silently persisting huge base64 values.

#### M5 — Direct listing contact details are publicly exposed

**Evidence**

- `formatListing` returns `contact_email` and `contact_phone`: `artifacts/api-server/src/routes/listings.ts:12-31`.
- Public listing detail renders both values to unauthenticated visitors: `artifacts/property-lo/src/pages/listing-detail.tsx:273-292`.

**Impact**

Agents/landlords may receive spam or have contact information indexed/scraped. This may be intended, but it should be an explicit privacy decision.

**Recommendation**

Prefer an authenticated in-app contact flow or masked/proxied contact details. If direct exposure is intentional, document consent and add abuse controls.

#### M6 — Admin listing status model is internally inconsistent

**Evidence**

- The UI filters for `pending` and `rejected`: `artifacts/property-lo/src/pages/admin/listings.tsx:50-54`.
- The database source model lists `active`, `inactive`, and `sold`: `lib/db/src/schema/listings.ts:16-18`.
- The listing update route accepts arbitrary status strings: `artifacts/api-server/src/routes/listings.ts:169-183`.

**Impact**

Approval/rejection workflows are not represented in a shared validated contract. Invalid status values can be stored and behavior can diverge between admin, public, and analytics views.

**Recommendation**

Define the complete status lifecycle once and validate it in the API and database. Add transition rules if “pending → active/rejected” is intended.

### Low priority

#### L1 — The listing gallery counter does not react to slides

**Evidence**

- `artifacts/property-lo/src/pages/listing-detail.tsx:30` creates `selectedIndex`, but it is never updated or used.
- The counter reads `emblaApi.selectedScrollSnap()` directly during render at line 183 without subscribing to carousel selection changes.

**Impact**

After swiping, the displayed “current image / total” indicator may remain stale.

**Recommendation**

Subscribe to Embla’s `select` event, update state, and clean up the listener on unmount. Add previous/next controls or accessible thumbnail navigation.

#### L2 — Several icon-only controls lack accessible names

**Evidence**

- Mobile menu toggle: `artifacts/property-lo/src/components/layout.tsx:125-128`
- Share and favorite controls: `artifacts/property-lo/src/pages/listing-detail.tsx:130-135`
- Remove image control: `artifacts/property-lo/src/pages/admin/create-listing.tsx:163-169`

**Impact**

Screen-reader users may not know what these controls do. The favorite/share actions also do not expose their state through an accessible label.

**Recommendation**

Add `aria-label`, stateful labels such as “Remove from favorites”, and visible focus states. Keep tooltips as a supplement, not the only accessible name.

#### L3 — Favorite state is not invalidated on the detail page

**Evidence**

- `artifacts/property-lo/src/pages/listing-detail.tsx:61-74` mutates favorites but does not invalidate or update the favorites query.

**Impact**

The toast confirms the action, but the heart state can remain visually stale until another fetch occurs.

**Recommendation**

Invalidate `getGetFavoritesQueryKey()` or optimistically update the query after add/remove.

#### L4 — Fallback numbers look like real data

**Evidence**

- `artifacts/property-lo/src/pages/home.tsx:107-120` renders values such as `1,000+`, `500+`, `300+`, and `36` when the stats query is not yet available.

**Impact**

Users may interpret placeholder values as verified platform statistics, including during an API outage.

**Recommendation**

Use skeletons while loading and an explicit unavailable state on error. Only show marketing numbers when they are intentionally static and clearly sourced.

#### L5 — Error handling is inconsistent

**Evidence**

- `artifacts/property-lo/src/hooks/use-auth.ts:20-22` uses `console.error` for a malformed local-storage user.
- `artifacts/property-lo/src/pages/listing-detail.tsx:77-86` logs share failures but does not show a user-facing error.

**Impact**

Users may receive no feedback when a share/copy action fails, and production diagnostics are not centralized.

**Recommendation**

Use a consistent error boundary/toast strategy and report actionable errors through the application’s logging/observability path.

## Positive observations

- The API applies Helmet, CORS checks, rate limiting, request logging, and JSON body limits in `artifacts/api-server/src/app.ts`.
- Admin endpoints are protected at the router level with `router.use(requireAdmin)` in `artifacts/api-server/src/routes/admin.ts:11-14`.
- Listing edit/delete handlers include ownership checks for non-admin users in `artifacts/api-server/src/routes/listings.ts:158-167, 195-204`.
- Password hashes use bcrypt with cost factor 12 in `artifacts/api-server/src/routes/auth.ts`.
- Main public pages include loading skeletons, empty states, and image alt text.
- The contact form uses client-side schema validation and a clear success/error toast flow.

## Recommended remediation order

1. Restore/install dependencies and make both workflows start.
2. Resolve authentication/session risks, especially token storage and suspended-token behavior.
3. Align password, listing purpose, and listing status contracts across UI, API, OpenAPI, and DB.
4. Implement or remove missing routes and the “List a Property” flow.
5. Add server-side request/schema/image validation and bounded pagination.
6. Fix gallery state, favorite cache invalidation, accessible names, and loading/error states.
7. Run a browser audit across desktop and mobile after the site is runnable, then add route and API integration tests for the critical flows.