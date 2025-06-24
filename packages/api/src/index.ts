/*
This is the index for the API server. It uses Hono as the web framework and Drizzle ORM for database interactions.
It serves endpoints for fetching listings, searching, scraping listings from Nybolig and Home, and processing scraped listings.
It also includes CORS support and serves the application on port 3000.
This is the brunt of our API code.
each .get or .post is an endpoint that can be called from the frontend.

*/

import '@dotenvx/dotenvx/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { bearerAuth } from 'hono/bearer-auth'
import { ofetch } from 'ofetch'
import { drizzle } from 'drizzle-orm/node-postgres'
import {
  addressesTable,
  listingImagesTable,
  listingImageTypeEnum,
  listingsTable,
  listingTypesTable,
  scrapedListingsTable,
} from './db/schema.js'
import { and, eq, ilike, isNull, or, sql, gte, lte, inArray, not, ne } from 'drizzle-orm'
import * as schema from './db/schema.js'
import { scrapeNyboligListing } from './nyboligHtmlScraper.js'
import { scrapeHomeListing } from './homeHtmlScraper.js'

const HOME_TYPE_MAP = {
  AllYearRoundPlot: 'Helårsgrund',
  AllotmentHut: 'Fritidsbolig',
  AllotmentPlot: 'Fritidsgrund',
  Condo: 'Ejerlejlighed',
  FormerFarm: 'Landejendom',
  HousingCooperative: 'Andelsbolig',
  TerracedHouse: 'Rækkehus',
  Villa: 'Villa',
  VillaApartment: 'Villalejlighed',
  VacationHousing: 'Fritidsbolig',
  VacationPlot: 'Fritidsgrund',
  FarmHouse: 'Landejendom',
  HobbyAgriculture: 'Landejendom',
} as const

const db = drizzle(process.env.DATABASE_URL!, { schema })

const token = process.env.API_TOKEN!

