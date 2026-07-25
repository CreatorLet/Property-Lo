import { Router } from "express";
import { db } from "@workspace/db";
import { chats, chatMessages, listings } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middleware/requireAuth.js";
import { logger } from "../lib/logger.js";

const router = Router();

function formatChat(c: typeof chats.$inferSelect & { user_name?: string | null }) {
  return {
    id: c.id,
    listing_id: c.listing_id,
    listing_title: c.listing_title,
    label: c.label,
    last_message: c.last_message ?? null,
    user_unread: c.user_unread,
    admin_unread: c.admin_unread,
    updated_at: c.updated_at.toISOString(),
    created_at: c.created_at.toISOString(),
    ...(c.user_name !== undefined ? { user_name: c.user_name } : {}),
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

// GET /chats/unread-count (must be before /:id)
// FIX: was incorrectly querying admin_unread; user wants to know their own unread (user_unread)
router.get("/unread-count", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(chats)
      .where(and(eq(chats.user_id, req.user!.id), sql`${chats.user_unread} > 0`));
    return res.json({ count: result?.count ?? 0 });
  } catch (err) {
    logger.error(err, "get-unread error");
    return res.status(500).json({ message: "Internal server error" });
  }
});

// GET /chats
router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const rows = await db
      .select()
      .from(chats)
      .where(eq(chats.user_id, req.user!.id))
      .orderBy(desc(chats.updated_at));
    return res.json(rows.map(formatChat));
  } catch (err) {
    logger.error(err, "get-chats error");
    return res.status(500).json({ message: "Internal server error" });
  }
});

// POST /chats
router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { listing_id } = req.body;
    if (!listing_id) return res.status(400).json({ message: "listing_id required" });

    const [existing] = await db
      .select()
      .from(chats)
      .where(and(eq(chats.user_id, req.user!.id), eq(chats.listing_id, listing_id)))
      .limit(1);

    if (existing) {
      return res.status(201).json({ id: existing.id });
    }

    const [listing] = await db.select().from(listings).where(eq(listings.id, listing_id)).limit(1);
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    const [chat] = await db
      .insert(chats)
      .values({
        user_id: req.user!.id,
        listing_id,
        listing_title: listing.title,
        label: "new",
      })
      .returning();

    return res.status(201).json({ id: chat.id });
  } catch (err) {
    logger.error(err, "create-chat error");
    return res.status(500).json({ message: "Internal server error" });
  }
});

// GET /chats/:id/messages
router.get("/:id/messages", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [chat] = await db
      .select()
      .from(chats)
      .where(and(eq(chats.id, req.params.id), eq(chats.user_id, req.user!.id)))
      .limit(1);

    if (!chat) return res.status(404).json({ message: "Chat not found" });

    await db.update(chats).set({ user_unread: 0 }).where(eq(chats.id, req.params.id));

    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.chat_id, req.params.id))
      .orderBy(chatMessages.created_at);

    return res.json(messages.map(formatMessage));
  } catch (err) {
    logger.error(err, "get-chat-messages error");
    return res.status(500).json({ message: "Internal server error" });
  }
});

// POST /chats/:id/messages
router.post("/:id/messages", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: "Content required" });

    const [chat] = await db
      .select()
      .from(chats)
      .where(and(eq(chats.id, req.params.id), eq(chats.user_id, req.user!.id)))
      .limit(1);

    if (!chat) return res.status(404).json({ message: "Chat not found" });

    const [msg] = await db
      .insert(chatMessages)
      .values({ chat_id: req.params.id, content: content.trim(), is_admin: "false" })
      .returning();

    await db
      .update(chats)
      .set({
        last_message: content.trim(),
        admin_unread: sql`${chats.admin_unread} + 1`,
        updated_at: new Date(),
      })
      .where(eq(chats.id, req.params.id));

    return res.status(201).json(formatMessage(msg));
  } catch (err) {
    logger.error(err, "send-message error");
    return res.status(500).json({ message: "Internal server error" });
  }
});

export { formatChat, formatMessage };
export default router;
