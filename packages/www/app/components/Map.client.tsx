import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { ExtractSchema } from 'hono/types'
import type { AppType } from 'api/src/index'

type Listing = ExtractSchema<AppType>['/listings']['$get']['output']['listings'][number]
export function Map({ listing }: { listing: Listing }) {
  const location = listing.address.location
  return (
    <MapContainer className="w-full h-142 rounded-xl" center={[location.y, location.x]} zoom={15} scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | yeet min dreng'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[location.y, location.x]}>
        {/* <Popup>
          A pretty CSS3 popup. <br /> Easily customizable.
        </Popup> */}
      </Marker>
    </MapContainer>
  )
}
