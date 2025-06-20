import { Icon } from '@iconify/react'
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog'
import type { ExtractSchema } from 'hono/types'
import type { AppType } from 'api/src/index'
import listing from '~/routes/listing'
import { useCallback } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures'
import { Image } from '~/components/Image'

type Images = Exclude<ExtractSchema<AppType>['/listings/:listingUrlKey']['$get']['output'], { error: string }>['images']

export function LargeImageCarousel({ images }: { images: Images }) {
  // image carousel setup
  const [emblaRef, emblaApi] = useEmblaCarousel({}, [WheelGesturesPlugin()])

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  const floorPlanIndex = images.findIndex((image) => image.type !== null && image.type === 'floorplan')

  const scrollToFloorPlan = useCallback(() => {
    if (floorPlanIndex !== -1 && emblaApi) {
      emblaApi.scrollTo(floorPlanIndex)
    }
  }, [emblaApi, floorPlanIndex])

  const scrollFirst = useCallback(() => {
    if (emblaApi) emblaApi.scrollTo(0)
  }, [emblaApi])

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="cursor-pointer bg-gray-100 rounded p-1.5 shadow-sm" onClick={scrollToFloorPlan}>
          <Icon icon="carbon:fit-to-screen" className="w-6 h-6 text-gray-600" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl sm:max-w-5xl w-full h-min">
        <div className="embla relative overflow-hidden h-min">
          <div className="embla__viewport overflow-hidden rounded-lg shadow-sm select-none h-min" ref={emblaRef}>
            <div className="embla__container flex items-center h-min">
              {images.map((image, index) => (
                <div className="embla__slide min-w-0 flex-none basis-full h-min" key={image.id}>
                  <img
                    className="w-full h-auto block max-h-[90vh] object-contain rounded-lg"
                    src={image.url}
                    alt={image.alt ?? undefined}
                    width={1600}
                    loading="lazy"
                    fetchPriority="low"
                  />
                </div>
              ))}
            </div>
          </div>
          <button className="embla__prev absolute left-0 top-[calc(50%-1.25rem)] cursor-pointer" onClick={scrollPrev}>
            <Icon icon="ic:round-arrow-back-ios" className="w-10 h-10 text-gray-100 drop-shadow-sm" />
          </button>
          <button className="embla__next absolute right-0 top-[calc(50%-1.25rem)] cursor-pointer" onClick={scrollNext}>
            <Icon icon="ic:round-arrow-forward-ios" className="w-10 h-10 text-gray-100 drop-shadow-sm" />
          </button>
          {images.some((image) => image.type === 'floorplan') && (
            <div className="flex gap-2 absolute bottom-2 left-2">
              <button className="cursor-pointer bg-gray-100 rounded p-1 shadow-sm" onClick={scrollFirst}>
                <Icon icon="carbon:image" className="w-7 h-7 text-gray-600" />
              </button>
              <button className="cursor-pointer bg-gray-100 rounded p-1.5 shadow-sm" onClick={scrollToFloorPlan}>
                <Icon icon="carbon:floorplan" className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
