import type { Route } from './+types/listings'
import { ofetch } from 'ofetch'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Boliger | Boki' }, { name: 'description', content: 'Find dit næste hjem med Boki' }]
}

export async function loader({ params }: Route.LoaderArgs) { 
  return { listing: await ofetch(`https://api.boki.dk/listings/${params.slug}`) }
}

// export async function clientLoader({
//   serverLoader,
//   params,
// }: Route.ClientLoaderArgs) {
//   const serverData = await serverLoader();

//   if (serverData)
// }

export default function Listings({ loaderData }: Route.ComponentProps) {
  const { listing } = loaderData
  return (
    <div>
      <h1>Bolig {listing.address.displayName}</h1>
      <img src={listing.mainImgUrl} alt={listing.mainImgAlt} />
      
    </div>
  )
}
