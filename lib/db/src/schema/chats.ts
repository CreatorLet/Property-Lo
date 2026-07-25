import { pgTable, text, uuid, integer, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";
import { listings } from "./listings";

export const chats = pgTable("chats", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  listing_id: uuid("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  listing_title: text("listing_title").notNull(),
  label: text("label", { enum: ["new", "ongoing", "sold", "successful", "closed"] }).notNull().default("new"),
  last_message: text("last_message"),
  user_unread: integer("user_unread").notNull().default(0),
  admin_unread: integer("admin_unread").notNull().default(0),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  chat_id: uuid("chat_id").notNull().references(() => chats.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  is_admin: text("is_admin").notNull().default("false"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
