import { cn } from '~/lib/utils'

export default function HeroVideo({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={cn('relative overflow-hidden w-full h-full', className)}>
      <video autoPlay muted loop playsInline preload="auto" className="absolute inset-0 w-full h-full object-cover" style={style}>
        <source src="https://assets.boki.dk/hero-background.mp4" type="video/mp4" />
        Error in loading video 😞
      </video>
      {/* Optional overlay for contrast */}
      <div className="absolute top-0 left-0 w-full h-full bg-white opacity-40 z-0" />
    </div>
  )
}
