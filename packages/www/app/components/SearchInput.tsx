import type { AppType } from 'api/src/index'
import type { ExtractSchema } from 'hono/types'
import { useEffect, useState } from 'react'
import { ofetch } from 'ofetch'
import { AutoComplete } from './ui/autocomplete'
import { useQuery } from '@tanstack/react-query'

type SearchResult = ExtractSchema<AppType>['/search']['$get']['output']

export function SearchInput() {
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
      const results = await ofetch<SearchResult>(`https://api.boki.dk/search`, { query: { q: debouncedSearch } })

      return results
    },
  })

  return (
    <AutoComplete
      searchValue={searchQuery}
      onSearchValueChange={setSearchQuery}
      items={searchResults?.map((searchResult) => ({ value: searchResult.url, label: searchResult.displayName })) ?? []}
      emptyMessage="Ingen resultater fundet."
      isLoading={isLoading}
    />
  )
}
