import { Button } from '~/components/ui/button'
import type { Route } from './+types/listings'
import { ofetch } from 'ofetch'
import type { AppType } from 'api/src/index'
import type { ExtractSchema } from 'hono/types'
import { ListingTeaser } from '~/components/ListingTeaser'
import InfiniteScroll from 'react-infinite-scroller'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'

type ListingsResponse = ExtractSchema<AppType>['/listings']['$get']['output']
type Listings = ListingsResponse['listings']

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Boliger | Boki' }, { name: 'description', content: 'Find dit næste hjem med Boki' }]
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url)
  const page = Number(url.searchParams.get('page') ?? '1')
  const pageSize = Number(url.searchParams.get('pageSize') ?? '15')
  const offset = (page - 1) * pageSize

  // fetch the real API on the server
  const listingsResponse = await ofetch<ListingsResponse>('https://api.boki.dk/listings', { params: { offset } })

  return { ...listingsResponse, page, pageSize }
}
// export async function clientLoader({
//   serverLoader,
//   params,
// }: Route.ClientLoaderArgs) {
//   const serverData = await serverLoader();

//   if (serverData)
// }

export default function Listings({ loaderData }: Route.ComponentProps) {
  const { count, listings, hasMore, page, pageSize } = loaderData

  return (
    <div className="flex flex-col min-h-screen py-12 max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold mb-2">Søg boliger</h1>
      <p className="mb-8 text-xl">Find dit næste hjem med Boki</p>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {listings.map((listing) => (
          <ListingTeaser key={listing.id} listing={listing} />
        ))}
      </div>
      <div className="flex items-center justify-between mt-8">
        <div>
          {page != 1 && (
            <Link to={`/boliger?page=${page - 1}&pageSize=${pageSize}`}>
              <Button>Page {page - 1}</Button>
            </Link>
          )}
        </div>

        <p>Page {page}</p>

        <div>
          {hasMore && (
            <Link to={`/boliger?page=${page + 1}&pageSize=${pageSize}`}>
              <Button> Page {page + 1}</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
