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
  const formatter = new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
  })
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <Button> Boki.dk</Button>
      <h1>Boliger</h1>
      <ul>
        <table>
          {listings.map((listing) => (
            <tr>
              <th>{listing.address.displayName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</th>
              <th>
                &nbsp;
                {formatter.format(listing.price)}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              </th>
              <th>
                &nbsp;
                <Link to={`/bolig/${listing.id}`} className="text-blue-600">
                  {' '}
                  Link!{' '}
                </Link>
              </th>
            </tr>
          ))}
        </table>
      </ul>
    </div>
  )
}
