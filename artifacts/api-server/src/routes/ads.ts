import { Router } from "express";
import { db } from "@workspace/db";
import { ads } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { logger } from "../lib/logger.js";

const router = Router();

export function formatAd(a: typeof ads.$inferSelect) {
  return {
    id: a.id,
    title: a.title,
    image_url: a.image_base64, // may be a Supabase URL or base64 depending on config
    redirect_url: a.redirect_url ?? null,
    is_active: a.is_active,
    slide_order: a.slide_order,
  };
}

// GET /ads (public — only active ads)
router.get("/", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(ads)
      .where(eq(ads.is_active, true))
      .orderBy(asc(ads.slide_order));
    return res.json(rows.map(formatAd));
  } catch (err) {
    logger.error(err, "get-ads error");
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
