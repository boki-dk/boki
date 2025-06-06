import '@dotenvx/dotenvx/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
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
import { and, eq, ilike, isNull, or, sql, gte, lte } from 'drizzle-orm'
import * as schema from './db/schema.js'
import { scrapeListing } from './nyboligHtmlScraper.js'

const db = drizzle(process.env.DATABASE_URL!, { schema })

const app = new Hono()
  .use(
    '/*',
    cors({
      origin: ['http://localhost:3000', 'https://www.boki.dk', 'https://boki.dk'],
    }),
  )
  .get('/', (c) => {
    return c.text('Hello Hono!')
  })

  .get('/listings', async (c) => {
    const limit = Number(c.req.query('limit') || '15')
    const offset = Number(c.req.query('offset') || '0')
    const type = c.req.query('type')
    const priceMin = c.req.query('priceMin')
    const priceMax = c.req.query('priceMax')
    const areaLandMin = c.req.query('areaLandMin')
    const areaLandMax = c.req.query('areaLandMax')
    const areaFloorMin = c.req.query('areaFloorMin')
    const areaFloorMax = c.req.query('areaFloorMax')

    const listings = await db.query.listingsTable.findMany({
      where: and(
        or(eq(listingsTable.status, 'active'), eq(listingsTable.status, 'reserved')),
        type ? eq(listingsTable.typeId, Number(type)) : undefined,
        priceMin ? gte(listingsTable.price, Number(priceMin)) : undefined,
        priceMax ? lte(listingsTable.price, Number(priceMax)) : undefined,
        areaLandMin ? gte(listingsTable.areaLand, Number(areaLandMin)) : undefined,
        areaLandMax ? lte(listingsTable.areaLand, Number(areaLandMax)) : undefined,
        areaFloorMin ? gte(listingsTable.areaFloor, Number(areaFloorMin)) : undefined,
        areaFloorMax ? lte(listingsTable.areaFloor, Number(areaFloorMax)) : undefined,
      ),
      limit: limit + 1,
      offset,
      with: {
        address: true,
        type: true,
      },
    })
    const returnListings = listings.slice(0, limit)
    return c.json({ count: returnListings.length, listings: returnListings, hasMore: listings.length > limit })
  })

  .get('/search', async (c) => {
    const q = c.req.query('q') || ''
    if (q.length < 3) {
      return c.json([])
    }

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

    return c.json(
      addresses.map((address) => ({
        type: 'address',
        id: address.listings[0].id,
        displayName: address.displayName,
        url: `/listings/${address.listings[0].id}`,
      })),
    )
  })

  .get('/listings/:listingId', async (c) => {
    const id = c.req.param('listingId')
    const listing = await db.query.listingsTable.findFirst({
      where: eq(listingsTable.id, Number(id)),
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

  .post('/nybolig/process-listing', async (c) => {
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
      return c.json({ error: 'No listings found' }, 404)
    }

    console.log(`Processing listing: ${scrapedListing.id}`)

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

    const updatedListing = await scrapeListing(url)

    const cleanedAddressResult = await ofetch<{
      kategori: string
      resultater: {
        adresse: {
          id: string
          status: 1 | 2 | 3 | 4
        }
      }[]
    }>('https://api.dataforsyningen.dk/datavask/adresser', {
      query: { betegnelse: listingJson.addressDisplayName },
    })

    const cleanedAddress = cleanedAddressResult?.resultater?.[0].adresse

    if (!cleanedAddress || cleanedAddress.status !== 1) {
      await db
        .update(scrapedListingsTable)
        .set({
          listingId: null,
          processedAt: new Date(),
        })
        .where(eq(scrapedListingsTable.id, scrapedListing.id))

      return c.json({ error: 'No valid address found for the listing' }, 400)
    }

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

    const listing = await db.transaction(async (tx) => {
      const existingScrapedListing = (
        await tx
          .select()
          .from(scrapedListingsTable)
          .where(and(eq(scrapedListingsTable.id, scrapedListing.id)))
          .limit(1)
      )[0]

      if (!existingScrapedListing || existingScrapedListing.listingId !== null) return

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
          mainImgUrl: updatedListing.images?.[0].src ?? listingJson.imageUrl,
          mainImgAlt: updatedListing.images?.[0].alt ?? listingJson.imageAlt,
          floors: updatedListing.floors,
          yearBuilt: updatedListing.yearBuilt,
          yearRenovated: updatedListing.yearRenovated,
        })
        .returning()
      if (updatedListing.status !== 'unlisted') {
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

  .get('/nybolig/scrape-listing', async (c) => {
    const url = c.req.query('url')

    if (!url) {
      return c.json({ error: 'No URL provided' }, 400)
    }

    return c.json(await scrapeListing(url))
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
