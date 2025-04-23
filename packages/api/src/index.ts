import '@dotenvx/dotenvx/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { ofetch } from 'ofetch'
import { drizzle } from 'drizzle-orm/node-postgres'
import { addressesTable, listingsTable, listingTypesTable, scrapedListingsTable } from './db/schema.js'
import { and, eq, isNull, sql } from 'drizzle-orm'
import { hash } from 'ohash'

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
  const listings = await db.select().from(scrapedListingsTable).limit(10)
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

app.post('/nybolig/process-listing', async (c) => {
  const scrapedListing = (
    await db
      .select()
      .from(scrapedListingsTable)
      .where(
        and(
          eq(scrapedListingsTable.externalSource, 'nybolig'),
          isNull(scrapedListingsTable.listingId),
          sql`${scrapedListingsTable.json}->>'siteName' = 'nybolig'`,
        ),
      )
      .limit(1)
  )[0]

  if (!scrapedListing) {
    return c.json({ error: 'No listings found' }, 404)
  }
  const listingJson = scrapedListing.json as {
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

  const cleanedAddress = await ofetch<{
    kategori: string
    resultater: {
      adresse: {
        id: string
      }
    }[]
  }>('https://api.dataforsyningen.dk/datavask/adresser', {
    query: { betegnelse: listingJson.addressDisplayName },
  })

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
  }>(`https://api.dataforsyningen.dk/adresser/${cleanedAddress.resultater[0].adresse.id}`, {
    query: { struktur: 'mini' },
  })

  const listing = await db.transaction(async (tx) => {
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

    const existingType = (await tx.select().from(listingTypesTable).where(eq(listingTypesTable.name, listingJson.type)).limit(1))[0]

    const typeRows = existingType
      ? [existingType]
      : await tx
          .insert(listingTypesTable)
          .values({
            name: listingJson.type,
          })
          .returning()

    const listingRows = await tx
      .insert(listingsTable)
      .values({
        source: 'nybolig',
        sourceUrl: `https://nybolig.dk${listingJson.url}`,
        addressId: addressRows[0].id,
        typeId: typeRows[0].id,
        areaLand: listingJson.propertySize,
        areaFloor: listingJson.livingSpace,
        price: listingJson.cashPrice,
        energyClass: listingJson.energyClassification,
        rooms: listingJson.totalNumberOfRooms,
        mainImgUrl: listingJson.imageUrl,
        mainImgAlt: listingJson.imageAlt,
      })
      .returning()
    return listingRows[0]
  })
  await db
    .update(scrapedListingsTable)
    .set({
      listingId: listing.id,
    })
    .where(eq(scrapedListingsTable.id, scrapedListing.id))
  return c.json(listing)
})

app.get('/nicholas', async (c) => {
  const pic = await fetch(
    'https://scontent-arn2-1.xx.fbcdn.net/v/t39.30808-6/475109658_9069525056457562_3129244202056342124_n.jpg?_nc_cat=100&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=KTd2BlukMygQ7kNvwGnTH6a&_nc_oc=AdnPKMiSEl-p_WvbrJjQTiJ5-Qy9vqotyOl-OdgkRoX4Yk8hUgLl58GtVdDfBKml9Ck&_nc_zt=23&_nc_ht=scontent-arn2-1.xx&_nc_gid=7o4dBGi1OX3_h6Wh6eqCzA&oh=00_AfFmeJx5EKOYW0EYRgBV-kcuIILe0QcdBrmm80Ju9cW30A&oe=67FC25AF',
  )

  const buffer = await pic.arrayBuffer()

  return c.body(buffer, 200, {
    'Content-Type': 'image/jpeg',
    'Content-Disposition': 'inline; filename="pic.jpg"',
  })
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
