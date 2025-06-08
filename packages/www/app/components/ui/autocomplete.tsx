import { cn } from '~/lib/utils'
import { Command as CommandPrimitive } from 'cmdk'
import { useState } from 'react'
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from './command'
import { Input } from './input'
import { Popover, PopoverAnchor, PopoverContent } from './popover'
import { Skeleton } from './skeleton'

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

  return (
    <div className={cn('flex items-center', className)}>
      <Popover open={open && searchValue.length >= 3} onOpenChange={setOpen}>
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
                              window.location.href = option.value
                            }}
                          >
                            <span className="flex items-center">
                              {option.label}
                              {searchValue === option.value && <Check className="ml-2 h-4 w-4" />}
                            </span>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  ))}
                </CommandGroup>
              ) : null}
              {!isLoading ? <CommandEmpty>{emptyMessage ?? 'No items.'}</CommandEmpty> : null}
            </CommandList>
          </PopoverContent>
        </Command>
      </Popover>
    </div>
  )
}
