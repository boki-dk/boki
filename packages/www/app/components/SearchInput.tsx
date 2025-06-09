import type { AppType } from 'api/src/index'
import type { ExtractSchema } from 'hono/types'
import { useEffect, useState } from 'react'
import { ofetch } from 'ofetch'
import { AutoComplete } from './ui/autocomplete'
import { useQuery } from '@tanstack/react-query'

type SearchResult = ExtractSchema<AppType>['/search']['$get']['output']

export function SearchInput({ className }: { className?: string }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [searchQuery, 500])

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['searchResults', debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch) {
        return { postalCodes: [], addresses: [], municipalities: [] }
      }

      const results = await ofetch<SearchResult>(`https://api.boki.dk/search`, { query: { q: debouncedSearch } })

      return results
    },
  })

  return (
    <AutoComplete
      className={className}
      searchValue={searchQuery}
      onSearchValueChange={setSearchQuery}
      items={[
        ...(searchResults?.municipalities?.map((searchResult) => ({
          value: searchResult.url,
          label: searchResult.displayName.split(' ').slice(1).join(' '), // Remove kommunekode prefix
          group: 'Kommune',
        })) ?? []),
        ...(searchResults?.postalCodes?.map((searchResult) => ({
          value: searchResult.url,
          label: searchResult.displayName,
          group: 'Postnummer',
        })) ?? []),
        ...(searchResults?.addresses?.map((searchResult) => ({
          value: searchResult.url,
          label: searchResult.displayName,
          group: 'Adresse',
        })) ?? []),
      ]}
      emptyMessage="Ingen resultater fundet."
      isLoading={isLoading}
    />
  )
}
