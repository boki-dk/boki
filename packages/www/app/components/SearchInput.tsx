import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '~/components/ui/command'
import type { AppType } from 'api/src/index'
import type { ExtractSchema } from 'hono/types'
import { use, useEffect, useState } from 'react'
import { ofetch } from 'ofetch'

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

  useEffect(() => {
    if (debouncedSearch) {
      ofetch<SearchResult>(`https://api.boki.dk/search`, { query: { q: searchQuery } }).then((results) => {
        if (results.length > 0) {
          setSearchResults(results.slice(0, 7))
        }
      })
    } else {
      setSearchResults([])
    }
  }, [debouncedSearch])

  return (
    <Command>
      <CommandInput placeholder="Søg efter boliger" value={searchQuery} onValueChange={setSearchQuery} />
      <CommandList>
        <CommandGroup>
          {searchResults.map((searchResult) => (
            <CommandItem>{searchResult.displayName}</CommandItem>
          ))}
        </CommandGroup>
        {/* <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem>Profile</CommandItem>
          <CommandItem>Billing</CommandItem>
          <CommandItem>Settings</CommandItem>
        </CommandGroup> */}
      </CommandList>
    </Command>
  )
}
