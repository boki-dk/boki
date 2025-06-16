/*
Front page (boki.dk)
*/
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import type { Route } from './+types/home'
import HeroVideo from '~/components/HeroVideo'
import { SearchInput } from '~/components/SearchInput'
import { Button } from '~/components/ui/button'
import { MapListings } from '~/components/MapListings.client'
import { useEffect, useState } from 'react'
import type { LatLngBounds } from 'leaflet'
import { Link, useNavigate } from 'react-router'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Boki' }, { name: 'description', content: 'Find dit næste hjem med Boki' }]
}

export default function Home() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  })
  const navigate = useNavigate()
  return (
    <div>
      <div className="relative h-[70vh] w-full overflow-hidden">
        <HeroVideo className="absolute inset-0" style={{ objectPosition: '50% 30%' }} />

        <div className="relative z-10 flex flex-col items-center justify-center h-full -top-15 text-center select-none cursor-default">
          <h1 className="text-9xl font-bold bg-gradient-to-r from-pink-500 to-red-500 text-transparent bg-clip-text drop-shadow-lg">
            Boki
          </h1>
          <p className="text-xl font-semibold italic bg-gradient-to-r from-pink-500 to-red-500 text-transparent bg-clip-text -mt-4 drop-shadow-lg">
            Find dit næste hjem her
          </p>
        </div>
      </div>

      <Card className="relative mx-auto max-w-2xl -mt-40">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Søg efter bolig i hele Danmark</CardTitle>
          <CardContent className="text-center mt-4">
            <SearchInput />
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Button
                onClick={() => {
                  navigate('/boliger?municipality=0101') // København Municipality
                }}
              >
                København
              </Button>

              <Button
                onClick={() => {
                  navigate('/boliger?municipality=0751') // Aarhus Municipality
                }}
              >
                Aarhus
              </Button>

              <Button
                onClick={() => {
                  navigate('/boliger?municipality=0851') // Aalborg Municipality
                }}
              >
                Aalborg
              </Button>

              <Button
                onClick={() => {
                  navigate('/boliger?municipality=0461') // Odense Municipality
                }}
              >
                Odense
              </Button>
            </div>
          </CardContent>
        </CardHeader>
      </Card>

      <div className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold mb-6">
          Velkommen til <span className="bg-gradient-to-r from-pink-500 to-red-500 text-transparent bg-clip-text">Boki.dk </span> 🏡
        </h2>
        <p className="text-lg mb-4">
          Din genvej til at finde din næste bolig i hele Danmark. Vi gør boligjagten nem og overskuelig ved at samle boliger ét sted fra
          nogle af landets største ejendomsmæglere.
          <br />
          <br />
          Hos os får du et samlet overblik over boliger til salg, da vi løbende henter data fra både Nybolig og Home. Det betyder, at du
          hurtigt kan finde drømmeboligen - uanset om du leder efter lejlighed i København, villa i Aarhus, eller rækkehus i Odense.
          <br />
          <br />
          Vi fokuserer på brugervenlighed, hastighed og fuld gennemsigtighed, så du slipper for at hoppe mellem forskellige
          mæglerhjemmesider. Med vores smarte søgefunktion og lokale genveje kan du hurtigt finde det, du leder efter.
        </p>
      </div>

      <div>
        <h2 className="text-3xl font-bold mb-6 text-center">Søg med vores interaktive kort 🗺️</h2>
        <div className="">{mounted && <MapListings />}</div>
      </div>
    </div>
  )
}
