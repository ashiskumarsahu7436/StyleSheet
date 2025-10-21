import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgSchema,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Create a dedicated schema for this app to avoid conflicts in shared database
export const stylesheetSchema = pgSchema("stylesheet_app");

// Session storage table (required for Google Auth)
export const sessions = stylesheetSchema.table(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (for Google OAuth)
export const users = stylesheetSchema.table("users", {
  id: varchar("id").primaryKey(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  googleAccessToken: text("google_access_token"),
  googleRefreshToken: text("google_refresh_token"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Spreadsheet storage table
export const spreadsheets = stylesheetSchema.table("spreadsheets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  data: jsonb("data").notNull(), // Stores the complete spreadsheet state
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSpreadsheetSchema = createInsertSchema(spreadsheets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSpreadsheet = z.infer<typeof insertSpreadsheetSchema>;
export type Spreadsheet = typeof spreadsheets.$inferSelect;
