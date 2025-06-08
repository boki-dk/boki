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

type SearchResult = ExtractSchema<AppType>['/search']['$get']['output']
type TypesResult = ExtractSchema<AppType>['/listing-types']['$get']['output'][number]

type PrimarySearchFiltersProps = {
  priceRange: [number, number]
  setPriceRange: Dispatch<SetStateAction<[number, number]>>
  maxPriceInRange?: number
  areaRange: [number, number]
  setAreaRange: Dispatch<SetStateAction<[number, number]>>
  maxAreaInRange?: number
  typesResponse: TypesResult[]
  types: number[]
  setTypes: Dispatch<SetStateAction<number[]>>
}

export function PrimarySearchFilters({
  priceRange,
  setPriceRange,
  maxPriceInRange = 10000000,
  areaRange,
  setAreaRange,
  maxAreaInRange = 300,
  typesResponse,
  types,
  setTypes,
}: PrimarySearchFiltersProps) {
  // Becaue the we want input in form of ([number, number] => Void) not (number[] => void).
  // From what i can tell, the weird typing comes from react primitive slider?

  function handlePriceRangeChange(value: [number, number]) {
    setPriceRange(value)
  }
  function handleAreaRangeChange(value: [number, number]) {
    setAreaRange(value)
  }

  return (
    <div className="flex-1 flex justify-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full bg-gray-200">
            Søgefiltre
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-90 pb-1" align="center">
          <div className="mx-4">
            <DropdownMenuLabel className="text-center align-top">Prisinterval</DropdownMenuLabel>
            <DropdownMenuLabel className="text-xs text-muted-foreground text-center">
              Mellem <span className="text-base text-red-500">{shortCurrencyFormatter.format(priceRange[0])}</span> og{' '}
              <span className="text-base text-red-500">
                {shortCurrencyFormatter.format(priceRange[1])} {priceRange[1] == maxPriceInRange && '+'}
              </span>
            </DropdownMenuLabel>
            <DualRangeSlider
              className="mt-2 mb-4"
              value={priceRange}
              onValueChange={handlePriceRangeChange}
              min={0}
              max={maxPriceInRange}
              step={10000}
            />
          </div>
          <DropdownMenuSeparator />
          <div className="mx-4">
            <DropdownMenuLabel className="text-center align-top">Boligstørrelse</DropdownMenuLabel>
            <DropdownMenuLabel className="text-xs text-muted-foreground text-center">
              Mellem{' '}
              <span className="text-base text-red-500">
                {areaRange[0]} m<sup>2</sup>
              </span>{' '}
              og{' '}
              <span className="text-base text-red-500">
                {areaRange[1]} m<sup>2</sup> {areaRange[1] == maxAreaInRange && '+'}
              </span>
            </DropdownMenuLabel>
            <DualRangeSlider
              className="mt-2 mb-4 "
              value={areaRange}
              onValueChange={handleAreaRangeChange}
              min={0}
              max={maxAreaInRange}
              step={1}
            />
          </div>
          <DropdownMenuSeparator />
          <div className="grid grid-cols-1 mt-5 gap-3 md:grid-cols-2 lg:grid-cols-2">
            {typesResponse.map((typeResponse) => {
              const isActive = types.includes(typeResponse.id)
              return (
                <Button
                  key={typeResponse.id}
                  type="button"
                  className={`flex items-center gap-3 mb-2 px-4 py-2 rounded-xl transition-colors
          ${isActive ? 'bg-gradient-to-r from-pink-500 to-red-500' : 'bg-gray-200 text-gray-800'}
          border border-gray-300 hover:bg-gray-300`}
                  onClick={() => {
                    setTypes((prev) => (isActive ? prev.filter((id) => id !== typeResponse.id) : [...prev, typeResponse.id]))
                  }}
                >
                  {typeResponse.name}
                </Button>
              )
            })}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
