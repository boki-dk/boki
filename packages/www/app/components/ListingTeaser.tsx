import type { AppType } from 'api/src/index'
import type { ExtractSchema } from 'hono/types'
import { Link } from 'react-router'
import { currencyFormatter } from '~/lib/utils'

type Listing = ExtractSchema<AppType>['/listings']['$get']['output']["listings"][number]

export function ListingTeaser({ listing }: { listing: Listing }) {
  return (
    <Link to={`/bolig/${listing.id}`}>
      <div className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border pb-6 shadow-sm">
        <img
          src={listing.mainImgUrl ?? 'https://placehold.co/600x400/EEE/31343C'}
          alt={listing.mainImgAlt ?? undefined}
          className="block rounded-t-xl aspect-video object-cover w-full"
        />

        <div className="flex flex-col px-6">
          <div className="">
            <p>{listing.address.displayName}</p>
            <p>{listing.type.name}</p>
            <p>{currencyFormatter.format(listing.price)}</p>
          </div>
        </div>
      </div>
    </Link>
  )
}
