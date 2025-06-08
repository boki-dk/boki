import type { AppType } from 'api/src/index'
import type { ExtractSchema } from 'hono/types'
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu'
import { shortCurrencyFormatter } from '~/lib/utils'
import { Button } from './ui/button'
import { DualRangeSlider } from './ui/dualrangeslider'
import type { Dispatch, SetStateAction } from 'react'
import { Checkbox } from './ui/checkbox'
import { Label } from './ui/label'
import type { types } from 'util'
import { listingStatusEnum } from 'api/src/db/schema'

type ListingStatus = ExtractSchema<AppType>['/listings']['$get']['output']['listings'][number]['status']
type SearchResult = ExtractSchema<AppType>['/search']['$get']['output']
type TypesResult = ExtractSchema<AppType>['/listing-types']['$get']['output'][number]

type AdvancedSearchFiltersProps = {
  areaLandRange: [number, number]
  setAreaLandRange: Dispatch<SetStateAction<[number, number]>>
  maxAreaLandRange?: number

  roomRange: [number, number]
  setRoomRange: Dispatch<SetStateAction<[number, number]>>
  maxRoomRange?: number

  floorRange: [number, number]
  setFloorRange: Dispatch<SetStateAction<[number, number]>>
  maxFloorRange?: number

  yearBuiltRange: [number, number]
  setYearBuiltRange: Dispatch<SetStateAction<[number, number]>>
  minYearBuiltRange?: number

  toiletRange: [number, number]
  setToiletRange: Dispatch<SetStateAction<[number, number]>>
  maxToiletRange?: number

  sorting: string
  setSorting: Dispatch<SetStateAction<string>>

  status: ListingStatus[]
  setStatus: Dispatch<SetStateAction<ListingStatus[]>>
}

