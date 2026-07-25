import { pgTable, text, uuid, boolean, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  full_name: text("full_name").notNull(),
  phone: text("phone"),
  password_hash: text("password_hash").notNull(),
  role: text("role", { enum: ["user", "admin"] }).notNull().default("user"),
  status: text("status", { enum: ["active", "suspended"] }).notNull().default("active"),
  avatar_base64: text("avatar_base64"),
  is_verified: boolean("is_verified").notNull().default(false),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const pendingSignups = pgTable("pending_signups", {
  email: text("email").primaryKey(),
  full_name: text("full_name").notNull(),
  phone: text("phone"),
  password_hash: text("password_hash").notNull(),
  otp: text("otp").notNull(),
  otp_expires_at: timestamp("otp_expires_at", { withTimezone: true }).notNull(),
});
