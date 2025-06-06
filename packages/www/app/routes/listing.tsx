import type { Route } from './+types/listing'
import { ofetch } from 'ofetch'
import type { AppType } from 'api/src/index'
import type { ExtractSchema } from 'hono/types'
import useEmblaCarousel from 'embla-carousel-react'
import { useCallback, useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import { Link, useNavigate } from 'react-router'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures'
import { Map } from '~/components/Map.client'

type Listing = ExtractSchema<AppType>['/listings/:listingId']['$get']['output']

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Boliger | Boki' }, { name: 'description', content: 'Find dit næste hjem med Boki' }]
}

export async function loader({ params }: Route.LoaderArgs) {
  return { listing: await ofetch<Listing>(`https://api.boki.dk/listings/${params.slug}`) }
}

export default function Listings({ loaderData }: Route.ComponentProps) {
  const { listing } = loaderData

  if ('error' in listing) {
    return <div>Listing not found</div>
  }

  const [emblaRef, emblaApi] = useEmblaCarousel({}, [WheelGesturesPlugin()])

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  const scrollToFloorPlan = useCallback(() => {
    const floorPlanIndex = listing.images.findIndex((image) => image.type !== null && image.type === 'floorplan')
    if (floorPlanIndex !== -1 && emblaApi) {
      emblaApi.scrollTo(floorPlanIndex)
    }
  }, [emblaApi, listing.images])

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  })

  const navigate = useNavigate()

  return (
    <div className="px-12 max-w-8xl mx-auto">
      {mounted && history.length > 1 && (
        <button className="mb-4 mr-auto flex items-center gap-2 cursor-pointer" onClick={() => navigate(-1)}>
          <Icon icon="mdi:arrow-left" />
          Tilbage
        </button>
      )}
      <div className="flex flex-col gap-10">
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 bg-gray-100 rounded-lg">
            <Card>
              <CardContent>
                <div className="embla relative">
                  <div className="embla__viewport overflow-hidden aspect-video" ref={emblaRef}>
                    <div className="embla__container flex">
                      {listing.images.map((image) => (
                        <div className="embla__slide min-w-0 flex-none basis-full" key={image.id}>
                          <img className="object-contain aspect-video" src={image.url} alt={image.alt ?? undefined} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <button className="embla__prev absolute bottom-2 left-[calc(50%-2rem)] cursor-pointer" onClick={scrollPrev}>
                    <Icon icon="material-symbols:arrow-circle-left-outline" className="w-8 h-8" />
                  </button>
                  <button className="embla__next absolute bottom-2 left-[calc(50%+2rem)] cursor-pointer" onClick={scrollNext}>
                    <Icon icon="material-symbols:arrow-circle-right-outline" className="w-8 h-8" />
                  </button>
                  {listing.images.some((image) => image.type === 'floorplan') && (
                    <Button
                      className="bottom-6 left-6 absolute text-white bg-gradient-to-r from-pink-500 to-red-500 rounded-2xl cursor-pointer"
                      onClick={scrollToFloorPlan}
                    >
                      Hop til plantegning
                    </Button>
                  )}
                  {listing.status !== 'active' &&
                    (listing.status === 'sold' ? (
                      <span className="absolute bottom-6 right-6 bg-red-500 text-white font-bold text-3xl px-3 py-2 rounded">SOLGT</span>
                    ) : (
                      <span className="absolute bottom-6 right-6 bg-yellow-500 text-white font-bold text-3xl px-3 py-2 rounded">
                        RESERVERET
                      </span>
                    ))}
                </div>
              </CardContent>
              <CardFooter className="font-bold text-4xl py-2">{listing.address.displayName}</CardFooter>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="font-extrabold text-4xl">Detaljer</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
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
                <li className="flex justify-center py-5">
                  <Link
                    className="font-bold text-white text-2xl bg-gradient-to-r from-pink-500 to-red-500  px-4 py-2 rounded-2xl outline-3 outline-blue-500 hover:outline-6 transition-all duration-300"
                    to={listing.sourceUrl}
                  >
                    Gå til mægler
                  </Link>
                </li>
              </ul>
            </CardContent>
          </Card>
          <Card className="col-span-3">
            <CardContent>
              {/* trust me bro it's fine */}
              {listing.description && <div className="text-gray-700" dangerouslySetInnerHTML={{ __html: listing.description }} />}
              {/* really bro trust me it's fine, don't even worry about it */}
            </CardContent>
          </Card>
        </div>
        <div className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border shadow-sm">
          {mounted && <Map listing={listing} />}
        </div>
      </div>
    </div>
  )
}
