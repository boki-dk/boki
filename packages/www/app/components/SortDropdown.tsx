import { listingsRelations } from 'api/src/db/schema'
import type { AppType } from 'api/src/index'
import type { ExtractSchema } from 'hono/types'
import type { Dispatch, SetStateAction } from 'react'
import { useSearchParams } from 'react-router'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from '~/components/ui/select'

type SortDropdownProps = {
  sorting: string
  setAreaLandRange: Dispatch<SetStateAction<string>>
}
export function SortDropdown() {
  const [searchParams, setSearchParams] = useSearchParams()

  const SORTING_OPTIONS = {
    'created-at': { desc: 'Nyeste', asc: 'Ældste' },
    price: { asc: 'Laveste pris', desc: 'Højeste pris' },
    'area-floor': { desc: 'Mest gulvareal', asc: 'Mindst gulvareal' },
  } as const

  return (
    <Select
      defaultValue="Nyeste"
      onValueChange={(value) => {
      
        const [sortBy, sortOrder] = value.split('_') as [keyof typeof SORTING_OPTIONS, 'asc' | 'desc']

        setSearchParams((searchParams) => {
          if (sortBy != 'created-at') {
            searchParams.set('sort-by', sortBy)
          } else {
            searchParams.delete('sort-by')
          }
          if (sortOrder != 'desc') {
            searchParams.set('sort-order', sortOrder)
          } else {
            searchParams.delete('sort-order')
          }
          return searchParams
        })
      }}
      value={`${searchParams.get('sort-by') ?? 'created-at'}_${searchParams.get('sort-order') ?? 'desc'}`}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Sortering" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(SORTING_OPTIONS).map(([sortBy, options], index) => (
          <SelectGroup key={sortBy}>
            {Object.entries(options).map(([sortOrder, label]) => (
              <SelectItem key={`${sortBy}_${sortOrder}`} value={`${sortBy}_${sortOrder}`}>
                {label}
              </SelectItem>
            ))}
            {index < Object.keys(SORTING_OPTIONS).length - 1 && <SelectSeparator />}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  )
}
