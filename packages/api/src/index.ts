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
import { and, eq, ilike, isNull, or, sql, gte, lte, inArray } from 'drizzle-orm'
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

    const municipality = c.req.query('municipality')

    const postalCodes =
      municipality && !postalCode
        ? await (async () => {
            const response = await ofetch<{  nr: string; navn: string  }[]>(
              'https://api.dataforsyningen.dk/postnumre',
              {
                query: { kommunekode: municipality },
              },
            )
            
            return response.map((pc) => pc.nr)
          })()
        : postalCode
          ? [postalCode]
          : []

    type ListingStatus = (typeof listingsTable)['status']['enumValues'][number] //hmmm

    const status = c.req.query('status')
    const statusList: ListingStatus[] = status
      ? (status
          .split(',')
          .map((s) => s.trim())
          .filter((s): s is ListingStatus => listingsTable.status.enumValues.includes(s as ListingStatus)) as ListingStatus[])
      : ['active', 'reserved'] //default statuses

    const sortBy = (c.req.query('sort-by') || 'created-at') as 'created-at' | 'price' | 'area-floor'
    const sortOrder = (c.req.query('sort-order') || 'desc') as 'asc' | 'desc'

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
      with: {
        address: true,
        type: true,
      },
    })

    const count: number = await db.$count(listingsTable, where)

    return c.json({ count, listings: listings.slice(0, limit), hasMore: listings.length > limit })
  })

  .get('/search', async (c) => {
    const q = c.req.query('q') || ''
    if (q.length < 3) {
      return c.json({ postalCodes: [], addresses: [] }, 400)
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

    const postalCodes = await ofetch<{ tekst: string; postnummer: { nr: string; navn: string } }[]>(
      'https://api.dataforsyningen.dk/postnumre/autocomplete',
      { query: { q } },
    )

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
    })
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

  .get('/listing-types', async (c) => {
    const types = await db.query.listingTypesTable.findMany({
      orderBy: (type, { asc }) => [asc(type.name)],
    })

    return c.json(types)
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
          mainImgUrl: updatedListing.images?.[0]?.src ?? listingJson.imageUrl,
          mainImgAlt: updatedListing.images?.[0]?.alt ?? listingJson.imageAlt,
          floors: updatedListing.floors,
          yearBuilt: updatedListing.yearBuilt,
          yearRenovated: updatedListing.yearRenovated,
        })
        .returning()
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
