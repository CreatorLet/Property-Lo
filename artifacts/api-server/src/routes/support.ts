import { Router } from "express";
import { db } from "@workspace/db";
import { supportChats, supportMessages } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middleware/requireAuth.js";
import { logger } from "../lib/logger.js";

const router = Router();

export function formatSupportMessage(m: typeof supportMessages.$inferSelect) {
  return {
    id: m.id,
    content: m.content,
    is_from_user: m.is_from_user,
    created_at: m.created_at.toISOString(),
  };
}

async function getOrCreateSupportChat(userId: string) {
  const [existing] = await db
    .select()
    .from(supportChats)
    .where(eq(supportChats.user_id, userId))
    .limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(supportChats)
    .values({ user_id: userId })
    .returning();

  return created;
}

// GET /support/chat
router.get("/chat", requireAuth, async (req: AuthRequest, res) => {
  try {
    const chat = await getOrCreateSupportChat(req.user!.id);

    await db.update(supportChats).set({ user_unread: 0 }).where(eq(supportChats.id, chat.id));

    const messages = await db
      .select()
      .from(supportMessages)
      .where(eq(supportMessages.chat_id, chat.id))
      .orderBy(supportMessages.created_at);

    return res.json({ messages: messages.map(formatSupportMessage) });
  } catch (err) {
    logger.error(err, "get-support-chat error");
    return res.status(500).json({ message: "Internal server error" });
  }
});

// POST /support/chat/messages
router.post("/chat/messages", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: "Content required" });

    const chat = await getOrCreateSupportChat(req.user!.id);

    const [msg] = await db
      .insert(supportMessages)
      .values({ chat_id: chat.id, content: content.trim(), is_from_user: true })
      .returning();

    await db
      .update(supportChats)
      .set({
        last_message: content.trim(),
        admin_unread: sql`${supportChats.admin_unread} + 1`,
        updated_at: new Date(),
      })
      .where(eq(supportChats.id, chat.id));

    return res.status(201).json(formatSupportMessage(msg));
  } catch (err) {
    logger.error(err, "send-support-message error");
    return res.status(500).json({ message: "Internal server error" });
  }
});

// GET /support/unread-count
router.get("/unread-count", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [chat] = await db
      .select()
      .from(supportChats)
      .where(eq(supportChats.user_id, req.user!.id))
      .limit(1);

    return res.json({ count: chat?.user_unread ?? 0 });
  } catch (err) {
    logger.error(err, "support-unread-count error");
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
