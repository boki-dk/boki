import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { LatLngBounds } from 'leaflet'
import type { ExtractSchema } from 'hono/types'
import type { AppType } from 'api/src/index'
import { PMTiles, leafletRasterLayer } from 'pmtiles'

function BoundsTracker({ onBoundsChange }: { onBoundsChange?: (bounds: LatLngBounds) => void }) {
  useMapEvents({
    load: (e) => {
      onBoundsChange?.(e.target.getBounds())
    },
    moveend: (e) => {
      onBoundsChange?.(e.target.getBounds())
    },
  })
  return null
}

export function Map({ onBoundsChange }: { onBoundsChange?: (bounds: LatLngBounds) => void }) {
  const pos: [number, number] = [55.67512, 12.57058] // Copenhagen coordinates

  return (
    <MapContainer className="w-full h-200" center={pos} zoom={15} scrollWheelZoom={false}>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; OpenStreetMap contributors'
      />
      <BoundsTracker onBoundsChange={onBoundsChange} />
    </MapContainer>
  )
}
