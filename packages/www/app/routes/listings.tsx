/*
listings page (/boliger)
*/
import { Button } from '~/components/ui/button'
import type { Route } from './+types/listings'
import { ofetch } from 'ofetch'
import type { AppType } from 'api/src/index'
import type { ExtractSchema } from 'hono/types'
import { ListingTeaser } from '~/components/ListingTeaser'
import { NavLink } from 'react-router'
import { SearchMenu } from '~/components/SearchMenu'
import { SortDropdown } from '~/components/SortDropdown'
import { Icon } from '@iconify/react'

type ListingsResponse = ExtractSchema<AppType>['/listings']['$get']['output']
type Listings = ListingsResponse['listings']

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Søg boliger | Boki' }, { name: 'description', content: 'Find dit næste hjem med Boki' }]
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url)
  const page = Number(url.searchParams.get('page') ?? '1')
  const pageSize = Number(url.searchParams.get('pageSize') ?? '15')
  const postalCode = url.searchParams.get('postal-code') ?? undefined
  const municipality = url.searchParams.get('municipality') ?? undefined
  const street = url.searchParams.get('street') ?? undefined
  const params = new URLSearchParams(url.search)
  params.delete('page')
  params.delete('pageSize')
  params.set('offset', ((page - 1) * pageSize).toString()) // i think this offset makes sense

  // fetch the real API on the server
  const listingsResponse = await ofetch<ListingsResponse>('https://api.boki.dk/listings?' + params.toString())

  const municipalityName = municipality
    ? (await ofetch<{ navn: string }>(`https://api.dataforsyningen.dk/kommuner/${municipality}`)).navn
    : undefined
  const postalCodeName = postalCode
    ? await ofetch<{ nr: string; navn: string }>(`https://api.dataforsyningen.dk/postnumre/${postalCode}`)
    : undefined
  const typesResponse = await ofetch<ExtractSchema<AppType>['/listing-types']['$get']['output']>('https://api.boki.dk/listing-types')

  //   //because url.searchparams can't be serialized to JSON, we need to convert it to a plain object??
  const searchParamsObj: Record<string, string> = {}
  for (const [key, value] of url.searchParams.entries()) {
    if (key !== 'page' && key !== 'pageSize') {
      searchParamsObj[key] = value
    }
  }

  return {
    ...listingsResponse,
    page,
    pageSize,
    typesResponse,
    municipalityName,
    street,
    postalCodeName: postalCodeName ? postalCodeName?.nr + ' ' + postalCodeName?.navn : undefined,
    searchParams: searchParamsObj,
  }
}
// export async function clientLoader({
//   serverLoader,
//   params,
// }: Route.ClientLoaderArgs) {
//   const serverData = await serverLoader();

//   if (serverData)
// }

export default function Listings({ loaderData }: Route.ComponentProps) {
  const { count, listings, hasMore, page, pageSize, typesResponse, municipalityName, street, postalCodeName, searchParams } = loaderData

  const params = new URLSearchParams(searchParams)

  return (
    <div className="flex flex-col min-h-screen py-2 md:py-4 lg:py-8 px-6 md:px-8 lg:px-12 max-w-8xl mx-auto">
      <h1 className="text-4xl font-bold mb-2">
        Søg boliger
        {street || municipalityName || postalCodeName ? (
          <NavLink
            to={`/boliger?${(() => {
              const newParams = new URLSearchParams(params)
              newParams.delete('municipality')
              newParams.delete('postal-code')
              newParams.delete('street')
              return newParams.toString()
            })()}`}
            className="ml-2 inline-flex items-center gap-1 bg-gray-200 px-2 py-2 rounded-xl"
          >
            {street
              ? `på ${street} ${municipalityName || postalCodeName}`
              : municipalityName
                ? `i ${municipalityName} Kommune`
                : postalCodeName
                  ? `i ${postalCodeName}`
                  : ''}
            <Icon icon="mdi:window-close" className="ml-1" />
          </NavLink>
        ) : (
          ' i Danmark'
        )}
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 auto-rows-max">
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
