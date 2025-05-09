import { Button } from '~/components/ui/button'
import type { Route } from './+types/listings'
import { ofetch } from 'ofetch'
import type { AppType } from 'api/src/index'
import type { ExtractSchema } from 'hono/types'
import { ListingTeaser } from '~/components/ListingTeaser'
import InfiniteScroll from 'react-infinite-scroller' 
import { useEffect, useState } from 'react'

type Listings = ExtractSchema<AppType>['/listings']['$get']['output']

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Boliger | Boki' }, { name: 'description', content: 'Find dit næste hjem med Boki' }]
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url)
  const offset = url.searchParams.get('offset') ?? '0'

  // fetch the real API on the server
  const listings = await ofetch<Listings>(
    'https://api.boki.dk/listings',
    { params: { offset } }
  )

  return { listings }
}
// export async function clientLoader({
//   serverLoader,
//   params,
// }: Route.ClientLoaderArgs) {
//   const serverData = await serverLoader();

//   if (serverData)
// }



export default function Listings({ loaderData }: Route.ComponentProps) {
  
  const initialListings = loaderData.listings
  const [listings, setListings] = useState<Listings>(initialListings)
  const [page, setPage] = useState(1) // Start at 1 since initial listings are page 0
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    console.log('💧 Listings component hydrated')
  }, [])

  const loadFunc = async () => {
    console.log('Loading page:', page)
    if (isLoading) return
  
    setIsLoading(true)
    try {
      const { listings: data } = await ofetch<{ listings: Listings }>(
  `/listings?offset=${page}`
  )  
      
      if (data && data.length > 0) {
        // Append new listings to existing ones
        setListings(prevListings => [...prevListings, ...data])
        setPage(prevPage => prevPage + 1)
      } else {
        // No more listings to load
        setHasMore(false)
      }
    } catch (error) {
      console.error('Error loading more listings:', error)
      setHasMore(false)
    } finally {
      setIsLoading(false)
    }
  }

  const forceLoadMore = () => {
    console.log('Force loading more listings')
    loadFunc();
  }

  return (
    <div className="flex flex-col min-h-screen py-12 max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold mb-2">Søg boliger</h1>
      <p className="mb-8 text-xl">Find dit næste hjem med Boki</p>

      <Button onClick={forceLoadMore} className="mb-4">
      Load More (Debug)
      </Button>

      
      <InfiniteScroll
        pageStart={0}
        loadMore={loadFunc}
        hasMore={true}
        threshold={100}
        useWindow={true}
        loader={<div className='loader' key={0}>Henter nye boliger...</div>}>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <ListingTeaser key={listing.id} listing={listing} />
          ))}

        

      </div>
      </InfiniteScroll>
    </div>
  )
}
