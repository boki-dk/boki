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

type SearchResult = ExtractSchema<AppType>['/search']['$get']['output']

export function SearchMenu() {
  const [priceRange, setPriceRange] = useState([1895000, 7000000])
  const [areaRange, setAreaRange] = useState([0, 5000])

  return (
    <div className="horizontal flex items-center gap-2 bg-card p-2 rounded-lg bg-gray-400">
      <div className="flex-2">
        <SearchInput />
      </div>

      <div className="flex-1 flex justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full bg-gray-200">
              Pris
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 pb-4" align="center">
            <DropdownMenuLabel className="text-center align-top">Prisinterval</DropdownMenuLabel>
            <DualRangeSlider
              className="mt-8 mb-4"
              label={(value) => <span className="text-xs">{currencyFormatter.format(value ?? 0)}</span>}
              value={priceRange}
              onValueChange={setPriceRange}
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
              onValueChange={setAreaRange}
              min={0}
              max={10000}
              step={1}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1 flex justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full bg-gray-200">
              Parametre
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="center">
            <DropdownMenuLabel>Boligtype</DropdownMenuLabel>
            <div className="flex items-center gap-3 mb-2">
              <Checkbox id="house-check-box" />
              <Label htmlFor="terms">Hus</Label>
            </div>
            <div className="flex items-center gap-3  mb-2">
              <Checkbox id="apartment-check-box" />
              <Label htmlFor="terms">Lejlighed</Label>
            </div>
            <DropdownMenuSeparator className="mt-2 mb-2" />
            <div className="flex items-center gap-3 mb-2">
              <Checkbox id="basement-check-box" />
              <Label htmlFor="terms">Kælder</Label>
            </div>
            <div className="flex items-center gap-3  mb-2">
              <Checkbox id="pet-friendly-check-box" />
              <Label htmlFor="terms">Dyre-venlig</Label>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
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
