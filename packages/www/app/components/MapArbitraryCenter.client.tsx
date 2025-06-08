import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { ExtractSchema } from 'hono/types'
import type { AppType } from 'api/src/index'
import { PMTiles, leafletRasterLayer } from 'pmtiles'

type Listing = ExtractSchema<AppType>['/listings']['$get']['output']['listings'][number]

export function Map() {
  // const map = useMap()
  // const p = new PMTiles('https://demo-bucket.protomaps.com/v4.pmtiles')
  // leafletRasterLayer(p, {}).addTo(map)
  const pos: [number, number] = [55.67512, 12.57058] // [latitude, longitude]

  return (
    <MapContainer className="w-full" center={pos} zoom={15} scrollWheelZoom={false}>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; OpenStreetMap contributors'
      />
      <Marker position={pos}>
        <Popup>Dette er rådhuset 🫡</Popup>
      </Marker>
    </MapContainer>
  )
}
