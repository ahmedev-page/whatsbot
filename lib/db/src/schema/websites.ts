import { createInsertSchema } from "drizzle-zod";
import { boolean, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const websitesTable = pgTable("websites", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  publicId: uuid("public_id").defaultRandom().notNull().unique(),
  siteName: text("site_name").notNull(),
  templateId: text("template_id").notNull(),
  themeColor: text("theme_color").notNull().default("#e56b4e"),
  jsonStructure: jsonb("json_structure").$type<Record<string, unknown>>().notNull(),
  // Controls whether the small "Created by orxai" badge shows on this site's
  // public page. Defaults to on; an admin can turn it off per-site.
  showBranding: boolean("show_branding").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertWebsiteSchema = createInsertSchema(websitesTable).omit({
  id: true,
  publicId: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertWebsite = z.infer<typeof insertWebsiteSchema>;
export type Website = typeof websitesTable.$inferSelect;