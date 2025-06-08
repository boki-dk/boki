import { cn } from '~/lib/utils'

export default function HeroVideo({ className = '' }: { className?: string }) {
  return (
    <div className={cn('relative h-screen w-full overflow-hidden', className)}>
      <video autoPlay muted loop playsInline preload="auto" className="absolute top-0 left-0 w-full h-full object-cover">
        <source src="https://assets.boki.dk/hero-background.mp4" type="video/mp4" />
        Error in loading video 😞
      </video>

      {/* Optional overlay for contrast */}
      <div className="absolute top-0 left-0 w-full h-full bg-white opacity-40 z-0" />
    </div>
  )
}
