import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '~/components/ui/command'
import type { AppType } from 'api/src/index'
import type { ExtractSchema } from 'hono/types'
import { use, useEffect, useState } from 'react'
import { ofetch } from 'ofetch'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Button } from './ui/button'
import { AutoComplete } from './ui/AutoComplete'
import { useQuery } from '@tanstack/react-query'

type SearchResult = ExtractSchema<AppType>['/search']['$get']['output']

export function SearchInput() {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult>([])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [searchQuery, 500])

  // useEffect(() => {
  //   if (debouncedSearch) {
  //     ofetch<SearchResult>(`https://api.boki.dk/search`, { query: { q: searchQuery } }).then((results) => {
  //       if (results.length > 0) {
  //         setSearchResults(results.slice(0, 7))
  //       }
  //     })
  //   } else {
  //     setSearchResults([])
  //   }
  // }, [debouncedSearch])

  const [searchValue, setSearchValue] = useState<string>('')
  const [selectedValue, setSelectedValue] = useState<string>('')

  const { data, isLoading } = useQuery({
    queryKey: ['searchResults', debouncedSearch],
    queryFn: async () => {
      const results = await ofetch<SearchResult>(`https://api.boki.dk/search`, { query: { q: debouncedSearch } })
      if (results.length > 0) {
        setSearchResults(results.slice(0, 7))
      }
    },
  })

  return (
    <AutoComplete
      searchValue={searchQuery}
      onSearchValueChange={setSearchQuery}
      items={searchResults.map((searchResult) => ({ value: searchResult.url, label: searchResult.displayName }))}
    />
  )
}
