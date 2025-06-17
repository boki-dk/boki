// generalized react component for displaying a "card" or "teaser" for a listing
import type { AppType } from 'api/src/index'
import type { ExtractSchema } from 'hono/types'
import { NavLink } from 'react-router'
import { currencyFormatter } from '~/lib/utils'
import { Image } from './Image'
import { Icon } from '@iconify/react'

type Listing = ExtractSchema<AppType>['/listings']['$get']['output']['listings'][number]

export function ListingTeaser({ listing }: { listing: Listing }) {
  const listingIsPlot = listing.typeId === 3 || listing.typeId === 12 || listing.typeId === 14
  return (
    <NavLink to={`/bolig/${listing.id}`}>
      <div className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border pb-6 shadow-sm h-full">
        <div className="relative flex-none">
          {listing.status != 'active' && (
            <span className="absolute bottom-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
              {listing.status == 'sold' && 'Solgt'}
              {listing.status == 'reserved' && 'Reserveret'}
              {listing.status == 'unlisted' && 'Ikke til salg'}
            </span>
          )}
          <Image
            src={listing.mainImgUrl ?? 'https://placehold.co/600x400/EEE/31343C'}
            alt={listing.mainImgAlt ?? undefined}
            width={580}
            height={348}
            className="block rounded-t-xl aspect-[5/3] object-cover w-full"
          />
        </div>

        <div className="flex flex-col px-6 grow">
          <div className="flex flex-row justify-between items-start gap-4 h-full">
            <div className="flex flex-col h-full">
              <p>
                {listing.address.displayName.replaceAll(`, ${listing.address.postalCode} ${listing.address.postalCodeName}`, '').trim()}
              </p>
              <p className="">
                {listing.address.postalCode} {listing.address.postalCodeName}
              </p>
              <p className="text-muted-foreground text-s py-1 grow">{listing.type.name}</p>
              {listing.price != 0 && <p className="text-lg">{currencyFormatter.format(listing.price)}</p>}
            </div>

            <div className="flex flex-col items-end justify-center px-3 py-2 gap-1 whitespace-nowrap border-l border-gray-300 pr-4 mr-4">
              <span>{listingIsPlot ? listing.areaLand : listing.areaFloor} m²</span>
              {listing.rooms != 0 && listing.rooms && (
                <span>
                  {listing.rooms} vær.
                  {/* <Icon icon="mdi:bed-king-outline" className='mt-1'/> */}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </NavLink>
  )
}
