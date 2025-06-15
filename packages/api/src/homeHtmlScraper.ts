import '@dotenvx/dotenvx/config'
import { HTMLRewriter } from 'htmlrewriter'
import { listingStatusEnum } from './db/schema.js'
import { parse } from 'devalue'
import { destr } from 'destr'

export async function scrapeHomeListing(url: string) {
  const rewriter = new HTMLRewriter()

  const response = await fetch(url)

  let linkedDataString = ''

  // each of these rewriter.on take a css class selector, and from that, performs a function
  // here, storing the text content of the script tag with type "application/ld+json"
  rewriter.on('script[type="application/ld+json"]', {
    text: ({ text }) => {
      linkedDataString += text
    },
  })

  let nuxtDataString = ''

  rewriter.on('#__NUXT_DATA__', {
    text: ({ text }) => {
      nuxtDataString += text
    },
  })

  let title = ''

  rewriter.on('h2.h1', {
    text: ({ text }) => {
      title += text
    },
  })

  let pageTitle = ''

  rewriter.on('title', {
    text: ({ text }) => {
      pageTitle += text
    },
  })

  const _text = await rewriter.transform(response).text()

  if (!linkedDataString) {
    return { status: listingStatusEnum.enumValues[3] }
  }

  const id = url.split('/sag-').pop()?.slice(0, -1) ?? ''
  console.log('id', id)

  
  const nuxtData = parse(nuxtDataString, {
    NuxtError: (data) => data,
    EmptyShallowRef: (data) => ({ value: data === '_' ? undefined : data === '0n' ? BigInt(0) : destr(data) }),
    EmptyRef: (data) => ({ value: data === '_' ? undefined : data === '0n' ? BigInt(0) : destr(data) }),
    ShallowRef: (data) => ({ value: data }),
    ShallowReactive: (data) => data,
    Ref: (data) => ({ value: data }),
    Reactive: (data) => data,
  }).data?.[`case-${id}`] as
    | {
        propertyCategory: string
        isUnlisted: boolean
        isForSale: boolean
        isUnderSale: boolean
        isSold: boolean
        offer: {
          cashPrice: {
            amount: number
          }
        }
        stats: {
          energyLabel: string | '' // empty string for plot listings
          plotArea: number
          floorArea: number // 0 for plot listings
          basementArea: number // 0 for plot listings
          rooms: number // 0 for plot listings
          bathrooms: number // 0 for plot listings
          yearBuilt: string | null
          yearRenovated: string | null
          floors: number | null
        }
        salesPresentationDescription: string
        presentationMedia: {
          url: string
          description: string
          mediaType: 'Billede'
          priority: string
        }[]
        floorPlanMedia: {
          url: string
          description: string
          mediaType: 'Plantegning'
          priority: string
        }[]
      }
    | undefined

  if (!nuxtData) {
    return { status: listingStatusEnum.enumValues[3] }
  }

  return {
    title,
    description: nuxtData.salesPresentationDescription,
    type: nuxtData.propertyCategory,
    price: nuxtData.offer.cashPrice.amount,
    areaLand: nuxtData.stats.plotArea,
    areaFloor: nuxtData.stats.floorArea,
    areaBasement: nuxtData.stats.basementArea,
    rooms: nuxtData.stats.rooms || null,
    bathrooms: nuxtData.stats.bathrooms || null,
    yearBuilt: nuxtData.stats.yearBuilt ? Number(nuxtData.stats.yearBuilt.substring(0, 4)) : null,
    yearRenovated: nuxtData.stats.yearRenovated ? Number(nuxtData.stats.yearRenovated.substring(0, 4)) : null,

    energyClass: nuxtData.stats.energyLabel,
    floorplanImages: nuxtData.floorPlanMedia,
    images: nuxtData.presentationMedia,
    status: nuxtData.isUnderSale
      ? listingStatusEnum.enumValues[2]
      : nuxtData.isSold
        ? listingStatusEnum.enumValues[1]
        : listingStatusEnum.enumValues[0],
    floors: nuxtData.stats.floors,
    nuxtData: nuxtData,
  }
}
