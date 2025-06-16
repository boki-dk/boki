import '@dotenvx/dotenvx/config'
import { ofetch } from 'ofetch'
import { drizzle } from 'drizzle-orm/node-postgres'
import { scrapedListingsTable } from './db/schema.js'
import { eq, and } from 'drizzle-orm'
import { hash } from 'ohash'

const db = drizzle(process.env.DATABASE_URL!)

// This script scrapes the newest listings from nybolig.dk and stores them in the database.
// It recursively calls itself to keep fetching listings until there are no more new listings or the page limit is reached.
// It is intended to be run periodically to keep the database up to date with the newest listings.

const getListings = async (count: number, maxRec: number, scrollToken?: string) => {
  // fetch the listings from the nybolig.dk API
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
  const listings = (
    await Promise.all(
      response.cases.map(async (listing: any) => {
        // check if the listing already exists in the database
        const existingListing = await db
          .select()
          .from(scrapedListingsTable)
          .where(and(eq(scrapedListingsTable.externalId, listing.id), eq(scrapedListingsTable.externalSource, 'nybolig')))
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
          .where(and(eq(scrapedListingsTable.externalId, listing.id), eq(scrapedListingsTable.externalSource, 'nybolig')))
        console.log(`Updated listing ${listing.id}`)
        return null
      }),
    )
  ).filter((x) => x !== null)

  console.log(`Found ${listings.length} new listing(s)`)
  // insert each new listing into the intermediary database
  for (const listing of listings) {
    await db.insert(scrapedListingsTable).values({
      externalSource: 'nybolig',
      externalId: listing.id,
      json: listing,
      hash: hash(listing),
    })
  }
  if (listings.length > 8 && maxRec > 0) {
    console.log('Checking next page...')
    await new Promise((resolve) => setTimeout(resolve, 5000))
    await getListings(count, maxRec - 1, response.scrollToken)
  }
}

console.log('Scraping nybolig.dk newest listings...')
await getListings(10, 5)
console.log('Done!')
