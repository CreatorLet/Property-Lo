import { Router } from "express";
import { db } from "@workspace/db";
import { favorites, listings } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middleware/requireAuth.js";
import { formatListing } from "./listings.js";
import { logger } from "../lib/logger.js";

const router = Router();

// GET /favorites
router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const favRows = await db
      .select({ listing: listings })
      .from(favorites)
      .innerJoin(listings, eq(favorites.listing_id, listings.id))
      .where(eq(favorites.user_id, req.user!.id));

    return res.json(favRows.map((r) => formatListing(r.listing)));
  } catch (err) {
    logger.error(err, "get-favorites error");
    return res.status(500).json({ message: "Internal server error" });
  }
});

// POST /favorites
router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { listing_id } = req.body;
    if (!listing_id) return res.status(400).json({ message: "listing_id required" });

    await db
      .insert(favorites)
      .values({ user_id: req.user!.id, listing_id })
      .onConflictDoNothing();

    return res.json({ message: "Added to favorites" });
  } catch (err) {
    logger.error(err, "add-favorite error");
    return res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE /favorites/:listingId
router.delete("/:listingId", requireAuth, async (req: AuthRequest, res) => {
  try {
    await db
      .delete(favorites)
      .where(and(eq(favorites.user_id, req.user!.id), eq(favorites.listing_id, req.params.listingId)));

    return res.json({ message: "Removed from favorites" });
  } catch (err) {
    logger.error(err, "remove-favorite error");
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
