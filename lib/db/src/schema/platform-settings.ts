import { createInsertSchema } from "drizzle-zod";
import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const platformSettingsTable = pgTable("platform_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull().default(""),
});

export const insertPlatformSettingSchema = createInsertSchema(platformSettingsTable).omit({ id: true });
export type InsertPlatformSetting = z.infer<typeof insertPlatformSettingSchema>;
export type PlatformSetting = typeof platformSettingsTable.$inferSelect;