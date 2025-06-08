import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { LatLngBounds } from 'leaflet'
import type { ExtractSchema } from 'hono/types'
import type { AppType } from 'api/src/index'
import { PMTiles, leafletRasterLayer } from 'pmtiles'
import { useQuery } from '@tanstack/react-query'
import { ofetch } from 'ofetch'
import { useState, useEffect } from 'react'

type MapListings = ExtractSchema<AppType>['/listings/map']['$get']['output']

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

const COPENHAGEN: [number, number] = [55.67512, 12.57058]

export function MapListings({ onBoundsChange }: { onBoundsChange?: (bounds: LatLngBounds) => void }) {
  // const pos: [number, number] = [55.67512, 12.57058] // Copenhagen coordinates
  const [bounds, setBounds] = useState<LatLngBounds | null>(null)
  const [debouncedBounds, setDebouncedBounds] = useState<LatLngBounds | null>(null)

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedBounds(bounds)
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [bounds, 500])

  const { data: mapListings } = useQuery({
    queryKey: ['mapListings', debouncedBounds],
    queryFn: async () => {
      const results = await ofetch<MapListings>(`http://localhost:3001/listings/map`, {
        query: {
          swlat: debouncedBounds?.getSouthWest().lat,
          swlong: debouncedBounds?.getSouthWest().lng,
          nelat: debouncedBounds?.getNorthEast().lat,
          nelong: debouncedBounds?.getNorthEast().lng,
        },
      })

      return results
    },
  })

  if (!mapListings) {
    return <div>Error loading map listings</div>
  }

  return (
    <MapContainer className="w-full h-[700px]" center={COPENHAGEN} zoom={15} scrollWheelZoom={false}>
      {mapListings.length > 0 &&
        mapListings.map((address) => (
          <Marker key={address.id} position={[address.location.lat, address.location.long]}>
            <Popup>{address.displayName}</Popup>
          </Marker>
        ))}

      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; OpenStreetMap contributors'
      />

      <BoundsTracker onBoundsChange={setBounds} />
    </MapContainer>
  )
}
