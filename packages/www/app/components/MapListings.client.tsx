/*
react component that places markers in the bounding box. Bounds-aware.
*/
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { LatLngBounds } from 'leaflet'
import type { ExtractSchema } from 'hono/types'
import type { AppType } from 'api/src/index'
import { useQuery } from '@tanstack/react-query'
import { ofetch } from 'ofetch'
import { useState, useEffect } from 'react'
import { Link } from 'react-router'
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
// displayname and url
function ListingMarker({
  position,
  address,
  displayName,
  url,
}: {
  position: [number, number]
  address: MapListings[number]
  displayName: string
  url: string
}) {
  const listing = address.listings[0]
  return (
    <Marker position={position}>
      <Popup>
        <Link to={url}>{address.displayName}</Link>
        <p> Ejerlejlighed</p>
      </Popup>
    </Marker>
  )
}

function ListingMarkers({ listings }: { listings: MapListings }) {
  return (
    <>
      {listings.map((address) => (
        <ListingMarker
          key={address.id}
          // latitude is location.y, longitude is location.x
          position={[address.location.y, address.location.x]}
          address={address}
          displayName={address.displayName}
          url={`/bolig/${address.slug}`}
        />
      ))}
    </>
  )
}

export function MapListings() {
  const [bounds, setBounds] = useState<LatLngBounds>(new LatLngBounds([55.5, 12.4], [55.8, 12.7]))
  const [debouncedBounds, setDebouncedBounds] = useState<LatLngBounds>(new LatLngBounds([55.5, 12.4], [55.8, 12.7]))

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedBounds(bounds)
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [bounds, 500])

  const { data: mapListings } = useQuery({
    queryKey: ['mapListings', debouncedBounds],
    queryFn: async () => {
      const results = await ofetch<MapListings>(`https://api.boki.dk/listings/map`, {
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

  return (
    <MapContainer className="w-full h-[700px]" bounds={bounds} zoom={15} scrollWheelZoom={false}>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; OpenStreetMap contributors'
      />

      {mapListings && <ListingMarkers listings={mapListings} />}

      <BoundsTracker onBoundsChange={setBounds} />
    </MapContainer>
  )
}
