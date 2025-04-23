import { Button } from '~/components/ui/button'
import type { Route } from './+types/listings'
import { ofetch } from 'ofetch'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Boliger | Boki' }, { name: 'description', content: 'Find dit næste hjem med Boki' }]
}

export async function loader({ params }: Route.LoaderArgs) {
  return { listings: await ofetch('https://api.boki.dk/listings') }
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
      <Button>Knap</Button>
      <ul>
        {listings.map((listing) => (
          <li>{listing.address.displayName} - som koster {listing.price}. Læs mere her: </li>
        ))}
      </ul>
    </div>
  )
}
