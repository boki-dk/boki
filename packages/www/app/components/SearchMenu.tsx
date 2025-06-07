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
import { useState } from 'react'
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


export function SearchMenu({typesResponse}: { typesResponse: TypesResult[] }) {

  //primary search filters
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 7000000])
  const maxPriceInRange = 10000000 // This should be the maximum price in the range, can be fetched from the API if needed.
  const [areaRange, setAreaRange] = useState<[number, number]>([0, 5000])
  const maxAreaInRange = 300
  //id of type
  const [types, setTypes] = useState<number[]>(typesResponse.map((type) => type.id))

  //advanced search filters
   const [areaLandRange, setAreaLandRange] = useState<[number, number]>([0, 5000])
  const [roomRange, setRoomRange] = useState<[number, number]>([1, 10])
  const [floorRange, setFloorRange] = useState<[number, number]>([0, 10])
  const [yearBuiltRange, setYearBuiltRange] = useState<[number, number]>([1900, new Date().getFullYear()])
  const [toiletRange, setToiletRange] = useState<[number, number]>([1, 5])
  const [Sorting, setSorting] = useState<string>("default")
  const [Status, setStatus] = useState<ListingStatus[]>(['active' as ListingStatus, 'reserved' as ListingStatus])
  


  return (
    <div className="horizontal flex items-center gap-2 bg-card p-2 rounded-lg bg-gray-400">
      <div className="flex-2">
        <SearchInput />
      </div>

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
        areaLandRange={areaLandRange}
        setAreaLandRange={setAreaLandRange}
        roomRange={roomRange}
        setRoomRange={setRoomRange}
        floorRange={floorRange}
        setFloorRange={setFloorRange}
        yearBuiltRange={yearBuiltRange}
        setYearBuiltRange={setYearBuiltRange}
        toiletRange={toiletRange}
        setToiletRange={setToiletRange}
        Sorting={Sorting}
        setSorting={setSorting}
        Status ={Status}
        setStatus={setStatus}
      />
      
      <div className="flex-1 flex justify-center">
        <Link to="/boliger" className="w-full">
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
