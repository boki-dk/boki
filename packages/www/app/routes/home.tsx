import type { Route } from './+types/home'
import HeroVideo from '~/components/HeroVideo'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Boki' }, { name: 'description', content: 'Find dit næste hjem med Boki' }]
}

export default function Home() {
  return (
    <div className="relative h-screen w-full overflow-hidden">
      <HeroVideo className="absolute inset-0 z-0" />
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-red-600 text-center">
        <h1 className="text-9xl font-bold bg-gradient-to-r from-pink-500 to-red-500 text-transparent bg-clip-text hover:scale-x-105 scale-y-90 transition-transform duration-500 ease-in-out">
          Boki
        </h1>
        <p className="text-xl bg-gradient-to-r from-pink-500 to-red-500 text-transparent bg-clip-text">Find dit næste hjem her</p>
      </div>
    </div>
  )
}
