import { Button } from '~/components/ui/button'
import type { Route } from './+types/listings'
import { ofetch } from 'ofetch'
import { Link } from 'react-router'
import type { AppType } from 'api/src/index'
import type { ExtractSchema } from 'hono/types'

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
    <div>
      <h1>Boliger</h1>
      <Button>Flot Knap</Button>
      <ul>
        {listings.map((listing) => (
          <li>
            {listing.address.displayName} - som koster {listing.price}.{' '}
            <Link to={`/bolig/${listing.id}`} className="text-blue-600">
              {' '}
              Læs mere her{' '}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
