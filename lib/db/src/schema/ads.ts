import { pgTable, text, uuid, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const ads = pgTable("ads", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  image_base64: text("image_base64").notNull(),
  redirect_url: text("redirect_url"),
  is_active: boolean("is_active").notNull().default(true),
  slide_order: integer("slide_order").notNull().default(0),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
