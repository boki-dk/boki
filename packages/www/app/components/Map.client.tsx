import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { ExtractSchema } from 'hono/types'
import type { AppType } from 'api/src/index'
import { PMTiles, leafletRasterLayer } from 'pmtiles'

type Listing = ExtractSchema<AppType>['/listings']['$get']['output']['listings'][number]

export function Map({ listing }: { listing: Listing }) {
  const location = listing.address.location
  // const map = useMap()
  // const p = new PMTiles('https://demo-bucket.protomaps.com/v4.pmtiles')
  // leafletRasterLayer(p, {}).addTo(map)

  return (
    <MapContainer className="w-full h-142 rounded-xl" center={[location.y, location.x]} zoom={15} scrollWheelZoom={false}>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; OpenStreetMap contributors'
      />
      <Marker position={[location.y, location.x]}>
        {/* <Popup>
          A pretty CSS3 popup. <br /> Easily customizable.
        </Popup> */}
      </Marker>
    </MapContainer>
  )
}
