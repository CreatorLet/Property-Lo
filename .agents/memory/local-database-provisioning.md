---
name: Local database provisioning
description: The development database setup required by the PropertyLo API.
---

The API uses the workspace's local PostgreSQL database for users, pending signups, listings, and related application data. A reachable database is not sufficient; the Drizzle schema must be pushed before auth or listing routes can serve requests.

**Why:** The preview can load while every database-backed route returns an internal server error when the tables have not been provisioned.

**How to apply:** After a fresh workspace setup or database reset, run the existing database schema push before starting functional auth/listing tests, then seed the admin account with the API package's seed command.