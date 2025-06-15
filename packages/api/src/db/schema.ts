import { relations } from 'drizzle-orm'
import { integer, pgTable, timestamp, jsonb, text, index, pgEnum, point } from 'drizzle-orm/pg-core'

/*
 * This file defines the database schema for the application using Drizzle ORM.
 * It includes tables for listings, scraped listings, addresses, listing types, and listing images.
 * See also 3.2 Database initialization in report
 */
export const scrapedListingsTable = pgTable(
  'scraped_listings',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow(),
    externalSource: text().notNull(),
    externalId: text().notNull(),
    json: jsonb().notNull(),
    hash: text().notNull(),
    listingId: integer(),
    /**
     * When the listing was processed and linked to a listing.
     * If this is not null but listingId is null, it means the listing was processed but something went wrong.
     */
    processedAt: timestamp(),
  },
  (table) => [index('external_source_idx').on(table.externalSource), index('external_id_idx').on(table.externalId)],
)

export const scrapedListingsRelations = relations(scrapedListingsTable, ({ one }) => ({
  listing: one(listingsTable, {
    fields: [scrapedListingsTable.listingId],
    references: [listingsTable.id],
  }),
}))

export const listingStatusEnum = pgEnum('listing_status', ['active', 'sold', 'reserved', 'unlisted'])

export const listingTypesTable = pgTable('listing_types', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
  name: text().notNull(),
})

export const listingTypesRelations = relations(listingTypesTable, ({ many }) => ({
  listings: many(listingsTable),
}))

export const addressesTable = pgTable(
  'addresses',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow(),
    street: text().notNull(),
    houseNumber: text().notNull(),
    floor: text(),
    postalCode: text().notNull(),
    postalCodeName: text().notNull(),
    location: point('location', { mode: 'xy' }).notNull(),
    door: text(),
    extraCity: text(),
    slug: text().notNull(),
    displayName: text().notNull(),
  },
  (table) => [
    index('addresses_slug_idx').on(table.slug),
    index('addresses_display_name_idx').on(table.displayName),
    index('addresses_postal_code_idx').on(table.postalCode),
    index('addresses_street_idx').on(table.street),
  ],
)

export const listingImageTypeEnum = pgEnum('listing_image_type', ['image', 'floorplan'])

export const listingImagesTable = pgTable('listing_images', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
  listingId: integer().notNull(),
  url: text().notNull(),
  order: integer(),
  alt: text(),
  type: listingImageTypeEnum(),
})

export const listingImagesRelations = relations(listingImagesTable, ({ one }) => ({
  listing: one(listingsTable, { fields: [listingImagesTable.listingId], references: [listingsTable.id] }),
}))

export const addressesRelations = relations(addressesTable, ({ many }) => ({
  listings: many(listingsTable),
}))

export const listingsTable = pgTable(
  'listings',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow(),
    title: text(),
    description: text(),
    source: text().notNull(),
    sourceUrl: text().notNull(),
    addressId: integer().notNull(),
    typeId: integer().notNull(),
    status: listingStatusEnum(),
    areaLand: integer().notNull(),
    areaFloor: integer().notNull(),
    areaBasement: integer().notNull(),
    price: integer().notNull(),
    energyClass: text(),
    rooms: integer(),
    bathroomCount: integer(),
    bedroomCount: integer(),
    mainImgUrl: text(),
    mainImgAlt: text(),
    floors: integer(),
    yearBuilt: integer(),
    yearRenovated: integer(),
  },
  (table) => [
    index('listings_address_id_idx').on(table.addressId),
    index('listings_type_id_idx').on(table.typeId),
    index('listings_status_idx').on(table.status),
    index('listings_price_idx').on(table.price),
    index('listings_area_land_idx').on(table.areaLand),
    index('listings_area_floor_idx').on(table.areaFloor),
    index('listings_rooms_idx').on(table.rooms),
    index('listings_bathroom_count_idx').on(table.bathroomCount),
    index('listings_year_built_idx').on(table.yearBuilt),
    index('listings_floors_idx').on(table.floors),
    index('listings_created_at_idx').on(table.createdAt),
  ],
)

export const listingsRelations = relations(listingsTable, ({ one, many }) => ({
  type: one(listingTypesTable, { fields: [listingsTable.typeId], references: [listingTypesTable.id] }),
  address: one(addressesTable, { fields: [listingsTable.addressId], references: [addressesTable.id] }),
  images: many(listingImagesTable),
  scrapedListings: many(scrapedListingsTable),
}))
