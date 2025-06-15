import '@dotenvx/dotenvx/config'
import { ofetch } from 'ofetch'
import { drizzle } from 'drizzle-orm/node-postgres'
import { scrapedListingsTable } from './db/schema.js'
import { eq, and } from 'drizzle-orm'
import { hash } from 'ohash'

// This script scrapes all listings from home.dk and stores them in the database.
// It iterates through all postal codes in Denmark and fetches listings for each postal code.
// Testing in Yaak revealed the API won't return more than 999 listings per search,
// so we check the top 999 listings for each postal code.
// Obviously, this fails if there are more than 999 listings for a postal code,
// but manual checking shows even the most dense postal codes (like 8000 Aarhus C) have much less than 999 listings.

const db = drizzle(process.env.DATABASE_URL!)

type Response = {
  total: number
  hasNextPage: boolean
  results: { id: number }[]
}

const getListings = async (page: number, postalCode: string, count?: number) => {
  // get listings from the home.dk API for a specific postal code
  const response = await ofetch<Response>('https://api.home.dk/search//homedk/cases', {
    method: 'POST',
    body: {
      filters: {
        // Filter by postal code
        singleFilters: { 'addressFacetValues.postalCode': { selectedValue: { value: postalCode } } },
        multipleFilters: {},
        bitFilters: {
          isBusinessCase: {
            selectedValue: {
              value: false,
            },
          },
        },
        rangeFilters: {},
      },
    },

    query: { loadPrevious: 'false', page, pageSize: count, sortBy: 'dateDesc' },
    headers: {
      'x-forwarded-host': 'home.dk',
    },
  })

  //   console.log(response)

  // Filter out listings that already exist in the database
  const listings = (
    await Promise.all(
      response.results.map(async (listing: any) => {
        const existingListing = await db
          .select()
          .from(scrapedListingsTable)
          .where(and(eq(scrapedListingsTable.externalId, listing.id), eq(scrapedListingsTable.externalSource, 'home')))
        if (existingListing.length == 0) {
          return listing
        }
        if (existingListing.length > 1) {
          console.error(`Found multiple listings with the same id: ${listing.id}`)
        }

        if (existingListing[0].hash === hash(listing)) {
          return null
        }
        // If the listing already exists but the hash is different, update it
        await db
          .update(scrapedListingsTable)
          .set({
            json: listing,
            hash: hash(listing),
            updatedAt: new Date(),
          })
          .where(and(eq(scrapedListingsTable.externalId, listing.id), eq(scrapedListingsTable.externalSource, 'home')))
        console.log(`Updated listing ${listing.id}`)
        return null
      }),
    )
  ).filter((x) => x !== null)

  console.log(`Found ${listings.length} new listing(s)`)
  // insert each new listing into the database
  for (const listing of listings) {
    await db.insert(scrapedListingsTable).values({
      externalSource: 'home',
      externalId: listing.id,
      json: listing,
      hash: hash(listing),
    })
  }
  if (response.hasNextPage) {
    console.log('Checking next page...')
    await new Promise((resolve) => setTimeout(resolve, 5000))
    await getListings(page + 1, postalCode, count)
  }
}
// This function fetches all postal codes from the dataforsyningen API
const getPostalCodes = async () => {
  const response = await ofetch<{ nr: string; navn: string }[]>('https://api.dataforsyningen.dk/postnumre')
  return response /*.filter((x) => Number(x.nr) > 4800)*/
    .map((x) => x.nr + ' ' + x.navn) // CHANGE THIS
}

console.log('Scraping all home.dk listings...')
// await getListings(1, 999)
const postalCodes = await getPostalCodes()

// Iterate through all postal codes and fetch all listings for each
for (const postalCode of postalCodes) {
  console.log(`Scraping listings for ${postalCode}...`)
  await getListings(1, postalCode, 999)
  await new Promise((resolve) => setTimeout(resolve, 500))
}

console.log('Done!')
