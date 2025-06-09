import { cn } from '~/lib/utils'
import { Command as CommandPrimitive } from 'cmdk'
import { useState } from 'react'
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from './command'
import { Input } from './input'
import { Popover, PopoverAnchor, PopoverContent } from './popover'
import { Skeleton } from './skeleton'
import { Check } from 'lucide-react'
import { useSearchParams } from 'react-router'

type Props<T extends string> = {
  searchValue: string
  onSearchValueChange: (value: string) => void
  items: { value: T; label: string; group: string }[]
  isLoading?: boolean
  emptyMessage?: string
  placeholder?: string
  className?: string
}

export function AutoComplete<T extends string>({
  searchValue,
  onSearchValueChange,
  items,
  isLoading,
  emptyMessage = 'No items.',
  placeholder = 'Søg...',
  className = '',

}: Props<T>) {
  const [open, setOpen] = useState(false)

  const groupedItems = Object.groupBy(items, (item) => item.group)
  const [searchParams, setSearchParams] = useSearchParams()

  return (
    <div className={cn('flex items-center', className)}>
      <Popover open={open && searchValue.length >= 3 && !isLoading} onOpenChange={setOpen}>
        <Command shouldFilter={false}>
          <PopoverAnchor asChild>
            <CommandPrimitive.Input
              asChild
              value={searchValue}
              onValueChange={onSearchValueChange}
              onKeyDown={(e) => setOpen(e.key !== 'Escape')}
              onMouseDown={() => setOpen((open) => !!searchValue || !open)}
              onFocus={() => setOpen(true)}
            >
              <Input placeholder={placeholder} className="border-2" />
            </CommandPrimitive.Input>
          </PopoverAnchor>
          {!open && <CommandList aria-hidden="true" className="hidden" />}
          <PopoverContent
            asChild
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
            onInteractOutside={(e) => {
              if (e.target instanceof Element && e.target.hasAttribute('cmdk-input')) {
                e.preventDefault()
              }
            }}
            className="w-[--radix-popover-trigger-width] p-0"
          >
            <CommandList>
              {isLoading && (
                <CommandPrimitive.Loading>
                  <div className="p-1">
                    <Skeleton className="h-6 w-full" />
                  </div>
                </CommandPrimitive.Loading>
              )}
              {items.length > 0 && !isLoading ? (
                <CommandGroup>
                  {Object.entries(groupedItems).map(([group, items]) => (
                    <CommandGroup key={group} heading={group}>
                      {items &&
                        items.map((option) => (
                          
                          <CommandItem
                            key={option.value}
                            value={option.value}
                            onMouseDown={(e) => e.preventDefault()}
                            onSelect={() => {
                              //searchParams.set('municipality', option.value)
                              setSearchParams((prev) => {
                                if (option.group === 'Kommune') {
                                  prev.set('municipality', option.value)
                                } else if (option.group === 'Postnummer') {
                                  prev.set('postal-code', option.value)
                                }
                                else if (option.group === 'Adresse') {
                                  prev.set('address', option.value)
                                }

                                return prev
                              })
                              
                              // const optionParams = new URLSearchParams(option.value)
                              // searchParams.append(optionParams.keys().next().value ?? '', optionParams.values().next().value ?? '')

                              //window.location.href = 'boliger?' + searchParams.toString()
                              
                            }}
                          >
                            <span className="flex items-center">
                              {option.label }
                              {searchValue === option.value && <Check className="ml-2 h-4 w-4" />}
                            </span>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  ))}
                </CommandGroup>
              ) : null}
              {!isLoading ? <CommandEmpty className='py-3 text-center text-sm mx-3'>{emptyMessage ?? 'No items.'}</CommandEmpty> : null}
            </CommandList>
          </PopoverContent>
        </Command>
      </Popover>
    </div>
  )
}
