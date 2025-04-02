import '@dotenvx/dotenvx/config'
import { ofetch } from 'ofetch'
import { drizzle } from 'drizzle-orm/node-postgres'
import { scrapedListingsTable } from './db/schema.js'
import { eq, and } from 'drizzle-orm'
import { hash } from 'ohash'

const db = drizzle(process.env.DATABASE_URL!)

type Response = {
  total: number
  hasNextPage: boolean
  results: { id: number }[]
}

const getListings = async (page: number, postalCode: string, count?: number) => {
  const response = await ofetch<Response>('https://api.home.dk/search//homedk/cases', {
    method: 'POST',
    body: {
      filters: {
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

const getPostalCodes = async () => {
  const response = await ofetch<{ nr: string; navn: string }[]>('https://api.dataforsyningen.dk/postnumre')
  return response /*.filter((x) => Number(x.nr) > 4800)*/
    .map((x) => x.nr + ' ' + x.navn) // CHANGE THIS
}

console.log('Scraping all home.dk listings...')
// await getListings(1, 999)
const postalCodes = await getPostalCodes()

for (const postalCode of postalCodes) {
  console.log(`Scraping listings for ${postalCode}...`)
  await getListings(1, postalCode, 999)
  await new Promise((resolve) => setTimeout(resolve, 500))
}

console.log('Done!')
