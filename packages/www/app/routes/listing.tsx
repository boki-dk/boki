/*
Individual listing page
*/
import type { Route } from './+types/listing'
import { ofetch } from 'ofetch'
import type { AppType } from 'api/src/index'
import type { ExtractSchema } from 'hono/types'
import useEmblaCarousel from 'embla-carousel-react'
import { useCallback, useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import { Link, useNavigate, type HeadersArgs } from 'react-router'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures'
import { Map } from '~/components/Map.client'
import { Image } from '~/components/Image'

type Listing = ExtractSchema<AppType>['/listings/:listingUrlKey']['$get']['output']

const TITLE_POSTFIX = ' | Boki'

export function headers({ parentHeaders }: HeadersArgs) {
  parentHeaders.set('Cache-Control', 'public, s-maxage=3600')
  return parentHeaders
}

export function meta({ data }: Route.MetaArgs) {
  const listing = data?.listing
  if (!listing || 'error' in listing) {
    return [{ title: 'Boliger | Boki' }, { name: 'description', content: 'Find dit næste hjem med Boki' }]
  }

  const statusPrefix =
    listing.status === 'sold'
      ? 'Solgt'
      : listing.status === 'reserved'
        ? 'Reserveret'
        : listing.status === 'active'
          ? 'Til salg'
          : 'Inaktiv'

  const title = `${statusPrefix} - ${listing.address.displayName} ${TITLE_POSTFIX}`

  const description = listing.description
    ? listing.description.replace(/<[^>]+>/g, '').substring(0, 160) + '...'
    : 'Find dit næste hjem med Boki'

  const image = listing.mainImgUrl

  return [
    { title },
    { name: 'description', content: description },
    { name: 'og:title', content: title },
    { name: 'og:description', content: description },
    ...(image ? [{ name: 'og:image', content: image }] : []),
    { name: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    ...(image ? [{ name: 'twitter:image', content: image }] : []),
  ]
}

export async function loader({ params }: Route.LoaderArgs) {
  return { listing: await ofetch<Listing>(`https://api.boki.dk/listings/${params.slug}`) }
}

export default function Listings({ loaderData }: Route.ComponentProps) {
  const { listing } = loaderData

  if ('error' in listing) {
    return <div>Listing not found</div>
  }

  // image carousel setup
  const [emblaRef, emblaApi] = useEmblaCarousel({}, [WheelGesturesPlugin()])

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  const floorPlanIndex = listing.images.findIndex((image) => image.type !== null && image.type === 'floorplan')

  const scrollToFloorPlan = useCallback(() => {
    if (floorPlanIndex !== -1 && emblaApi) {
      emblaApi.scrollTo(floorPlanIndex)
    }
  }, [emblaApi, floorPlanIndex])

  const scrollFirst = useCallback(() => {
    if (emblaApi) emblaApi.scrollTo(0)
  }, [emblaApi])

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  })

  const navigate = useNavigate()

  return (
    <div className="px-6 md:px-8 lg:px-12 max-w-8xl mx-auto">
      {mounted && history.length > 1 && (
        <button className="mb-4 mr-auto flex items-center gap-2 cursor-pointer" onClick={() => navigate(-1)}>
          <Icon icon="mdi:arrow-left" />
          Tilbage
        </button>
      )}
      <div className="flex flex-col gap-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="embla relative">
              <div className="embla__viewport overflow-hidden aspect-video rounded-lg shadow-sm select-none" ref={emblaRef}>
                <div className="embla__container flex">
                  {listing.images.map((image, index) => (
                    <div className="embla__slide min-w-0 flex-none basis-full" key={image.id}>
                      <Image
                        className="object-contain aspect-video"
                        src={image.url}
                        alt={image.alt ?? undefined}
                        width={1600}
                        height={900}
                        loading={index === 0 || index === floorPlanIndex ? 'eager' : 'lazy'}
                        fetchPriority={index === 0 || index === floorPlanIndex ? 'high' : 'low'}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <button className="embla__prev absolute left-0 top-[calc(50%-1.25rem)] cursor-pointer" onClick={scrollPrev}>
                <Icon icon="ic:round-arrow-back-ios" className="w-10 h-10 text-gray-100 drop-shadow-sm" />
              </button>
              <button className="embla__next absolute right-0 top-[calc(50%-1.25rem)] cursor-pointer" onClick={scrollNext}>
                <Icon icon="ic:round-arrow-forward-ios" className="w-10 h-10 text-gray-100 drop-shadow-sm" />
              </button>
              {listing.images.some((image) => image.type === 'floorplan') && (
                <div className="flex gap-2 absolute bottom-2 left-2">
                  <button className="cursor-pointer bg-gray-100 rounded p-1 shadow-sm" onClick={scrollFirst}>
                    <Icon icon="carbon:image" className="w-7 h-7 text-gray-600" />
                  </button>
                  <button className="cursor-pointer bg-gray-100 rounded p-1.5 shadow-sm" onClick={scrollToFloorPlan}>
                    <Icon icon="carbon:floorplan" className="w-6 h-6 text-gray-600" />
                  </button>
                </div>
                // <Button
                //   variant="outline"
                //   className="bg-gradient-to-r from-pink-500 to-red-500 hover:bg-gradient-to-r hover:from-pink-600 hover:to-red-600 text-white absolute bottom-2 left-2"
                //   onClick={scrollToFloorPlan}
                // >
                //   Hop til plantegning
                // </Button>
              )}
              {listing.status !== 'active' &&
                (listing.status === 'sold' ? (
                  <span className="absolute bottom-2 right-2 bg-red-500 text-gray-100 font-bold text-xl px-2.5 py-1 rounded-md shadow-sm select-none">
                    SOLGT
                  </span>
                ) : (
                  <span className="absolute bottom-2 right-2 bg-yellow-500 text-gray-100 font-bold text-xl px-2.5 py-1 rounded-md shadow-sm select-none">
                    RESERVERET
                  </span>
                ))}
            </div>

            <div className="font-bold text-4xl pb-2 pt-6">{listing.address.displayName}</div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="font-extrabold text-4xl">Detaljer</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex">
                  <span className="font-extrabold mr-2 shrink-0">Adresse:</span>{' '}
                  <span className="ml-auto flex-1 text-right break-words">{listing.address.displayName}</span>
                </li>
                {listing.status !== 'sold' && (
                  <li className="flex">
                    <span className="font-extrabold">Pris:</span>
                    <span className="ml-auto">{listing.price} kr.</span>
                  </li>
                )}
                {listing.areaFloor !== 0 && (
                  <li className="flex">
                    <span className="font-extrabold">Størrelse:</span> <span className="ml-auto">{listing.areaFloor} m²</span>
                  </li>
                )}
                {listing.areaBasement !== 0 && (
                  <li className="flex">
                    <span className="font-extrabold">Kælderareal:</span> <span className="ml-auto">{listing.areaBasement} m²</span>
                  </li>
                )}
                {listing.areaLand !== 0 && (
                  <li className="flex">
                    <span className="font-extrabold">Grundareal:</span> <span className="ml-auto">{listing.areaLand} m²</span>
                  </li>
                )}
                <li className="flex">
                  <span className="font-extrabold">Værelser:</span> <span className="ml-auto">{listing.rooms}</span>
                </li>
                {listing.bathroomCount !== null && (
                  <li className="flex">
                    <span className="font-extrabold">Badeværelser:</span> <span className="ml-auto">{listing.bathroomCount}</span>
                  </li>
                )}
                {listing.floors !== null && (
                  <li className="flex">
                    <span className="font-extrabold">Etager:</span> <span className="ml-auto">{listing.floors}</span>
                  </li>
                )}
                {listing.yearBuilt && (
                  <li className="flex">
                    <span className="font-extrabold"> {listing.yearRenovated ? 'Opført / Renoveret' : 'Opført'} </span>
                    <span className="ml-auto">
                      {listing.yearRenovated ? `${listing.yearBuilt} / ${listing.yearRenovated}` : listing.yearBuilt}
                    </span>
                  </li>
                )}
                <li className="flex">
                  <span className="font-extrabold">Oprettet:</span>
                  <span className="ml-auto">{new Date(listing.createdAt).toLocaleDateString()}</span>
                </li>
                <li className="flex justify-center pt-4">
                  <Link to={listing.sourceUrl}>
                    <Button
                      variant="outline"
                      className="w-full bg-gradient-to-r from-pink-500 to-red-500 hover:bg-gradient-to-r hover:from-pink-600 hover:to-red-600 text-white"
                    >
                      Gå til mægler
                    </Button>
                  </Link>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardContent>
            {/* trust me bro it's fine */}
            {listing.description && <div className="text-gray-700" dangerouslySetInnerHTML={{ __html: listing.description }} />}
            {/* really bro trust me it's fine, don't even worry about it */}
          </CardContent>
        </Card>
        <div className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border shadow-sm">
          {mounted && <Map listing={listing} />}
        </div>
      </div>
    </div>
  )
}
