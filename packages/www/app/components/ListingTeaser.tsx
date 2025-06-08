import type { AppType } from 'api/src/index'
import type { ExtractSchema } from 'hono/types'
import { NavLink } from 'react-router'
import { currencyFormatter } from '~/lib/utils'
import { Image } from './Image'

type Listing = ExtractSchema<AppType>['/listings']['$get']['output']['listings'][number]

export function ListingTeaser({ listing }: { listing: Listing }) {
  return (
    <NavLink to={`/bolig/${listing.id}`}>
      <div className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border pb-6 shadow-sm">
        <div className="relative">
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

        <div className="flex flex-col px-6">
          <div className="">
            <p>{listing.address.displayName}</p>
            <p>{listing.type.name}</p>
            {listing.price != 0 && <p>{currencyFormatter.format(listing.price)}</p>}
            <p>
              {listing.areaFloor} m² {listing.rooms ? `- ${listing.rooms} værelser` : ''}
            </p>
          </div>
        </div>
      </div>
    </NavLink>
  )
}
