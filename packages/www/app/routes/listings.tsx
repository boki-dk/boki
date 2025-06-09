import { Button } from '~/components/ui/button'
import type { Route } from './+types/listings'
import { ofetch } from 'ofetch'
import type { AppType } from 'api/src/index'
import type { ExtractSchema } from 'hono/types'
import { ListingTeaser } from '~/components/ListingTeaser'
import { NavLink } from 'react-router'
import { SearchMenu } from '~/components/SearchMenu'
import { SortDropdown } from '~/components/SortDropdown'

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
  const priceMin = url.searchParams.get('price-min')
  const priceMax = url.searchParams.get('price-max')
  const areaLandMin = url.searchParams.get('area-land-min')
  const areaLandMax = url.searchParams.get('area-land-max')
  const areaFloorMin = url.searchParams.get('area-floor-min')
  const areaFloorMax = url.searchParams.get('area-floor-max')
  const roomsMin = url.searchParams.get('rooms-min')
  const roomsMax = url.searchParams.get('rooms-max')
  const type = url.searchParams.get('type')
  const types = type?.split(',').map((t) => t.trim())
  const sortBy = (url.searchParams.get('sort-by') || 'created-at') as 'created-at' | 'price' | 'area-floor'
  const sortOrder = (url.searchParams.get('sort-order') || 'desc') as 'asc' | 'desc'
  const postalCode = url.searchParams.get('postal-code') ?? undefined
  const status = url.searchParams.get('status')
  const municipality = url.searchParams.get('municipality') ?? undefined

  // fetch the real API on the server
  const listingsResponse = await ofetch<ListingsResponse>('https://api.boki.dk/listings', {
    query: {
      offset,
      'price-min': priceMin ?? undefined,
      'price-max': priceMax ?? undefined,
      'area-land-min': areaLandMin ?? undefined,
      'area-land-max': areaLandMax ?? undefined,
      'area-floor-min': areaFloorMin ?? undefined,
      'area-floor-max': areaFloorMax ?? undefined,
      'rooms-min': roomsMin ?? undefined,
      'rooms-max': roomsMax ?? undefined,
      type: type ?? undefined,
      'sort-by': sortBy ?? undefined,
      'sort-order': sortOrder ?? undefined,
      'postal-code': postalCode ?? undefined,
      status: status ? status.split(',').map((s) => s.trim()) : undefined,
      municipality: municipality ?? undefined,
    },
  })

  const municipalityName = municipality ? (await ofetch<{navn: string}>(`https://api.dataforsyningen.dk/kommuner/${municipality}`)).navn : undefined
  const postalCodeName = 
  postalCode ?
   await ofetch<{nr: string, navn: string}>(`https://api.dataforsyningen.dk/postnumre/${postalCode}`) 
   : undefined
  const typesResponse = await ofetch<ExtractSchema<AppType>['/listing-types']['$get']['output']>('https://api.boki.dk/listing-types')

//   //because url.searchparams can't be serialized to JSON, we need to convert it to a plain object??
  const searchParamsObj: Record<string, string> = {};
for (const [key, value] of url.searchParams.entries()) {
  if (key !== 'page' && key !== 'pageSize') {
    searchParamsObj[key] = value;
  }
}
  

  return { ...listingsResponse, page, pageSize, typesResponse, municipalityName, postalCodeName: (postalCodeName ? postalCodeName?.nr + ' ' + postalCodeName?.navn : undefined), searchParams: searchParamsObj }
}
// export async function clientLoader({
//   serverLoader,
//   params,
// }: Route.ClientLoaderArgs) {
//   const serverData = await serverLoader();

//   if (serverData)
// }

export default function Listings({ loaderData }: Route.ComponentProps) {
  const { count, listings, hasMore, page, pageSize, typesResponse, municipalityName, postalCodeName, searchParams } = loaderData
  
  const params = new URLSearchParams(searchParams)


  return (
    <div className="flex flex-col min-h-screen py-2 md:py-4 lg:py-8 px-6 md:px-8 lg:px-12 max-w-8xl mx-auto">
      <h1 className="text-4xl font-bold mb-2">Søg boliger{municipalityName
    ? ` i ${municipalityName}`
    : postalCodeName
      ? ` i ${postalCodeName}`
      : ''}
</h1>
      <p className="mb-8 text-xl">Find dit næste hjem med Boki</p>

      <div className="mb-3">
        <SearchMenu typesResponse={typesResponse} />
      </div>

      <div className="flex items-center justify-between mb-3">
        <p className="text-muted-foreground">
          Fandt {count} {count === 1 ? 'bolig' : 'boliger'}
        </p>
        <SortDropdown />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((listing) => (
          <ListingTeaser key={listing.id} listing={listing} />
        ))}
      </div>
      <div className="flex items-center justify-between mt-8">
        <div>
          {page != 1 && (
            <NavLink to={`/boliger?${params.toString()}&page=${page - 1}&pageSize=${pageSize}`}>
              <Button>Side {page - 1}</Button>
            </NavLink>
          )}
        </div>

        <p>Side {page}</p>

        <div>
          {hasMore && (
            <NavLink to={`/boliger?${params.toString()}&page=${page + 1}&pageSize=${pageSize}`}>
              <Button>Side {page + 1}</Button>
            </NavLink>
          )}
        </div>
      </div>
    </div>
  )
}

