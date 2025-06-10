import type { AppType } from 'api/src/index'
import type { ExtractSchema } from 'hono/types'
import { SearchInput } from './SearchInput'

import { Button } from './ui/button'
import { Icon } from '@iconify/react'

import { useEffect, useMemo, useState } from 'react'

import {  NavLink, useLocation, useNavigate } from 'react-router'
import { PrimarySearchFilters } from './PrimarySearchFilters'
import { AdvancedSearchFilters } from './AdvancedSearchFilters'

type SearchResult = ExtractSchema<AppType>['/search']['$get']['output']
type TypesResult = ExtractSchema<AppType>['/listing-types']['$get']['output'][number]

type ListingStatus = ExtractSchema<AppType>['/listings']['$get']['output']['listings'][number]['status']

export function SearchMenu({ typesResponse }: { typesResponse: TypesResult[] }) {
   const location = useLocation();
  const params = new URLSearchParams(location.search)
  const navigate = useNavigate()
  
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

  const [status, setStatus] = useState<ListingStatus[]>(['active' as ListingStatus, 'reserved' as ListingStatus])

  // not really necessary, but reduces length of URL
  const searchParams = useMemo(() => {
    
    params.delete('page'); 
    params.delete('pageSize'); 

    // Price
    if (priceRange[0] !== 0) params.set('price-min', priceRange[0].toString());
    else params.delete('price-min');
    if (priceRange[1] !== maxPriceInRange) params.set('price-max', priceRange[1].toString());
    else params.delete('price-max');

    // Area
    if (areaRange[0] !== 0) params.set('area-floor-min', areaRange[0].toString());
    else params.delete('area-floor-min');
    if (areaRange[1] !== maxAreaInRange) params.set('area-floor-max', areaRange[1].toString());
    else params.delete('area-floor-max');

    // Area land
    if (areaLandRange[0] !== 0) params.set('area-land-min', areaLandRange[0].toString());
    else params.delete('area-land-min');
    if (areaLandRange[1] !== maxAreaLandRange) params.set('area-land-max', areaLandRange[1].toString());
    else params.delete('area-land-max');

    // Rooms
    if (roomRange[0] !== 0) params.set('rooms-min', roomRange[0].toString());
    else params.delete('rooms-min');
    if (roomRange[1] !== maxRoomRange) params.set('rooms-max', roomRange[1].toString());
    else params.delete('rooms-max');

    // Floor
    if (floorRange[0] !== 0) params.set('floor-min', floorRange[0].toString());
    else params.delete('floor-min');
    if (floorRange[1] !== maxFloorRange) params.set('floor-max', floorRange[1].toString());
    else params.delete('floor-max');

    // Year built
    if (yearBuiltRange[0] !== minYearBuiltRange) params.set('year-built-min', yearBuiltRange[0].toString());
    else params.delete('year-built-min');
    if (yearBuiltRange[1] !== new Date().getFullYear()) params.set('year-built-max', yearBuiltRange[1].toString());
    else params.delete('year-built-max');

    // Toilets
    if (toiletRange[0] !== 0) params.set('bathrooms-min', toiletRange[0].toString());
    else params.delete('bathrooms-min');
    if (toiletRange[1] !== maxToiletRange) params.set('bathrooms-max', toiletRange[1].toString());
    else params.delete('bathrooms-max');

    // Types
    if (types.length > 0) params.set('type', types.join(','));
    else params.delete('type');

    // Status
    if (status.length > 0 && JSON.stringify(status) !== JSON.stringify(['active', 'reserved'])) {
      params.set('status', status.join(','));
    } else {
      params.delete('status');
    }

    return params;
  }, [
    priceRange, maxPriceInRange,
    areaRange, maxAreaInRange,
    areaLandRange, maxAreaLandRange,
    roomRange, maxRoomRange,
    floorRange, maxFloorRange,
    yearBuiltRange, minYearBuiltRange,
    toiletRange, maxToiletRange,
    types, status
  ]);

   useEffect(() => {
    const newSearch = searchParams.toString();
    
      navigate(`/boliger?${newSearch}`, { replace: true });
    
    // eslint-disable-next-line
  }, [searchParams]);

  return (
    <div className="flex items-center gap-2 ">
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

      <AdvancedSearchFilters className=''
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
        status={status} //status
        setStatus={setStatus}
      />

      <Button
      className="bg-gray-200 hover:bg-gray-300 text-gray-800"
        variant="outline"
        onClick={() => {
            setPriceRange([0, maxPriceInRange]);
            setAreaRange([0, maxAreaInRange]);
            setTypes([]);
            setAreaLandRange([0, maxAreaLandRange]);
            setRoomRange([0, maxRoomRange]);
            setFloorRange([0, maxFloorRange]);
            setYearBuiltRange([minYearBuiltRange, new Date().getFullYear()]);
            setToiletRange([0, maxToiletRange]);
            setStatus(['active' as ListingStatus, 'reserved' as ListingStatus]);

            const newParams = new URLSearchParams();
            const municipality = params.get('municipality');
            const postal = params.get('postal-codes');
            if (municipality) newParams.set('municipality', municipality);
            if (postal) newParams.set('postal-codes', postal);
            navigate(`/boliger?${newParams.toString()}`);
   
        }}
        title="Nulstil filtre"
      >
        <Icon icon="mdi:autorenew" className="w-4 h-4" />
        </Button>

    </div>
  )
}
