import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '~/components/ui/command'
import type { AppType } from 'api/src/index'
import type { ExtractSchema } from 'hono/types'

type SearchResult = ExtractSchema<AppType>['/search']['$get']['output']

export function SearchInput() {
  return (
    <Command>
      <CommandInput placeholder="Søg efter boliger" />
      <CommandList>
        <CommandEmpty>Fandt ingen boliger der matchede søgningen</CommandEmpty>
        <CommandGroup heading="Adresser">
          {}
          <CommandItem>Calendar</CommandItem>
          <CommandItem>Search Emoji</CommandItem>
          <CommandItem>Calculator</CommandItem>
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