export function AdvancedSearchFilters({
  areaLandRange,
  setAreaLandRange,
  maxAreaLandRange = 10000,
  roomRange,
  setRoomRange,
  maxRoomRange = 10,
  floorRange,
  setFloorRange,
  maxFloorRange = 10,
  yearBuiltRange,
  setYearBuiltRange,
  minYearBuiltRange = 1900,
  toiletRange,
  setToiletRange,
  maxToiletRange = 5,
  sorting,
  setSorting,
  status,
  setStatus,
}: AdvancedSearchFiltersProps) {
  function handleAreaLandRangeChange(value: [number, number]) {
    setAreaLandRange(value)
  }
  function handleRoomRangeChange(value: [number, number]) {
    setRoomRange(value)
  }
  function handleFloorRangeChange(value: [number, number]) {
    setFloorRange(value)
  }
  function handleYearBuiltRangeChange(value: [number, number]) {
    setYearBuiltRange(value)
  }
  function handleToiletRangeChange(value: [number, number]) {
    setToiletRange(value)
  }

  const allStatuses = Object.values(listingStatusEnum).filter((s) => s != null)[1] as ListingStatus[] // Exclude 'deleted' status

  const STATUS_LABELS = {
    active: 'Aktiv',
    reserved: 'Reserveret',
    sold: 'Solgt',
    unlisted: 'Slettet',
  } as const

  return (
    <div className="flex-1 flex justify-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full bg-gray-200">
            Advancerede filtre
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-90 pb-1" align="center">
          {/* Grundareal */}
          <div className="mx-4">
            <DropdownMenuLabel className="text-center align-top">Grundareal</DropdownMenuLabel>
            <DropdownMenuLabel className="text-xs text-muted-foreground text-center">
              Mellem{' '}
              <span className="text-base text-red-500">
                {areaLandRange[0]} m<sup>2</sup>
              </span>{' '}
              og{' '}
              <span className="text-base text-red-500">
                {areaLandRange[1]}m<sup>2</sup> {areaLandRange[1] == maxAreaLandRange && '+'}
              </span>
            </DropdownMenuLabel>
            <DualRangeSlider
              className="mt-2 mb-4"
              value={areaLandRange}
              onValueChange={handleAreaLandRangeChange}
              min={0}
              max={maxAreaLandRange}
              step={10}
            />
          </div>
          <DropdownMenuSeparator />

          {/* Værelser */}
          <div className="mx-4">
            <DropdownMenuLabel className="text-center align-top">Værelser</DropdownMenuLabel>
            <DropdownMenuLabel className="text-xs text-muted-foreground text-center">
              Mellem <span className="text-base text-red-500">{roomRange[0]}</span> og{' '}
              <span className="text-base text-red-500">
                {roomRange[1]}
                {roomRange[1] == maxRoomRange && '+'}
              </span>
            </DropdownMenuLabel>
            <DualRangeSlider
              className="mt-2 mb-4"
              value={roomRange}
              onValueChange={handleRoomRangeChange}
              min={0}
              max={maxRoomRange}
              step={1}
            />
          </div>
          <DropdownMenuSeparator />

          {/* Etager */}
          <div className="mx-4">
            <DropdownMenuLabel className="text-center align-top">Etager</DropdownMenuLabel>
            <DropdownMenuLabel className="text-xs text-muted-foreground text-center">
              Mellem <span className="text-base text-red-500">{floorRange[0]}</span> og{' '}
              <span className="text-base text-red-500">
                {floorRange[1]}
                {floorRange[1] == maxFloorRange && '+'}
              </span>
            </DropdownMenuLabel>
            <DualRangeSlider
              className="mt-2 mb-4"
              value={floorRange}
              onValueChange={handleFloorRangeChange}
              min={0}
              max={maxFloorRange}
              step={1}
            />
          </div>
          <DropdownMenuSeparator />

          {/* Byggeår */}
          <div className="mx-4">
            <DropdownMenuLabel className="text-center align-top">Byggeår</DropdownMenuLabel>
            <DropdownMenuLabel className="text-xs text-muted-foreground text-center">
              Mellem{' '}
              <span className="text-base text-red-500">
                {yearBuiltRange[0] == minYearBuiltRange && '<'}
                {yearBuiltRange[0]}
              </span>{' '}
              og <span className="text-base text-red-500">{yearBuiltRange[1]}</span>
            </DropdownMenuLabel>
            <DualRangeSlider
              className="mt-2 mb-4"
              value={yearBuiltRange}
              onValueChange={handleYearBuiltRangeChange}
              min={minYearBuiltRange}
              max={new Date().getFullYear()}
              step={1}
            />
          </div>
          <DropdownMenuSeparator />

          {/* Toiletter */}
          <div className="mx-4">
            <DropdownMenuLabel className="text-center align-top">Toiletter</DropdownMenuLabel>
            <DropdownMenuLabel className="text-xs text-muted-foreground text-center">
              Mellem <span className="text-base text-red-500">{toiletRange[0]}</span> og{' '}
              <span className="text-base text-red-500">
                {toiletRange[1]}
                {toiletRange[1] == maxToiletRange && '+'}
              </span>
            </DropdownMenuLabel>
            <DualRangeSlider
              className="mt-2 mb-4"
              value={toiletRange}
              onValueChange={handleToiletRangeChange}
              min={1}
              max={maxToiletRange}
              step={1}
            />
          </div>
          <DropdownMenuSeparator />

          {/* Status buttons */}
          <DropdownMenuLabel className="text-center align-top">Status</DropdownMenuLabel>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {allStatuses.map((selectedStatus) => {
              if (selectedStatus === null) return null
              const isActive = status?.includes(selectedStatus)
              return (
                <Button
                  key={selectedStatus}
                  type="button"
                  className={`flex items-center justify-center px-3 py-1 rounded-xl transition-colors text-xs
          ${isActive ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white' : 'bg-gray-200 text-gray-800'}
          border border-gray-300 hover:bg-gray-300`}
                  onClick={() => {
                    setStatus((prev) =>
                      prev?.includes(selectedStatus) ? prev.filter((s) => s !== selectedStatus) : [...(prev || []), selectedStatus],
                    )
                  }}
                >
                  {STATUS_LABELS[selectedStatus]}
                </Button>
              )
            })}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
