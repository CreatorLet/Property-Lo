import { pgTable, text, uuid, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const supportChats = pgTable("support_chats", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  last_message: text("last_message"),
  user_unread: integer("user_unread").notNull().default(0),
  admin_unread: integer("admin_unread").notNull().default(0),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const supportMessages = pgTable("support_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  chat_id: uuid("chat_id").notNull().references(() => supportChats.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  is_from_user: boolean("is_from_user").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
