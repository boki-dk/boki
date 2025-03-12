import '@dotenvx/dotenvx/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { ofetch } from 'ofetch'
import { drizzle } from 'drizzle-orm/node-postgres'
import { scrapedListingsTable } from './db/schema.js'
import { eq } from 'drizzle-orm'

const db = drizzle(process.env.DATABASE_URL!)

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

// app.get('/users', async (c) => {
//   const users = await db.select().from(usersTable)
//   return c.json(users)
// })

// app.get('/users/:userId', async (c) => {
//   const userId = c.req.param('userId')
//   const users = await db
//     .select()
//     .from(usersTable)
//     .where(eq(usersTable.id, Number(userId)))
//   return c.json(users?.[0])
// })

app.get('/listings', async (c) => {
  const listings = await db.select().from(scrapedListingsTable)
  return c.json(listings)
})

app.get('/listings/:listingId', async (c) => {
  const id = c.req.param('listingId')
  const listing = (
    await db
      .select()
      .from(scrapedListingsTable)
      .where(eq(scrapedListingsTable.id, Number(id)))
  )?.[0]

  if (!listing) {
    return c.json({ error: 'Listing not found' }, 404)
  }

  return c.json(listing)
})

app.get('/nybolig/listings', async (c) => {
  const response = await ofetch('https://www.nybolig.dk/api/search/cases/find', {
    method: 'POST',
    body: {
      siteName: 'nybolig',
      municipalityCodes: [],
      municipalityNames: [],
      cityNames: [],
      supplementaryCityNames: [],
      postalCodes: [],
      postalCodeRanges: [],
      streetNames: [],
      streetNumbers: [],
      propertyCategories: [],
      businessPropertyCategories: [],
      isRental: false,
      rentalProjects: null,
      saleProjects: null,
      hasBalcony: null,
      hasElevator: null,
      petsAllowed: null,
      flexProperty: null,
      isSold: false,
      isSaleInProgress: false,
      polygon: [],
      minPrice: 0,
      maxPrice: 0,
      minOwnerExpenses: 0,
      maxOwnerExpenses: 0,
      minHouseSubsidy: 0,
      maxHouseSubsidy: 0,
      minRent: 0,
      maxRent: 0,
      freeText: '',
      minFloors: 0,
      maxFloors: 0,
      minAddressFloor: 0,
      maxAddressFloor: 0,
      minRooms: 0,
      maxRooms: 0,
      minEnergyClassification: 0,
      maxEnergyClassification: 0,
      minBuiltYear: 0,
      maxBuiltYear: 0,
      minDaysForSale: 0,
      maxDaysForSale: 0,
      minSize: 0,
      maxSize: 0,
      minPlotSize: 0,
      maxPlotSize: 0,
      minPlotSizeHa: 0,
      maxPlotSizeHa: 0,
      minFarmBuildingsSize: 0,
      maxFarmBuildingsSize: 0,
      sort: 0,
      similarCaseId: '',
      scrollToken: '',
      top: 10,
    },
  })

  // Filter out listings that already exist in the database
  // const listings = (
  //   await Promise.all(
  //     response.cases.map(async (listing: any) => {
  //       const existingListing = await db.select().from(scrapedListingsTable).where(eq(scrapedListingsTable.listingId, listing.id))
  //       return existingListing ? null : listing
  //     }),
  //   )
  // ).filter((x) => x !== null)

  // console.log(`Found ${listings.length} new listings`)

  const listings = response.cases

  for (const listing of listings) {
    await db.insert(scrapedListingsTable).values({
      source: 'nybolig',
      listingId: listing.id,
      json: listing,
    })
  }
  return c.json(listings)
})

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
  },
)
