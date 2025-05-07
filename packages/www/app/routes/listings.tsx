import { Button } from '~/components/ui/button'
import type { Route } from './+types/listings'
import { ofetch } from 'ofetch'
import type { AppType } from 'api/src/index'
import type { ExtractSchema } from 'hono/types'
import { ListingTeaser } from '~/components/ListingTeaser'

type Listings = ExtractSchema<AppType>['/listings']['$get']['output']

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Boliger | Boki' }, { name: 'description', content: 'Find dit næste hjem med Boki' }]
}

export async function loader({ params }: Route.LoaderArgs) {
  return { listings: await ofetch<Listings>('https://api.boki.dk/listings') }
}

// export async function clientLoader({
//   serverLoader,
//   params,
// }: Route.ClientLoaderArgs) {
//   const serverData = await serverLoader();

//   if (serverData)
// }

export default function Listings({ loaderData }: Route.ComponentProps) {
  const { listings } = loaderData

  return (
    <div className="flex flex-col min-h-screen py-12 max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold mb-2">Søg boliger</h1>
      <p className="mb-8 text-xl">Find dit næste hjem med Boki</p>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {listings.map((listing) => (
          <ListingTeaser key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  )
}
