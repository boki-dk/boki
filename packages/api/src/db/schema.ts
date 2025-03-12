import { integer, pgTable, timestamp, jsonb, text } from 'drizzle-orm/pg-core'

export const scrapedListingsTable = pgTable('scraped_listings', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
  source: text().notNull(),
  listingId: text().notNull(),
  json: jsonb().notNull(),
})
