import type { Route } from './+types/listing'
import { ofetch } from 'ofetch'
import type { AppType } from 'api/src/index'
import type { ExtractSchema } from 'hono/types'

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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1>Bolig {listing.address.displayName}</h1>
      {listing.mainImgUrl && listing.mainImgAlt && <img src={listing.mainImgUrl} alt={listing.mainImgAlt} />}
    </div>
  )
}