const app = new Hono()
  // Otherwise we can't call API when we refresh on our own domain. CORS issue
  .use(
    '/*',
    cors({
      origin: ['http://localhost:3000', 'https://www.boki.dk', 'https://boki.dk'],
    }),
  )

  .get('/', (c) => {
    return c.text('Hello Hono!')
  })

  // Endpoint to get listings on a map within a bounding box
  .get('/listings/map', async (c) => {
    const southWestLat = c.req.query('swlat')
    const southWestLong = c.req.query('swlong')
    const northEastLat = c.req.query('nelat')
    const northEastLong = c.req.query('nelong')

    if (!southWestLat || !southWestLong || !northEastLat || !northEastLong) {
      return c.json([])
    }

    // Query the database for addresses within the bounding box
    const addresses = (
      await db.query.addressesTable.findMany({
        limit: 100,
        where: sql`${addressesTable.location} <@ box(point(${southWestLong}, ${southWestLat}), point(${northEastLong}, ${northEastLat}))`,
        with: {
          listings: {
            where: or(eq(listingsTable.status, 'active'), eq(listingsTable.status, 'reserved')),
            orderBy: (listing, { desc }) => [desc(listing.createdAt)],
            limit: 1,
          },
        },
      })
    ).filter((address) => address.listings?.length > 0)
    return c.json(
      addresses.map((address) => ({
        type: 'address',
        id: address.listings[0].id,
        displayName: address.displayName,
        url: `/bolig/${address.listings[0].id}`,
        location: { long: address.location.x, lat: address.location.y },
      })),
    )
  })

  // Our main endpoint for fetching listings.
  // Optionally takes query parameters to filter and sort listings.
  // returns a count of listings, the listings (from the database), and a boolean hasMore
  .get('/listings', async (c) => {
    const limit = Number(c.req.query('limit') || '15')
    const offset = Number(c.req.query('offset') || '0')
    const priceMin = c.req.query('price-min')
    const priceMax = c.req.query('price-max')
    const areaLandMin = c.req.query('area-land-min')
    const areaLandMax = c.req.query('area-land-max')
    const areaFloorMin = c.req.query('area-floor-min')
    const areaFloorMax = c.req.query('area-floor-max')
    const roomsMin = c.req.query('rooms-min')
    const roomsMax = c.req.query('rooms-max')
    const bathroomCountMin = c.req.query('bathroom-count-min')
    const bathroomCountMax = c.req.query('bathroom-count-max')
    const floorsMin = c.req.query('floors-min')
    const floorsMax = c.req.query('floors-max')
    const yearBuiltMin = c.req.query('year-built-min')
    const yearBuiltMax = c.req.query('year-built-max')
    const type = c.req.query('type')
    const types = type?.split(',').map((t) => t.trim())

    const postalCode = c.req.query('postal-code')
    const street = c.req.query('street')

    const municipality = c.req.query('municipality')

    const postalCodes =
      // If municipality and no postal code, fetch all postal codes for that municipality
      municipality && !postalCode
        ? await (async () => {
            // this can take up to 19(!!!!) seconds for larger municipaliteis like copenhagen!!!
            //  (which is why sometimes front page buttons are slow)
            // dawa pls
            const response = await ofetch<{ nr: string; navn: string }[]>('https://api.dataforsyningen.dk/postnumre', {
              query: { kommunekode: municipality },
            })

            return response.map((pc) => pc.nr)
          })()
        : // If postal code is provided, use that
          postalCode
          ? [postalCode]
          : []

    type ListingStatus = (typeof listingsTable)['status']['enumValues'][number]

    const status = c.req.query('status')
    // status can be a comma-separated list of statuses, e.g. 'active,reserved'
    const statusList: ListingStatus[] = status
      ? (status
          .split(',')
          .map((s) => s.trim())
          .filter((s): s is ListingStatus => listingsTable.status.enumValues.includes(s as ListingStatus)) as ListingStatus[])
      : ['active', 'reserved'] //default statuses

    const sortBy = (c.req.query('sort-by') || 'created-at') as 'created-at' | 'price' | 'area-floor'
    const sortOrder = (c.req.query('sort-order') || 'desc') as 'asc' | 'desc'

    // each of these lines is a filter condition for the listings
    const where = and(
      inArray(listingsTable.status, statusList),
      types && types.length > 0 ? inArray(listingsTable.typeId, types.map(Number)) : undefined,
      priceMin ? gte(listingsTable.price, Number(priceMin)) : undefined,
      priceMax ? lte(listingsTable.price, Number(priceMax)) : undefined,
      areaLandMin ? gte(listingsTable.areaLand, Number(areaLandMin)) : undefined,
      areaLandMax ? lte(listingsTable.areaLand, Number(areaLandMax)) : undefined,
      areaFloorMin ? gte(listingsTable.areaFloor, Number(areaFloorMin)) : undefined,
      areaFloorMax ? lte(listingsTable.areaFloor, Number(areaFloorMax)) : undefined,
      roomsMin ? gte(listingsTable.rooms, Number(roomsMin)) : undefined,
      roomsMax ? lte(listingsTable.rooms, Number(roomsMax)) : undefined,
      bathroomCountMin ? gte(listingsTable.bathroomCount, Number(bathroomCountMin)) : undefined,
      bathroomCountMax ? lte(listingsTable.bathroomCount, Number(bathroomCountMax)) : undefined,
      floorsMin ? gte(listingsTable.floors, Number(floorsMin)) : undefined,
      floorsMax ? lte(listingsTable.floors, Number(floorsMax)) : undefined,
      yearBuiltMin ? gte(listingsTable.yearBuilt, Number(yearBuiltMin)) : undefined,
      yearBuiltMax ? lte(listingsTable.yearBuilt, Number(yearBuiltMax)) : undefined,

      // subquery - we first get all the listingIDs for addresess in the given postal codes
      postalCodes.length > 0
        ? inArray(
            listingsTable.id,
            db
              .select({ id: listingsTable.id })
              .from(listingsTable)
              .innerJoin(addressesTable, eq(listingsTable.addressId, addressesTable.id))
              .where(inArray(addressesTable.postalCode, postalCodes)),
          )
        : undefined,
      // subquery approach again
      street
        ? inArray(
            listingsTable.id,
            db
              .select({ id: listingsTable.id })
              .from(listingsTable)
              .innerJoin(addressesTable, eq(listingsTable.addressId, addressesTable.id))
              .where(eq(addressesTable.street, street)),
          )
        : undefined,
    )

    const listings = await db.query.listingsTable.findMany({
      where,
      limit: limit + 1,
      offset,
      orderBy: (listing, { desc, asc }) => {
        if (sortBy === 'price') {
          return sortOrder === 'desc' ? [desc(listing.price)] : [asc(listing.price)]
        } else if (sortBy === 'area-floor') {
          return sortOrder === 'desc' ? [desc(listing.areaFloor)] : [asc(listing.areaFloor)]
        } else {
          return sortOrder === 'desc' ? [desc(listing.createdAt)] : [asc(listing.createdAt)]
        }
      },
      // this is drizzle shortcut - this joins the listings address table with
      // the address table and the type table, so we can get the address and type
      // this is because of the relations address and type defined in the schema.ts file
      with: {
        address: true,
        type: true,
      },
    })

    const count: number = await db.$count(listingsTable, where)

    return c.json({ count, listings: listings.slice(0, limit), hasMore: listings.length > limit })
  })

  // This is used for the search bar. Returns valid postal codes, addresses, municipalities, and streets with postal codes.
  // The search query must be at least 3 characters long.
  .get('/search', async (c) => {
    const q = c.req.query('q') || ''
    if (q.length < 3) {
      return c.json({ postalCodes: [], addresses: [], municipalities: [], streetsAndPostalCodes: [] }, 400)
    }

    // query our database for addresses that match the search query
    const addresses = (
      await db.query.addressesTable.findMany({
        limit: 25,
        where: ilike(addressesTable.displayName, `%${q}%`),
        columns: {
          id: true,
          displayName: true,
        },
        with: {
          listings: {
            where: or(eq(listingsTable.status, 'active'), eq(listingsTable.status, 'reserved')),
            orderBy: (listing, { desc }) => [desc(listing.createdAt)],
            limit: 1,
          },
        },
      })
    ).filter((address) => address.listings?.length > 0)

    // query the dataforsyningen API for postal codes, municipalities, and streets with postal codes
    // these also support fuzzy search, but it makes it much slower.
    // this operation takes about 1.5 seconds, the primary cause of why our autocomplete is slow.
    // dawa pls.
    const [postalCodes, municipalities, streetsAndPostalCodes] = await Promise.all([
      ofetch<{ tekst: string; postnummer: { nr: string; navn: string } }[]>('https://api.dataforsyningen.dk/postnumre/autocomplete', {
        query: { q },
      }),
      ofetch<{ tekst: string; kommune: { kode: string; navn: string } }[]>('https://api.dataforsyningen.dk/kommuner/autocomplete', {
        query: { q },
      }),
      ofetch<{ tekst: string; vejnavnpostnummerrelation: { vejnavn: string; postnr: string; postnrnavn: string } }[]>(
        'https://api.dataforsyningen.dk/vejnavnpostnummerrelationer/autocomplete',
        { query: { q } },
      ),
    ])
    return c.json({
      addresses: addresses.map((address) => ({
        id: address.listings[0].id,
        displayName: address.displayName,
        url: `/bolig/${address.listings[0].id}`,
      })),
      postalCodes: postalCodes.map((pc) => ({
        id: pc.postnummer.nr,
        displayName: pc.tekst,
        url: `/boliger?postal-code=${pc.postnummer.nr}`,
      })),
      municipalities: municipalities.map((m) => ({
        id: m.kommune.kode,
        displayName: m.tekst,
        navn: m.kommune.navn,
        url: `/boliger?municipality=${m.kommune.kode}`,
      })),
      streetsAndPostalCodes: streetsAndPostalCodes.map((s) => ({
        id: s.vejnavnpostnummerrelation.vejnavn,
        displayName: s.tekst,
        url: `/boliger?postal-code=${s.vejnavnpostnummerrelation.postnr}&street=${s.vejnavnpostnummerrelation.vejnavn}`,
      })),
    })
  })

  // Endpoint to get a single listing by its ID or slug
  .get('/listings/:listingUrlKey', async (c) => {
    const urlKey = c.req.param('listingUrlKey')

    if (!urlKey) {
      return c.json({ error: 'Listing id or slug is required' }, 400)
    }

    let id = Number(urlKey)

    if (isNaN(id)) {
      const address = await db.query.addressesTable.findFirst({
        where: eq(addressesTable.slug, urlKey),
        with: {
          listings: {
            where: ne(listingsTable.status, 'unlisted'),
            orderBy: (listing, { desc }) => [desc(listing.createdAt)],
            limit: 1,
          },
        },
      })

      if (!address || !address.listings || address.listings.length === 0) {
        return c.json({ error: 'Listing not found' }, 404)
      }

      id = address.listings[0].id
    }

    // look for listings in the database with the given ID
    const listing = await db.query.listingsTable.findFirst({
      where: eq(listingsTable.id, id),
      with: {
        address: true,
        type: true,
        images: true,
      },
    })

    if (!listing) {
      return c.json({ error: 'Listing not found' }, 404)
    }

    return c.json(listing)
  })

  // Endpoint to get all listings types, used for the search menu filter
  .get('/listing-types', async (c) => {
    const types = await db.query.listingTypesTable.findMany({
      orderBy: (type, { asc }) => [asc(type.name)],
    })

    return c.json(types)
  })
  // endpoint to proceess listings from Nybolig
  .post('/nybolig/process-listing', bearerAuth({ token }), async (c) => {
    // fetch a listing from the scraped listings table that is from Nybolig,
    // has no listingId, and has not been processed yet
    const scrapedListing = (
      await db
        .select()
        .from(scrapedListingsTable)
        .where(
          and(
            eq(scrapedListingsTable.externalSource, 'nybolig'),
            isNull(scrapedListingsTable.listingId),
            isNull(scrapedListingsTable.processedAt),
            sql`${scrapedListingsTable.json}->>'siteName' = 'nybolig'`,
          ),
        )
        .limit(1)
    )[0]

    if (!scrapedListing) {
      return c.json({ error: 'No listings found' }, 200)
    }

    console.log(`Processing listing: ${scrapedListing.id} from Nybolig`)

    const listingJson = scrapedListing.json as {
      basementSize: number
      url: string
      addressDisplayName: string
      type: string
      hasBeenSold: boolean
      propertySize: number
      livingSpace: number
      cashPrice: number
      energyClassification: string
      totalNumberOfRooms: number
      imageUrl: string
      imageAlt: string
    }
    const url = `https://nybolig.dk${listingJson.url}`

    const updatedListing = await scrapeNyboligListing(url)

    // get the cleaned address from the Dataforsyningen API
    const cleanedAddressResult = await ofetch<{
      kategori: string
      resultater: {
        adresse: {
          id: string
          status: 1 | 2 | 3 | 4
          virkningslut: string | null
        }
      }[]
    }>('https://api.dataforsyningen.dk/datavask/adresser', {
      query: { betegnelse: listingJson.addressDisplayName },
    })

    const cleanedAddress = cleanedAddressResult?.resultater?.[0].adresse

    // Issues here where a listing from nybolig didn't have a valid address.
    // If the address is not valid, we set the listingId to null and processedAt to now
    if (!cleanedAddress || cleanedAddress.status !== 1 || cleanedAddress.virkningslut !== null) {
      await db
        .update(scrapedListingsTable)
        .set({
          listingId: null,
          processedAt: new Date(),
        })
        .where(eq(scrapedListingsTable.id, scrapedListing.id))

      return c.json({ error: 'No valid address found for the listing' }, 400)
    }

    // Fetch the address details from the Dataforsyningen API
    const address = await ofetch<{
      id: string
      vejnavn: string
      husnr: string
      etage: string | null
      dør: string | null
      postnr: string
      postnrnavn: string
      supplerendebynavn: string | null
      x: number
      y: number
      betegnelse: string
    }>(`https://api.dataforsyningen.dk/adresser/${cleanedAddress.id}`, {
      query: { struktur: 'mini' },
    })

    // If the address is not found, we set the listingId to null and processedAt to now
    // we start a transaction to ensure atomicity
    const listing = await db.transaction(async (tx) => {
      const existingScrapedListing = (
        await tx
          .select()
          .from(scrapedListingsTable)
          .where(and(eq(scrapedListingsTable.id, scrapedListing.id)))
          .limit(1)
      )[0]

      if (!existingScrapedListing || existingScrapedListing.listingId !== null) return
      //insert the address into the addresses table
      const addressRows = await tx
        .insert(addressesTable)
        .values({
          street: address.vejnavn,
          houseNumber: address.husnr,
          floor: address.etage,
          door: address.dør,
          postalCode: address.postnr,
          postalCodeName: address.postnrnavn,
          extraCity: address.supplerendebynavn,
          location: sql`point(${address.x}, ${address.y})`,
          displayName: address.betegnelse,
          slug: address.betegnelse
            .toLocaleLowerCase('da-DK')
            .replace(/[\s,]+/g, '-')
            .replace('æ', 'ae')
            .replace('ø', 'oe')
            .replace('å', 'aa')
            .replace(/[^\w-]+/g, ''),
        })
        .returning()

      // get the type of the listing
      const existingType = (
        await tx
          .select()
          .from(listingTypesTable)
          .where(eq(listingTypesTable.name, updatedListing.type ?? listingJson.type))
          .limit(1)
      )[0]

      const typeRows = existingType
        ? [existingType]
        : await tx
            .insert(listingTypesTable)
            .values({
              name: updatedListing.type ?? listingJson.type,
            })
            .returning()

      // insert the listing into the listings table
      const listingRows = await tx
        .insert(listingsTable)
        .values({
          title: updatedListing.title,
          description: updatedListing.description,
          source: 'nybolig',
          sourceUrl: url,
          addressId: addressRows[0].id,
          typeId: typeRows[0].id,
          status: updatedListing.status,
          areaLand: updatedListing.areaLand ?? listingJson.propertySize,
          areaFloor: updatedListing.areaFloor ?? listingJson.livingSpace,
          areaBasement: updatedListing.areaBasement ?? listingJson.basementSize,
          price: updatedListing.price ?? listingJson.cashPrice,
          energyClass: updatedListing.energyClass ?? listingJson.energyClassification,
          rooms: updatedListing.rooms ?? listingJson.totalNumberOfRooms,
          bedroomCount: updatedListing.bedrooms,
          mainImgUrl: updatedListing.images?.[0]?.src ?? listingJson.imageUrl,
          mainImgAlt: updatedListing.images?.[0]?.alt ?? listingJson.imageAlt,
          floors: updatedListing.floors,
          yearBuilt: updatedListing.yearBuilt,
          yearRenovated: updatedListing.yearRenovated,
        })
        .returning()
      // insert images into the listing_images table
      if (updatedListing.status !== 'unlisted' && (updatedListing.images.length > 0 || updatedListing.floorplanImages.length > 0)) {
        await tx.insert(listingImagesTable).values([
          ...updatedListing.images.map((img, i) => ({
            listingId: listingRows[0].id,
            url: img.src,
            order: i,
            alt: img.alt,
            type: listingImageTypeEnum.enumValues[0],
          })),
          ...updatedListing.floorplanImages.map((img, i) => ({
            listingId: listingRows[0].id,
            url: img.src,
            order: i,
            alt: img.alt,
            type: listingImageTypeEnum.enumValues[1],
          })),
        ])
      }

      // mark listing as processed by updating the scrapedListings table
      await tx
        .update(scrapedListingsTable)
        .set({
          listingId: listingRows[0].id,
          processedAt: new Date(),
        })
        .where(eq(scrapedListingsTable.id, scrapedListing.id))

      return listingRows[0]
    })

    if (!listing) {
      return c.json({ error: 'Scraped listing was already processed by another request' }, 500)
    }

    return c.json(listing)
  })

  .post('/nybolig/update-listing', bearerAuth({ token }), async (c) => {
    const oldListing = await db.query.listingsTable.findFirst({
      where: and(eq(listingsTable.source, 'nybolig'), not(eq(listingsTable.status, 'unlisted'))),
      orderBy: (listing, { asc }) => [asc(listing.updatedAt)],
    })

    if (!oldListing) {
      return c.json({ error: 'No listings found' }, 200)
    }

    console.log(`Updating listing: ${oldListing.id} from Nybolig`)

    const updatedListing = await scrapeNyboligListing(oldListing.sourceUrl)

    // we start a transaction to ensure atomicity
    const listing = await db.transaction(async (tx) => {
      const tempOldListing = await db.query.listingsTable.findFirst({
        where: eq(listingsTable.id, oldListing.id),
      })

      // Return if the listing has been updated since we fetched it
      if (tempOldListing?.updatedAt.getTime() !== oldListing.updatedAt.getTime()) return

      if (updatedListing.status === 'unlisted') {
        // If the listing is unlisted, we just update the listing and mark it as processed
        const listingRows = await tx
          .update(listingsTable)
          .set({
            updatedAt: new Date(),
            status: updatedListing.status,
          })
          .where(eq(listingsTable.id, oldListing.id))
          .returning()

        return listingRows[0]
      }

      // update the listing with the new information
      const listingRows = await tx
        .update(listingsTable)
        .set({
          updatedAt: new Date(),
          title: updatedListing.title,
          description: updatedListing.description,
          status: updatedListing.status,
          areaLand: updatedListing.areaLand,
          areaFloor: updatedListing.areaFloor,
          areaBasement: updatedListing.areaBasement,
          price: updatedListing.price,
          energyClass: updatedListing.energyClass,
          rooms: updatedListing.rooms,
          bedroomCount: updatedListing.bedrooms,
          mainImgUrl: updatedListing.images?.[0]?.src,
          mainImgAlt: updatedListing.images?.[0]?.alt,
          floors: updatedListing.floors,
          yearBuilt: updatedListing.yearBuilt,
          yearRenovated: updatedListing.yearRenovated,
        })
        .where(eq(listingsTable.id, oldListing.id))
        .returning()

      return listingRows[0]
    })

    if (!listing) {
      return c.json({ error: 'Listing was already processed by another request' }, 500)
    }

    return c.json(listing)
  })

  .get('/nybolig/scrape-listing', async (c) => {
    const url = c.req.query('url')

    if (!url) {
      return c.json({ error: 'No URL provided' }, 400)
    }

    return c.json(await scrapeNyboligListing(url))
  })

  // processes a listing from scraped listings table that is from Home
  // formats the information properly into our database
  .post('/home/process-listing', bearerAuth({ token }), async (c) => {
    // get scraped listing
    const scrapedListing = (
      await db
        .select()
        .from(scrapedListingsTable)
        .where(
          and(
            eq(scrapedListingsTable.externalSource, 'home'),
            isNull(scrapedListingsTable.listingId),
            isNull(scrapedListingsTable.processedAt),
            sql`${scrapedListingsTable.json}->>'isExternal' = 'false'`,
            sql`${scrapedListingsTable.json}->>'isRentalCase' = 'false'`,
          ),
        )
        .limit(1)
    )[0]

    if (!scrapedListing) {
      return c.json({ error: 'No listings found' }, 200)
    }

    console.log(`Processing listing: ${scrapedListing.id} from Home`)
    // the scrapedListing.json is a JSON object that contains the listing information
    const listingJson = scrapedListing.json as {
      url: string
      type: keyof typeof HOME_TYPE_MAP
      address: {
        full: string
      }
      offer: {
        price: { amount: number }
      }
      stats: {
        plotArea: number
        floorArea: number
        floorAreaTotal?: number
        totalSquareMeters: number
      }
      presentationMedia: {
        url: string
        type: 'Billede'
        altText: string
        priority: string
      }[]
      floorPlanMedia: {
        url: string
        type: 'Plantegning'
        altText: string
        priority: string
      }[]
      headline: string
      // basementSize: number

      // hasBeenSold: boolean

      // energyClassification: string
      // totalNumberOfRooms: number
    }
    const url = `https://home.dk/${listingJson.url}`
    // get newer information from scraping Home HTML
    const updatedListing = await scrapeHomeListing(url)
    // check address at Dataforsyningen API
    const cleanedAddressResult = await ofetch<{
      kategori: string
      resultater: {
        adresse: {
          id: string
          status: 1 | 2 | 3 | 4
          virkningslut: string | null
        }
      }[]
    }>('https://api.dataforsyningen.dk/datavask/adresser', {
      query: { betegnelse: listingJson.address.full },
    })

    const cleanedAddress = cleanedAddressResult?.resultater?.[0].adresse
    // if no cleaned address or status is not 1, we set the listingId to null and processedAt to now
    if (!cleanedAddress || cleanedAddress.status !== 1 || cleanedAddress.virkningslut !== null) {
      await db
        .update(scrapedListingsTable)
        .set({
          listingId: null,
          processedAt: new Date(),
        })
        .where(eq(scrapedListingsTable.id, scrapedListing.id))

      return c.json({ error: 'No valid address found for the listing' }, 400)
    }

    // Fetch the address details from the Dataforsyningen API
    const address = await ofetch<{
      id: string
      vejnavn: string
      husnr: string
      etage: string | null
      dør: string | null
      postnr: string
      postnrnavn: string
      supplerendebynavn: string | null
      x: number
      y: number
      betegnelse: string
    }>(`https://api.dataforsyningen.dk/adresser/${cleanedAddress.id}`, {
      query: { struktur: 'mini' },
    })

    const type = HOME_TYPE_MAP[(updatedListing.type ?? listingJson.type) as keyof typeof HOME_TYPE_MAP]

    // start transaction to add into the database
    const listing = await db.transaction(async (tx) => {
      // check if the scraped listing already has a listingId
      const existingScrapedListing = (
        await tx
          .select()
          .from(scrapedListingsTable)
          .where(and(eq(scrapedListingsTable.id, scrapedListing.id)))
          .limit(1)
      )[0]

      if (!existingScrapedListing || existingScrapedListing.listingId !== null) return
      // insert the address into the addresses table
      const addressRows = await tx
        .insert(addressesTable)
        .values({
          street: address.vejnavn,
          houseNumber: address.husnr,
          floor: address.etage,
          door: address.dør,
          postalCode: address.postnr,
          postalCodeName: address.postnrnavn,
          extraCity: address.supplerendebynavn,
          location: sql`point(${address.x}, ${address.y})`,
          displayName: address.betegnelse,
          slug: address.betegnelse
            .toLocaleLowerCase('da-DK')
            .replace(/[\s,]+/g, '-')
            .replace('æ', 'ae')
            .replace('ø', 'oe')
            .replace('å', 'aa')
            .replace(/[^\w-]+/g, ''),
        })
        .returning()
      // get the type of the listing, if it exists, otherwise insert it
      const existingType = (await tx.select().from(listingTypesTable).where(eq(listingTypesTable.name, type)).limit(1))[0]
      const typeRows = existingType
        ? [existingType]
        : await tx
            .insert(listingTypesTable)
            .values({
              name: type,
            })
            .returning()

      // insert the listing into the listings table
      const listingRows = await tx
        .insert(listingsTable)
        .values({
          title: updatedListing.title,
          description: updatedListing.description,
          source: 'home',
          sourceUrl: url,
          addressId: addressRows[0].id,
          typeId: typeRows[0].id,
          status: updatedListing.status,
          areaLand: updatedListing.areaLand ?? listingJson.stats.plotArea,
          areaFloor: updatedListing.areaFloor ?? listingJson.stats.floorArea,
          areaBasement: updatedListing.areaBasement ?? 0,
          price: updatedListing.price ?? listingJson.offer.price.amount,
          energyClass: updatedListing.energyClass,
          rooms: updatedListing.rooms,
          bathroomCount: updatedListing.bathrooms,
          mainImgUrl: updatedListing.images?.[0]?.url ?? listingJson.presentationMedia?.[0]?.url,
          mainImgAlt: updatedListing.images?.[0]?.description ?? listingJson.presentationMedia?.[0]?.altText,
          floors: updatedListing.floors,
          yearBuilt: updatedListing.yearBuilt,
          yearRenovated: updatedListing.yearRenovated,
        })
        .returning()
      if (updatedListing.status !== 'unlisted' && (updatedListing.images.length > 0 || updatedListing.floorplanImages.length > 0)) {
        await tx.insert(listingImagesTable).values([
          ...updatedListing.images.map((img, i) => ({
            listingId: listingRows[0].id,
            url: img.url,
            order: i,
            alt: img.description,
            type: listingImageTypeEnum.enumValues[0],
          })),
          ...updatedListing.floorplanImages.map((img, i) => ({
            listingId: listingRows[0].id,
            url: img.url,
            order: i,
            alt: img.description,
            type: listingImageTypeEnum.enumValues[1],
          })),
        ])
      }

      // mark listing as processed by updating the scrapedListings table
      await tx
        .update(scrapedListingsTable)
        .set({
          listingId: listingRows[0].id,
          processedAt: new Date(),
        })
        .where(eq(scrapedListingsTable.id, scrapedListing.id))

      return listingRows[0]
    })

    if (!listing) {
      return c.json({ error: 'Scraped listing was already processed by another request' }, 500)
    }

    return c.json(listing)
  })

  .post('/home/update-listing', bearerAuth({ token }), async (c) => {
    const oldListing = await db.query.listingsTable.findFirst({
      where: and(eq(listingsTable.source, 'home'), not(eq(listingsTable.status, 'unlisted'))),
      orderBy: (listing, { asc }) => [asc(listing.updatedAt)],
    })

    if (!oldListing) {
      return c.json({ error: 'No listings found' }, 200)
    }

    console.log(`Updating listing: ${oldListing.id} from Home`)

    const updatedListing = await scrapeHomeListing(oldListing.sourceUrl)

    // we start a transaction to ensure atomicity
    const listing = await db.transaction(async (tx) => {
      const tempOldListing = await db.query.listingsTable.findFirst({
        where: eq(listingsTable.id, oldListing.id),
      })

      // Return if the listing has been updated since we fetched it
      if (tempOldListing?.updatedAt.getTime() !== oldListing.updatedAt.getTime()) return

      if (updatedListing.status === 'unlisted') {
        // If the listing is unlisted, we just update the listing and mark it as processed
        const listingRows = await tx
          .update(listingsTable)
          .set({
            updatedAt: new Date(),
            status: updatedListing.status,
          })
          .where(eq(listingsTable.id, oldListing.id))
          .returning()

        return listingRows[0]
      }

      // update the listing with the new information
      const listingRows = await tx
        .update(listingsTable)
        .set({
          updatedAt: new Date(),
          title: updatedListing.title,
          description: updatedListing.description,
          status: updatedListing.status,
          areaLand: updatedListing.areaLand,
          areaFloor: updatedListing.areaFloor,
          areaBasement: updatedListing.areaBasement,
          price: updatedListing.price,
          energyClass: updatedListing.energyClass,
          rooms: updatedListing.rooms,
          bathroomCount: updatedListing.bathrooms,
          mainImgUrl: updatedListing.images?.[0]?.url,
          mainImgAlt: updatedListing.images?.[0]?.description,
          floors: updatedListing.floors,
          yearBuilt: updatedListing.yearBuilt,
          yearRenovated: updatedListing.yearRenovated,
        })
        .where(eq(listingsTable.id, oldListing.id))
        .returning()

      return listingRows[0]
    })

    if (!listing) {
      return c.json({ error: 'Listing was already processed by another request' }, 500)
    }

    return c.json(listing)
  })

  // endpoint to scrape a Home listing by URL
  .get('/home/scrape-listing', async (c) => {
    const url = c.req.query('url')

    if (!url) {
      return c.json({ error: 'No URL provided' }, 400)
    }

    return c.json(await scrapeHomeListing(url))
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

export type AppType = typeof app
