import { createInsertSchema } from "drizzle-zod";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const apiKeysTable = pgTable("api_keys", {
  id: uuid("id").defaultRandom().primaryKey(),
  provider: text("provider").notNull().default("gemini"),
  keyString: text("key_string").notNull(),
  status: text("status").notNull().default("active"),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
});

export const insertApiKeySchema = createInsertSchema(apiKeysTable).omit({ id: true });
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKey = typeof apiKeysTable.$inferSelect;