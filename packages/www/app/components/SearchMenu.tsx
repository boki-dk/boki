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
            <Button variant="outline" className="w-full">
              Pris
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 pb-4" align="center">
            <DropdownMenuLabel className="text-center align-top">Prisinterval</DropdownMenuLabel>
            <DualRangeSlider className='mt-8 mb-4'
              label={(value) => <span className="text-xs">{currencyFormatter.format(value ?? 0)}</span>}
              value={priceRange}
              onValueChange={setPriceRange}
              min={0}
              max={10000000}
              step={1000}
            />
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-center align-top">Areal</DropdownMenuLabel>
            <DualRangeSlider className='mt-8 mb-4'
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
            <Button variant="outline" className="w-full">
              Areal
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="center">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuSeparator />
            <DropdownMenuItem>GitHub</DropdownMenuItem>
            <DropdownMenuItem>Support</DropdownMenuItem>
            <DropdownMenuItem disabled>API</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              Log out
              <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex-1 flex justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full">
              Rum
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="center">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuSeparator />
            <DropdownMenuItem>GitHub</DropdownMenuItem>
            <DropdownMenuItem>Support</DropdownMenuItem>
            <DropdownMenuItem disabled>API</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              Log out
              <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
