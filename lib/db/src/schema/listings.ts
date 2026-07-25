import { pgTable, text, uuid, integer, numeric, jsonb, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const listings = pgTable("listings", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type", { enum: ["house", "apartment", "land", "commercial"] }).notNull(),
  purpose: text("purpose", { enum: ["sale", "rent"] }).notNull(),
  price: numeric("price", { precision: 14, scale: 2 }).notNull(),
  location: text("location").notNull(),
  state: text("state").notNull(),
  size: text("size"),
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  images: jsonb("images").notNull().default([]),
  status: text("status", { enum: ["active", "inactive", "sold"] }).notNull().default("active"),
  contact_email: text("contact_email"),
  contact_phone: text("contact_phone"),
  user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const favorites = pgTable("favorites", {
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  listing_id: uuid("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
