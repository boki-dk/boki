import type { AppType } from 'api/src/index'
import type { ExtractSchema } from 'hono/types'
import { SearchInput } from './SearchInput'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Button } from './ui/button'
import { DualRangeSlider } from './ui/dualrangeslider'
import { useMemo, useState } from 'react'
import { currencyFormatter } from '~/lib/utils'
import { Check } from 'lucide-react'
import { Checkbox } from './ui/checkbox'
import { Label } from './ui/label'
import { Link } from 'react-router'
import { PrimarySearchFilters } from './PrimarySearchFilters'
import { AdvancedSearchFilters } from './AdvancedSearchFilters'

type SearchResult = ExtractSchema<AppType>['/search']['$get']['output']
type TypesResult = ExtractSchema<AppType>['/listing-types']['$get']['output'][number]

type ListingStatus = ExtractSchema<AppType>['/listings']['$get']['output']['listings'][number]['status']

export function SearchMenu({ typesResponse }: { typesResponse: TypesResult[] }) {
  //primary search filters
  const maxPriceInRange = 10000000
  const [priceRange, setPriceRange] = useState<[number, number]>([0, maxPriceInRange])
  const maxAreaInRange = 300
  const [areaRange, setAreaRange] = useState<[number, number]>([0, maxAreaInRange])
  //id of type
  const [types, setTypes] = useState<number[]>([])

  //advanced search filters
  const maxAreaLandRange = 10000
  const [areaLandRange, setAreaLandRange] = useState<[number, number]>([0, maxAreaLandRange])

  const maxRoomRange = 10
  const [roomRange, setRoomRange] = useState<[number, number]>([0, maxRoomRange])

  const maxFloorRange = 5
  const [floorRange, setFloorRange] = useState<[number, number]>([0, maxFloorRange])

  const minYearBuiltRange = 1800
  const [yearBuiltRange, setYearBuiltRange] = useState<[number, number]>([minYearBuiltRange, new Date().getFullYear()])

  const maxToiletRange = 5
  const [toiletRange, setToiletRange] = useState<[number, number]>([0, maxToiletRange])

  const [sorting, setSorting] = useState<string>('default') // TODO: sorting options
  const [status, setStatus] = useState<ListingStatus[]>(['active' as ListingStatus, 'reserved' as ListingStatus])

  const searchParams = useMemo(() => {
    const params = new URLSearchParams()

    if (priceRange[0] !== 0) {
      params.set('price-min', priceRange[0].toString())
    }
    if (priceRange[1] != maxPriceInRange) {
      params.set('price-max', priceRange[1].toString())
    }

    if (areaRange[0] !== 0) {
      params.set('area-floor-min', areaRange[0].toString())
    }
    if (areaRange[1] != maxAreaInRange) {
      params.set('area-floor-max', areaRange[1].toString())
    }

    if (areaLandRange[0] !== 0) {
      params.set('area-land-min', areaLandRange[0].toString())
    }
    if (areaLandRange[1] != maxAreaLandRange) {
      params.set('area-land-max', areaLandRange[1].toString())
    }

    if (roomRange[0] !== 0) {
      params.set('rooms-min', roomRange[0].toString())
    }
    if (roomRange[1] != maxRoomRange) {
      params.set('rooms-max', roomRange[1].toString())
    }
  
    if (types.length > 0) params.set('type', types.join(','))

    if (status.length > 0 && JSON.stringify(status) != JSON.stringify(['active', 'reserved'])) params.set('status', status.join(','))

    return params.toString()
  }, [priceRange, areaLandRange, areaRange, roomRange, types, status])

  return (
    <div className="flex items-center gap-2">
      <SearchInput className="flex-4" />

      <PrimarySearchFilters
        priceRange={priceRange}
        setPriceRange={setPriceRange}
        maxPriceInRange={maxPriceInRange}
        areaRange={areaRange}
        setAreaRange={setAreaRange}
        maxAreaInRange={maxAreaInRange}
        typesResponse={typesResponse}
        types={types}
        setTypes={setTypes}
      />

      <AdvancedSearchFilters
        areaLandRange={areaLandRange} //area land
        setAreaLandRange={setAreaLandRange}
        maxAreaLandRange={maxAreaLandRange}
        roomRange={roomRange} //rooms
        setRoomRange={setRoomRange}
        maxRoomRange={maxRoomRange}
        floorRange={floorRange} //floor
        setFloorRange={setFloorRange}
        maxFloorRange={maxFloorRange}
        yearBuiltRange={yearBuiltRange} //year built
        setYearBuiltRange={setYearBuiltRange}
        minYearBuiltRange={minYearBuiltRange}
        toiletRange={toiletRange} //toilet
        setToiletRange={setToiletRange}
        maxToiletRange={maxToiletRange}
        sorting={sorting} //sorting
        setSorting={setSorting}
        status={status} //status
        setStatus={setStatus}
      />

      <div className="flex-2 flex justify-center">
        <Link to={`/boliger?${searchParams}`} className="w-full">
          <Button
            variant="outline"
            className="w-full bg-gradient-to-r from-pink-500 to-red-500 hover:bg-gradient-to-r hover:from-pink-600 hover:to-red-600 text-white"
          >
            Søg
          </Button>
        </Link>
      </div>
    </div>
  )
}
