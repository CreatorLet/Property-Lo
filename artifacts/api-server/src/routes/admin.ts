import { Router } from "express";
import { db } from "@workspace/db";
import { users, listings, chats, chatMessages, supportChats, supportMessages, ads, contactMessages } from "@workspace/db";
import { eq, and, ilike, or, desc, asc, sql } from "drizzle-orm";
import { requireAdmin } from "../middleware/requireAuth.js";
import { formatListing } from "./listings.js";
import { formatAd } from "./ads.js";
import { formatSupportMessage } from "./support.js";
import { logger } from "../lib/logger.js";

const router = Router();

router.use(requireAdmin);

function formatUser(u: typeof users.$inferSelect) {
  return {
    id: u.id,
    email: u.email,
    full_name: u.full_name,
    phone: u.phone ?? null,
    role: u.role,
    status: u.status,
    avatar_base64: u.avatar_base64 ?? null,
    created_at: u.created_at.toISOString(),
  };
}

function formatMessage(m: typeof chatMessages.$inferSelect) {
  return {
    id: m.id,
    content: m.content,
    is_admin: m.is_admin === "true" || (m.is_admin as any) === true,
    created_at: m.created_at.toISOString(),
  };
}

// ── Stats ────────────────────────────────────────────────────────────────────

router.get("/stats", async (_req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsersResult,
      totalListingsResult,
      totalChatsResult,
      totalDealsResult,
      newUsersResult,
      newListingsResult,
      recentUsersRows,
      recentListingsRows,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(users).where(eq(users.role, "user")),
      db.select({ count: sql<number>`count(*)::int` }).from(listings),
      db.select({ count: sql<number>`count(*)::int` }).from(chats),
      db.select({ count: sql<number>`count(*)::int` }).from(chats).where(or(eq(chats.label, "sold"), eq(chats.label, "successful")) as any),
      db.select({ count: sql<number>`count(*)::int` }).from(users).where(and(eq(users.role, "user"), sql`${users.created_at} >= ${startOfMonth}`)),
      db.select({ count: sql<number>`count(*)::int` }).from(listings).where(sql`${listings.created_at} >= ${startOfMonth}`),
      db.select().from(users).where(eq(users.role, "user")).orderBy(desc(users.created_at)).limit(5),
      db.select().from(listings).orderBy(desc(listings.created_at)).limit(5),
    ]);

    return res.json({
      total_users: totalUsersResult[0]?.count ?? 0,
      total_listings: totalListingsResult[0]?.count ?? 0,
      total_chats: totalChatsResult[0]?.count ?? 0,
      total_deals: totalDealsResult[0]?.count ?? 0,
      new_users_this_month: newUsersResult[0]?.count ?? 0,
      new_listings_this_month: newListingsResult[0]?.count ?? 0,
      recent_users: recentUsersRows.map(formatUser),
      recent_listings: recentListingsRows.map(formatListing),
    });
  } catch (err) {
    logger.error(err, "admin-stats error");
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/analytics", async (_req, res) => {
  try {
    const [labelBreakdown, locationCounts, chattedHousesSale, chattedHousesRent, chattedLands] = await Promise.all([
      db.select({ label: chats.label, count: sql<number>`count(*)::int` })
        .from(chats).groupBy(chats.label).orderBy(desc(sql`count(*)`)),
      db.select({ location: listings.location, count: sql<number>`count(*)::int` })
        .from(listings).where(eq(listings.status, "active"))
        .groupBy(listings.location).orderBy(desc(sql`count(*)`)).limit(10),
      db.select({ title: listings.title, chat_count: sql<number>`count(${chats.id})::int` })
        .from(listings).innerJoin(chats, eq(chats.listing_id, listings.id))
        .where(and(or(eq(listings.type, "house"), eq(listings.type, "apartment")) as any, eq(listings.purpose, "sale")))
        .groupBy(listings.id, listings.title).orderBy(desc(sql`count(${chats.id})`)).limit(5),
      db.select({ title: listings.title, chat_count: sql<number>`count(${chats.id})::int` })
        .from(listings).innerJoin(chats, eq(chats.listing_id, listings.id))
        .where(and(or(eq(listings.type, "house"), eq(listings.type, "apartment")) as any, eq(listings.purpose, "rent")))
        .groupBy(listings.id, listings.title).orderBy(desc(sql<number>`count(${chats.id})`)).limit(5),
      db.select({ title: listings.title, chat_count: sql<number>`count(${chats.id})::int` })
        .from(listings).innerJoin(chats, eq(chats.listing_id, listings.id))
        .where(eq(listings.type, "land"))
        .groupBy(listings.id, listings.title).orderBy(desc(sql`count(${chats.id})`)).limit(5),
    ]);

    return res.json({
      chat_label_breakdown: labelBreakdown,
      locations_with_most_listings: locationCounts,
      most_chatted_houses_sale: chattedHousesSale,
      most_chatted_houses_rent: chattedHousesRent,
      most_chatted_lands: chattedLands,
    });
  } catch (err) {
    logger.error(err, "admin-analytics error");
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ── Listings ─────────────────────────────────────────────────────────────────

router.get("/listings", async (req, res) => {
  try {
    const { type, status, page = "1", limit = "50" } = req.query as Record<string, string>;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const conditions = [];
    if (type) conditions.push(eq(listings.type, type as any));
    if (status) conditions.push(eq(listings.status, status as any));

    const rows = await db
      .select()
      .from(listings)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(listings.created_at))
      .limit(parseInt(limit, 10))
      .offset(offset);

    return res.json({ listings: rows.map(formatListing), total: rows.length });
  } catch (err) {
    logger.error(err, "admin-listings error");
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ── Users ─────────────────────────────────────────────────────────────────────

router.get("/users", async (req, res) => {
  try {
    const { search, status, page = "1", limit = "50" } = req.query as Record<string, string>;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const conditions = [eq(users.role, "user")];
    if (status) conditions.push(eq(users.status, status as any));
    if (search) {
      conditions.push(
        or(ilike(users.full_name, `%${search}%`), ilike(users.email, `%${search}%`)) as any,
      );
    }

    const rows = await db
      .select()
      .from(users)
      .where(and(...conditions))
      .orderBy(desc(users.created_at))
      .limit(parseInt(limit, 10))
      .offset(offset);

    return res.json(rows.map(formatUser));
  } catch (err) {
    logger.error(err, "admin-users error");
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/users/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["active", "suspended"].includes(status)) {
      return res.status(400).json({ message: "status must be active or suspended" });
    }
    const [updated] = await db
      .update(users)
      .set({ status })
      .where(eq(users.id, req.params.id))
      .returning();
    if (!updated) return res.status(404).json({ message: "User not found" });
    return res.json(formatUser(updated));
  } catch (err) {
    logger.error(err, "update-user-status error");
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/users/:id", async (req, res) => {
  try {
    await db.delete(users).where(eq(users.id, req.params.id));
    return res.json({ message: "User deleted" });
  } catch (err) {
    logger.error(err, "delete-user error");
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ── Chats (CRM) ──────────────────────────────────────────────────────────────

router.get("/chats", async (req, res) => {
  try {
    const { label, page = "1", limit = "50" } = req.query as Record<string, string>;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const conditions = label ? [eq(chats.label, label as any)] : [];

    const rows = await db
      .select({ chat: chats, user_name: users.full_name })
      .from(chats)
      .leftJoin(users, eq(chats.user_id, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(chats.updated_at))
      .limit(parseInt(limit, 10))
      .offset(offset);

    return res.json(
      rows.map((r) => ({
        id: r.chat.id,
        listing_id: r.chat.listing_id,
        listing_title: r.chat.listing_title,
        label: r.chat.label,
        last_message: r.chat.last_message ?? null,
        user_unread: r.chat.user_unread,
        admin_unread: r.chat.admin_unread,
        updated_at: r.chat.updated_at.toISOString(),
        user_name: r.user_name ?? null,
      })),
    );
  } catch (err) {
    logger.error(err, "admin-get-chats error");
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/chats/:id/messages", async (req, res) => {
  try {
    await db.update(chats).set({ admin_unread: 0 }).where(eq(chats.id, req.params.id));

    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.chat_id, req.params.id))
      .orderBy(chatMessages.created_at);

    return res.json(messages.map(formatMessage));
  } catch (err) {
    logger.error(err, "admin-get-chat-messages error");
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/chats/:id/messages", async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: "Content required" });

    const [chat] = await db.select().from(chats).where(eq(chats.id, req.params.id)).limit(1);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    const [msg] = await db
      .insert(chatMessages)
      .values({ chat_id: req.params.id, content: content.trim(), is_admin: "true" })
      .returning();

    await db
      .update(chats)
      .set({
        last_message: content.trim(),
        user_unread: sql`${chats.user_unread} + 1`,
        updated_at: new Date(),
      })
      .where(eq(chats.id, req.params.id));

    return res.status(201).json(formatMessage(msg));
  } catch (err) {
    logger.error(err, "admin-send-message error");
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/chats/:id/label", async (req, res) => {
  try {
    const { label } = req.body;
    const validLabels = ["new", "ongoing", "sold", "successful", "closed"];
    if (!validLabels.includes(label)) {
      return res.status(400).json({ message: `label must be one of: ${validLabels.join(", ")}` });
    }
    await db.update(chats).set({ label }).where(eq(chats.id, req.params.id));
    return res.json({ message: "Label updated" });
  } catch (err) {
    logger.error(err, "update-label error");
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ── Support ──────────────────────────────────────────────────────────────────

router.get("/support/chats", async (req, res) => {
  try {
    const { page = "1", limit = "50" } = req.query as Record<string, string>;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const rows = await db
      .select({ chat: supportChats, user_name: users.full_name })
      .from(supportChats)
      .leftJoin(users, eq(supportChats.user_id, users.id))
      .orderBy(desc(supportChats.updated_at))
      .limit(parseInt(limit, 10))
      .offset(offset);

    return res.json(
      rows.map((r) => ({
        id: r.chat.id,
        user_name: r.user_name ?? null,
        last_message: r.chat.last_message ?? null,
        user_unread: r.chat.user_unread,
        admin_unread: r.chat.admin_unread,
        updated_at: r.chat.updated_at.toISOString(),
      })),
    );
  } catch (err) {
    logger.error(err, "admin-get-support-chats error");
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/support/chats/:chatId/messages", async (req, res) => {
  try {
    await db.update(supportChats).set({ admin_unread: 0 }).where(eq(supportChats.id, req.params.chatId));

    const messages = await db
      .select()
      .from(supportMessages)
      .where(eq(supportMessages.chat_id, req.params.chatId))
      .orderBy(supportMessages.created_at);

    return res.json(messages.map(formatSupportMessage));
  } catch (err) {
    logger.error(err, "admin-get-support-messages error");
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/support/chats/:chatId/messages", async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: "Content required" });

    const [chat] = await db.select().from(supportChats).where(eq(supportChats.id, req.params.chatId)).limit(1);
    if (!chat) return res.status(404).json({ message: "Support chat not found" });

    const [msg] = await db
      .insert(supportMessages)
      .values({ chat_id: req.params.chatId, content: content.trim(), is_from_user: false })
      .returning();

    await db
      .update(supportChats)
      .set({
        last_message: content.trim(),
        user_unread: sql`${supportChats.user_unread} + 1`,
        updated_at: new Date(),
      })
      .where(eq(supportChats.id, req.params.chatId));

    return res.status(201).json(formatSupportMessage(msg));
  } catch (err) {
    logger.error(err, "admin-send-support-message error");
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ── Ads ──────────────────────────────────────────────────────────────────────

router.get("/ads", async (_req, res) => {
  try {
    const rows = await db.select().from(ads).orderBy(asc(ads.slide_order));
    return res.json(rows.map(formatAd));
  } catch (err) {
    logger.error(err, "admin-get-ads error");
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/ads", async (req, res) => {
  try {
    const { title, image_base64, redirect_url, slide_order, is_active } = req.body;
    if (!image_base64) return res.status(400).json({ message: "image_base64 required" });

    const [ad] = await db
      .insert(ads)
      .values({ title: title || "", image_base64, redirect_url: redirect_url || null, slide_order: slide_order ?? 0, is_active: is_active ?? true })
      .returning();

    return res.status(201).json(formatAd(ad));
  } catch (err) {
    logger.error(err, "create-ad error");
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/ads/:id", async (req, res) => {
  try {
    const updates: Partial<typeof ads.$inferInsert> = {};
    for (const f of ["title", "image_base64", "redirect_url", "slide_order", "is_active"] as const) {
      if (req.body[f] !== undefined) (updates as any)[f] = req.body[f];
    }

    const [updated] = await db.update(ads).set(updates).where(eq(ads.id, req.params.id)).returning();
    if (!updated) return res.status(404).json({ message: "Ad not found" });
    return res.json(formatAd(updated));
  } catch (err) {
    logger.error(err, "update-ad error");
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/ads/:id", async (req, res) => {
  try {
    await db.delete(ads).where(eq(ads.id, req.params.id));
    return res.json({ message: "Ad deleted" });
  } catch (err) {
    logger.error(err, "delete-ad error");
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ── Contact Messages ──────────────────────────────────────────────────────────

router.get("/contact-messages", async (req, res) => {
  try {
    const { page = "1", limit = "50" } = req.query as Record<string, string>;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const rows = await db
      .select()
      .from(contactMessages)
      .orderBy(desc(contactMessages.created_at))
      .limit(parseInt(limit, 10))
      .offset(offset);

    return res.json(
      rows.map((m) => ({
        id: m.id,
        first_name: m.first_name,
        last_name: m.last_name,
        email: m.email,
        phone: m.phone ?? null,
        subject: m.subject ?? null,
        message: m.message,
        created_at: m.created_at.toISOString(),
      })),
    );
  } catch (err) {
    logger.error(err, "get-contact-messages error");
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
