import { integer, pgTable, timestamp, jsonb, text, index } from 'drizzle-orm/pg-core'

export const scrapedListingsTable = pgTable(
  'scraped_listings',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow(),
    source: text().notNull(),
    listingId: text().notNull(),
    json: jsonb().notNull(),
    hash: text().notNull(),
  },
  (table) => [index('source_idx').on(table.source), index('listing_id_idx').on(table.listingId)],
)
