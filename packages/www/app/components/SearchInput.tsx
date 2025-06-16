/*
A for our use case react component for searching listings.
Mostly an autocomplete input that fetches search results from the API.
*/
import type { AppType } from 'api/src/index'
import type { ExtractSchema } from 'hono/types'
import { useEffect, useState } from 'react'
import { ofetch } from 'ofetch'
import { AutoComplete } from './ui/autocomplete'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router'

type SearchResult = ExtractSchema<AppType>['/search']['$get']['output']

export function SearchInput({ className }: { className?: string }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  //debounce the search query to avoid too many requests to the API
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [searchQuery, 500])

  //use the debounced search query to fetch the search results
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['searchResults', debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch) {
        return { postalCodes: [], addresses: [], municipalities: [], streetsAndPostalCodes: [] } as SearchResult
      }

      const results = await ofetch<SearchResult>(`https://api.boki.dk/search`, { query: { q: debouncedSearch } })

      return results
    },
  })
  const [searchParams, setSearchParams] = useSearchParams() //maybe use useLocation instead?
  searchParams.delete('postal-code')
  searchParams.delete('municipality')
  searchParams.delete('street')
  return (
    <AutoComplete
      className={className}
      searchValue={searchQuery}
      onSearchValueChange={setSearchQuery}
      // items is the list of items to display in the dropdown, the searchResults
      items={[
        ...(searchResults?.municipalities?.map((searchResult) => {
          return {
            value: searchResult.url + (searchParams.toString() ? '&' + searchParams.toString() : ''),
            label: searchResult.displayName.split(' ').slice(1).join(' '), // Remove kommunekode prefix
            group: 'Kommune',
          }
        }) ?? []),
        ...(searchResults?.postalCodes?.map((searchResult) => {
          return {
            value: searchResult.url + (searchParams.toString() ? '&' + searchParams.toString() : ''),
            label: searchResult.displayName,
            group: 'Postnummer',
          }
        }) ?? []),
        ...(searchResults?.streetsAndPostalCodes?.map((searchResult) => ({
          value: searchResult.url + (searchParams.toString() ? '&' + searchParams.toString() : ''),
          label: searchResult.displayName,
          group: 'Gade',
        })) ?? []),
        ...(searchResults?.addresses?.map((searchResult) => ({
          value: searchResult.url, //single listings
          label: searchResult.displayName,
          group: 'Adresse',
        })) ?? []),
      ]}
      emptyMessage="Ingen resultater fundet."
      isLoading={isLoading}
    />
  )
}
