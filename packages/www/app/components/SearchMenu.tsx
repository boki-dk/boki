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


export function SearchMenu({typesResponse}: { typesResponse: TypesResult[] }) {

  //primary search filters
  const maxPriceInRange = 10000000 
  const [priceRange, setPriceRange] = useState<[number, number]>([0, maxPriceInRange])
  const maxAreaInRange = 300
  const [areaRange, setAreaRange] = useState<[number, number]>([0, maxAreaInRange])
  //id of type
  const [types, setTypes] = useState<number[]>(typesResponse.map((type) => type.id))

  //advanced search filters
  const maxAreaLandRange = 10000
  const [areaLandRange, setAreaLandRange] = useState<[number, number]>([0, maxAreaLandRange])
  
  const maxRoomRange = 10
  const [roomRange, setRoomRange] = useState<[number, number]>([1, maxRoomRange])
  
  const maxFloorRange = 10
  const [floorRange, setFloorRange] = useState<[number, number]>([0, maxFloorRange])

  const minYearBuiltRange = 1900
  const [yearBuiltRange, setYearBuiltRange] = useState<[number, number]>([minYearBuiltRange, new Date().getFullYear()])

  const maxToiletRange = 5
  const [toiletRange, setToiletRange] = useState<[number, number]>([1, maxToiletRange])

  const [Sorting, setSorting] = useState<string>("default") // TODO: sorting options
  const [Status, setStatus] = useState<ListingStatus[]>(['active' as ListingStatus, 'reserved' as ListingStatus])
  
  const searchParams = useMemo(() => {
    const params = new URLSearchParams();

    params.set('limit', '15');
    params.set('offset', '0');

    params.set('price-min', priceRange[0].toString());
    if (priceRange[1] != maxPriceInRange) {
      params.set('price-max', priceRange[1].toString());
    }

    params.set('area-floor-min', areaRange[0].toString());
    if (areaRange[1] != maxAreaInRange){
      params.set('area-floor-max', areaRange[1].toString());
    }
  
    params.set('area-land-min', areaLandRange[0].toString());
    if (areaLandRange[1] != maxAreaInRange) {
      params.set('area-land-max', areaLandRange[1].toString());
    }
    
    params.set('rooms-min', roomRange[0].toString());
    if (roomRange[1] != maxRoomRange) {
      params.set('rooms-max', roomRange[1].toString());
    }

    if (types.length > 0) params.set('type', types.join(','));
    if (Status.length > 0) params.set('status', Status.join(','));

    return params.toString();
  }, [
    priceRange, areaLandRange, areaRange, roomRange, types, Status
  ]);


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
