import { Router } from "express";
import { db } from "@workspace/db";
import { ads } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { logger } from "../lib/logger.js";
import { supabase } from "../lib/supabase.js";

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
    // Prefer Supabase HTTP API when configured (avoids direct Postgres TCP requirement)
    if (supabase) {
      const { data, error } = await supabase
        .from("ads")
        .select("id,title,image_base64,redirect_url,is_active,slide_order")
        .eq("is_active", true)
        .order("slide_order", { ascending: true });

      if (error) {
        logger.warn({ err: error }, "supabase get-ads error, falling back to empty array");
        return res.json([]);
      }
      // supabase returns plain objects; map to expected format
      return res.json((data || []).map((d: any) => ({
        id: d.id,
        title: d.title,
        image_url: d.image_base64,
        redirect_url: d.redirect_url ?? null,
        is_active: d.is_active,
        slide_order: d.slide_order,
      })));
    }

    const rows = await db
      .select()
      .from(ads)
      .where(eq(ads.is_active, true))
      .orderBy(asc(ads.slide_order));
    return res.json(rows.map(formatAd));
  } catch (err) {
    logger.error(err, "get-ads error");
    // If Supabase is available, attempt to fetch via HTTP as a last resort
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("ads")
          .select("id,title,image_base64,redirect_url,is_active,slide_order")
          .eq("is_active", true)
          .order("slide_order", { ascending: true });
        if (!error) return res.json((data || []).map((d: any) => ({
          id: d.id,
          title: d.title,
          image_url: d.image_base64,
          redirect_url: d.redirect_url ?? null,
          is_active: d.is_active,
          slide_order: d.slide_order,
        })));
      } catch (e) {
        logger.warn(e, "supabase fallback also failed");
      }
    }
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
