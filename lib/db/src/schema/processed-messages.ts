import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const processedMessagesTable = pgTable("processed_messages", {
  messageId: text("message_id").primaryKey(),
  status: text("status").notNull().default("processing"),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
  attempts: integer("attempts").notNull().default(0),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  lastError: text("last_error"),
});

export type ProcessedMessage = typeof processedMessagesTable.$inferSelect;