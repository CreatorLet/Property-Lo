import { randomUUID } from "crypto";
import { Router } from "express";
import { db } from "@workspace/db";
import { listings } from "@workspace/db";
import { eq, and, ilike, or, sql, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middleware/requireAuth.js";
import { processImages } from "../lib/storage.js";
import { logger } from "../lib/logger.js";

const router = Router();

export function formatListing(l: typeof listings.$inferSelect) {
  return {
    id: l.id,
    title: l.title,
    description: l.description,
    type: l.type,
    purpose: l.purpose,
    price: parseFloat(l.price as string),
    location: l.location,
    state: l.state,
    size: l.size ?? null,
    bedrooms: l.bedrooms ?? null,
    bathrooms: l.bathrooms ?? null,
    images: (l.images as string[]) || [],
    status: l.status,
    contact_email: l.contact_email ?? null,
    contact_phone: l.contact_phone ?? null,
    user_id: l.user_id ?? null,
    created_at: l.created_at.toISOString(),
  };
}

// GET /listings
router.get("/", async (req, res) => {
  try {
    const { type, purpose, location, search, status, limit } = req.query as Record<string, string>;

    const conditions: ReturnType<typeof eq>[] = [];
    if (type) conditions.push(eq(listings.type, type as any));
    if (purpose) conditions.push(eq(listings.purpose, purpose as any));
    if (location) conditions.push(ilike(listings.location, `%${location}%`));
    if (status) conditions.push(eq(listings.status, status as any));
    if (search) {
      conditions.push(
        or(
          ilike(listings.title, `%${search}%`),
          ilike(listings.location, `%${search}%`),
          ilike(listings.state, `%${search}%`),
          ilike(listings.description, `%${search}%`),
        ) as any,
      );
    }

    const query = db
      .select()
      .from(listings)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(listings.created_at))
      .$dynamic();

    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    const rows = await (parsedLimit && !isNaN(parsedLimit) ? query.limit(parsedLimit) : query);
    return res.json({ listings: rows.map(formatListing) });
  } catch (err) {
    logger.error(err, "get-listings error");
    return res.status(500).json({ message: "Internal server error" });
  }
});

// GET /listings/stats — must come before /:id
router.get("/stats", async (_req, res) => {
  try {
    const [activeResult, housesResult, apartmentsResult, landsResult, locationRows] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(listings).where(eq(listings.status, "active")),
      db.select({ count: sql<number>`count(*)::int` })
        .from(listings)
        .where(and(eq(listings.status, "active"), or(eq(listings.type, "house"), eq(listings.type, "commercial")) as any)),
      db.select({ count: sql<number>`count(*)::int` })
        .from(listings)
        .where(and(eq(listings.status, "active"), eq(listings.type, "apartment"))),
      db.select({ count: sql<number>`count(*)::int` })
        .from(listings)
        .where(and(eq(listings.status, "active"), eq(listings.type, "land"))),
      db.selectDistinct({ location: listings.location })
        .from(listings)
        .where(eq(listings.status, "active"))
        .orderBy(listings.location)
        .limit(50),
    ]);

    return res.json({
      active: activeResult[0]?.count ?? 0,
      houses: housesResult[0]?.count ?? 0,
      apartments: apartmentsResult[0]?.count ?? 0,
      lands: landsResult[0]?.count ?? 0,
      locations: locationRows.map((r) => r.location),
    });
  } catch (err) {
    logger.error(err, "get-stats error");
    return res.status(500).json({ message: "Internal server error" });
  }
});

// GET /listings/:id
router.get("/:id", async (req, res) => {
  try {
    const [listing] = await db.select().from(listings).where(eq(listings.id, req.params.id)).limit(1);
    if (!listing) return res.status(404).json({ message: "Listing not found" });
    return res.json(formatListing(listing));
  } catch (err) {
    logger.error(err, "get-listing error");
    return res.status(500).json({ message: "Internal server error" });
  }
});

// POST /listings
router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { title, description, type, purpose, price, location, state, size, bedrooms, bathrooms, images, images_base64, status, contact_email, contact_phone } = req.body;

    if (!title || !description || !type || !purpose || !price || !location || !state) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const listingId = randomUUID();
    const storedImages = await processImages(images_base64 || images || [], listingId);

    const [listing] = await db
      .insert(listings)
      .values({
        id: listingId,
        title,
        description,
        type,
        purpose,
        price: String(price),
        location,
        state,
        size: size || null,
        bedrooms: bedrooms != null ? Number(bedrooms) : null,
        bathrooms: bathrooms != null ? Number(bathrooms) : null,
        images: storedImages,
        status: status || "active",
        contact_email: contact_email || null,
        contact_phone: contact_phone || null,
        user_id: req.user!.id,
      })
      .returning();

    return res.status(201).json(formatListing(listing));
  } catch (err) {
    logger.error(err, "create-listing error");
    return res.status(500).json({ message: "Internal server error" });
  }
});

// PATCH /listings/:id  — FIX: ownership check (user can only edit own, admin can edit any)
router.patch("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [existing] = await db.select().from(listings).where(eq(listings.id, req.params.id)).limit(1);
    if (!existing) return res.status(404).json({ message: "Listing not found" });

    // Only the listing owner or an admin can edit
    if (req.user!.role !== "admin" && existing.user_id !== req.user!.id) {
      return res.status(403).json({ message: "You don't have permission to edit this listing" });
    }

    const updates: Record<string, unknown> = {};
    const textFields = ["title", "description", "type", "purpose", "location", "state", "size", "status", "contact_email", "contact_phone"];
    for (const f of textFields) {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    }
    if (req.body.price !== undefined) updates.price = String(req.body.price);
    if (req.body.bedrooms !== undefined) updates.bedrooms = req.body.bedrooms != null ? Number(req.body.bedrooms) : null;
    if (req.body.bathrooms !== undefined) updates.bathrooms = req.body.bathrooms != null ? Number(req.body.bathrooms) : null;
    if (req.body.images !== undefined) {
      updates.images = await processImages(req.body.images, req.params.id);
    }

    const [updated] = await db
      .update(listings)
      .set(updates as any)
      .where(eq(listings.id, req.params.id))
      .returning();

    if (!updated) return res.status(404).json({ message: "Listing not found" });
    return res.json(formatListing(updated));
  } catch (err) {
    logger.error(err, "update-listing error");
    return res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE /listings/:id — FIX: ownership check
router.delete("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [existing] = await db.select().from(listings).where(eq(listings.id, req.params.id)).limit(1);
    if (!existing) return res.status(404).json({ message: "Listing not found" });

    // Only the listing owner or an admin can delete
    if (req.user!.role !== "admin" && existing.user_id !== req.user!.id) {
      return res.status(403).json({ message: "You don't have permission to delete this listing" });
    }

    await db.delete(listings).where(eq(listings.id, req.params.id));
    return res.json({ message: "Listing deleted successfully" });
  } catch (err) {
    logger.error(err, "delete-listing error");
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
