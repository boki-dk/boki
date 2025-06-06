import type { AppType } from 'api/src/index'
import type { ExtractSchema } from 'hono/types'
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu'
import { currencyFormatter } from '~/lib/utils'
import { Button } from './ui/button'
import { DualRangeSlider } from './ui/dualrangeslider'
import type { Dispatch, SetStateAction } from 'react'
import { Checkbox } from './ui/checkbox'
import { Label } from './ui/label'

type SearchResult = ExtractSchema<AppType>['/search']['$get']['output']

type PrimarySearchFiltersProps = {
  priceRange: [number, number]
  setPriceRange: Dispatch<SetStateAction<[number, number]>>
  areaRange: [number, number]
  setAreaRange: Dispatch<SetStateAction<[number, number]>>
  types: number[]
  setTypes: Dispatch<SetStateAction<number[]>>
}

export function PrimarySearchFilters({ priceRange, setPriceRange, areaRange, setAreaRange, types, setTypes }: PrimarySearchFiltersProps) {
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
        <DropdownMenuContent className="w-90 pb-4" align="center">
          <DropdownMenuLabel className="text-center align-top">Prisinterval</DropdownMenuLabel>
          <DualRangeSlider
            className="mt-8 mb-4"
            label={(value) => <span className="text-xs">{currencyFormatter.format(value ?? 0)}</span>}
            value={priceRange}
            onValueChange={handlePriceRangeChange}
            min={0}
            max={10000000}
            step={1000}
          />
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-center align-top">Areal</DropdownMenuLabel>
          <DualRangeSlider
            className="mt-8 mb-4"
            label={(value) => <span className="text-xs">{value}</span>}
            value={areaRange}
            onValueChange={handleAreaRangeChange}
            min={0}
            max={10000}
            step={1}
          />
          <DropdownMenuSeparator />
          {types.map((type) => (
            <div className="flex items-center gap-3 mb-2">
              <Checkbox id="house-check-box" />
              <Label htmlFor="terms">Hus</Label>
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
