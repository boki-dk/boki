/*
Leaflet map component for displaying listings on a map. Generic.
*/
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { ExtractSchema } from 'hono/types'
import type { AppType } from 'api/src/index'
import { PMTiles, leafletRasterLayer } from 'pmtiles'
import L from 'leaflet'

import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})
L.Marker.prototype.options.icon = DefaultIcon

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
